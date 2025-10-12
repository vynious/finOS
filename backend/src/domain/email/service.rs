use crate::domain::email::repository::EmailRepo;
use crate::domain::email::models::*;
use crate::domain::receipt::models::ReceiptList;
use anyhow::{bail, Context, Ok, Result};
use base64::Engine;
use ego_tree::NodeRef;
use mail_parser::{HeaderValue, Message, MessageParser};
use mongodb::bson::serde_helpers::timestamp_as_u32;
use ollama_rs::{generation::completion::request::GenerationRequest, Ollama};
use regex::{escape, Regex};
use reqwest::Client;
use scraper::{Html, Node};
use std::{
    collections::{HashMap, HashSet},
    env,
    hash::Hash,
    vec,
};
use tokio::fs;
use yup_oauth2::{AccessToken, ApplicationSecret, InstalledFlowAuthenticator};

fn decode_base64url(s: &str) -> Result<Vec<u8>> {
    let mut s = s.replace('-', "+").replace('_', "/");
    while s.len() % 4 != 0 {
        s.push('=');
    }
    Ok(base64::engine::general_purpose::STANDARD.decode(s)?)
}

fn build_keyword_regex(words: &[&str]) -> Regex {
    let body = words
        .iter()
        .map(|w| escape(w))
        .collect::<Vec<_>>()
        .join("|");
    Regex::new(&format!(r"(?i)\b(?:{})\b", body)).unwrap()
}

#[derive(Clone)]
pub struct EmailService {
    client: Client,
    ollama: Ollama,
    db_client: EmailRepo,
    model_name: String,
}

impl EmailService {
    /// Creates a new `EmailService`, loading `OLLAMA_MODEL` from the environment
    /// and initializing the HTTP and Ollama clients.
    pub fn new(model_name: String, db_client: EmailRepo) -> Self {
        EmailService {
            model_name: model_name,
            client: reqwest::Client::new(),
            ollama: Ollama::default(),
            db_client: db_client,
        }
    }

    /// Returns the set of previously processed (tracked) email IDs.
    async fn get_tracked_emails(&self, email_addr: &str) -> Result<HashSet<String>> {
        println!("Retrieving tracked emails for user: {}", email_addr);
        if let Some(tracked_emails) = self
            .db_client
            .get_tracked_emails(email_addr)
            .await
            .with_context(|| format!("Getting tracked emails for {}", email_addr))?
        {
            Ok(tracked_emails.email_ids.into_iter().collect())
        } else {
            Ok(HashSet::new())
        }
    }

    /// Persists the provided tracked email IDs.
    async fn update_tracked_emails(
        &self,
        email_addr: &str,
        tracked_emails: HashSet<String>,
    ) -> Result<()> {
        let tracked_emails_list: Vec<String> = tracked_emails.into_iter().collect();
        self.db_client
            .set_tracked_emails(email_addr, tracked_emails_list)
            .await
            .with_context(|| format!("Updating tracked emails for {}", email_addr))?;
        Ok(())
    }

    /// Queries Gmail using the provided search terms, fetches and parses
    /// untracked messages, extracts receipts with Ollama, and returns all
    /// parsed transactions. Updates the tracked email IDs afterward.
    pub async fn query_and_process_untracked(
        &self,
        email_addr: &str,
        queries: Vec<String>,
    ) -> Result<ReceiptList> {
        println!("Processing...");
        let mut tracked_emails: HashSet<String> = self.get_tracked_emails(email_addr).await?;
        let mut all_receipts: ReceiptList = ReceiptList {
            transactions: Vec::new(),
        };

        // get authenticated token
        let token = EmailService::authenticate().await?;

        // derive token string once
        let token_str = match token.token() {
            Some(ts) => ts.to_string(),
            None => bail!("Failed to obtain access token"),
        };

        println!("Getting emails based on queries");

        // get email ids by queries
        let emails = self
            .list_all_messages(&token_str, &queries.join(" "))
            .await?;

        // omit out emails that are seen
        let untracked_emails: Vec<&GmailMessage> = emails
            .iter()
            .filter(|email| !tracked_emails.contains(&email.id))
            .collect();

        // build regex for filtering unwanted emails without these keywords
        let re = build_keyword_regex(&["transaction", "spent", "payment"]);

        // add into seen emails
        for email in untracked_emails {
            println!("Checking email: {}", email.id);
            tracked_emails.insert(email.id.to_string());
            let parsed_email_content = self.fetch_and_parse_email(&token_str, &email.id).await?;

            // check if email subject is something we want to parse
            if !re.is_match(parsed_email_content.subject.as_deref().unwrap()) {
                println!(
                    "Skipping {}",
                    parsed_email_content.subject.as_deref().unwrap()
                );
                continue;
            }

            let issuer = parsed_email_content.from_name.as_deref().unwrap();

            // get receipts from ollama
            let receipts = self
                .parse_with_ollmao(&parsed_email_content.html.unwrap())
                .await?;

            // save the receipts
            for mut receipt in receipts.transactions {
                receipt.msg_id = Some(email.id.to_string());
                receipt.issuer = Some(issuer.to_string());
                receipt.owner = Some(email_addr.to_string());
                receipt.timestamp = Some(parsed_email_content.timestamp.clone().unwrap());
                all_receipts.transactions.push(receipt);
            }
        }

        println!("All Receipts -> {:#?}", all_receipts);

        // update tracked emails
        self.update_tracked_emails(email_addr, tracked_emails)
            .await?;
        Ok(all_receipts)
    }

    /// Lists all the Messages based on the given queries.
    /// Automatically runs pagination based on the returned response
    /// For Gmail API
    /// Lists Gmail messages matching the query string, following pagination
    /// until all pages are retrieved.
    async fn list_all_messages(
        &self,
        token: &str,
        combined_queries: &str,
    ) -> Result<Vec<GmailMessage>> {
        let mut all_messages: Vec<GmailMessage> = Vec::new();
        let mut current_page_token: Option<String> = None;
        println!("Combined query: {}", combined_queries);
        // Run pagination on the query
        loop {
            let mut req = self
                .client
                .get("https://gmail.googleapis.com/gmail/v1/users/me/messages")
                .bearer_auth(token)
                .query(&[("q", combined_queries)]);

            if let Some(tok) = &current_page_token {
                req = req.query(&[("pageToken", tok)]);
            }

            let resp: GmailMessagesResponse = req.send().await?.error_for_status()?.json().await?;

            if let Some(mut messages) = resp.messages {
                all_messages.append(&mut messages);
            }

            if let Some(tok) = resp.next_page_token {
                current_page_token = Some(tok);
            } else {
                break;
            }
        }
        println!("Found {} emails to parse", all_messages.len());
        Ok(all_messages)
    }

    /// Runs authentication based on the client_secret and returns the AccessToken
    /// Performs OAuth installed-flow and returns a Gmail Readonly access token.
    async fn authenticate() -> Result<AccessToken> {
        // load client secret
        println!("Running email authentication");
        let secret_str = fs::read_to_string("client_secret_web.json")
            .await
            .context("parsing web secret")?;
        let secret: ApplicationSecret = serde_json::from_str(&secret_str).map_err(|e| {
            eprintln!("failed to parse {}", e);
            e
        })?;

        // create auth
        let auth = InstalledFlowAuthenticator::builder(
            secret,
            yup_oauth2::InstalledFlowReturnMethod::HTTPRedirect,
        )
        .persist_tokens_to_disk("tokencache.json")
        .build()
        .await
        .with_context(|| "Getting auth from secret")?;

        // get readonly token
        let token = auth
            .token(&["https://www.googleapis.com/auth/gmail.readonly"])
            .await
            .with_context(|| "Getting Access Token")?;
        Ok(token)
    }

    /// Retrieves the email based on the GmailMessage ID and extracts the content
    /// Fetches a Gmail message by ID and extracts normalized content
    /// (subject, from, text, html).
    async fn fetch_and_parse_email(&self, token: &str, id: &str) -> Result<ParsedEmailContent> {
        let bytes = self.fetch_email_raw(token, id).await?;
        let message = self.parse_message(&bytes);
        let extracted = EmailService::extract_email_content(&message);
        Ok(extracted)
    }

    /// Downloads raw RFC822 bytes of a Gmail message and base64url-decodes them.
    async fn fetch_email_raw(&self, token: &str, id: &str) -> Result<Vec<u8>> {
        let url = format!(
            "https://gmail.googleapis.com/gmail/v1/users/me/messages/{}?format=raw",
            id
        );
        let raw_msg: RawGmailMessage = self
            .client
            .get(&url)
            .bearer_auth(token)
            .send()
            .await?
            .error_for_status()?
            .json()
            .await?;
        Ok(decode_base64url(&raw_msg.raw)?)
    }

    /// Parses RFC822 bytes into a `mail_parser::Message`.
    fn parse_message<'a>(&self, bytes: &'a [u8]) -> mail_parser::Message<'a> {
        MessageParser::default().parse(bytes).expect("parse email")
    }

    /// Extracts high-level fields into `ParsedEmailContent` for downstream use.
    fn extract_email_content(parsed: &Message<'_>) -> ParsedEmailContent {
        let subject = parsed.subject().map(|s| s.to_string());
        let timestamp = parsed.date().map(|dt| dt.to_timestamp());
        let (from_name, from_addr) = parsed
            .from()
            .and_then(|addrs| addrs.first())
            .map(|addr| {
                (
                    addr.name().map(|n| n.to_string()),
                    addr.address().map(|a| a.to_string()),
                )
            })
            .unwrap_or((None, None));
        let text = parsed.body_text(0).map(|x| x.to_string());
        let html = parsed.body_html(0).map(|x| x.to_string());

        ParsedEmailContent {
            subject,
            from_name,
            from_addr,
            text,
            html,
            timestamp,
        }
    }

    /// Converts HTML into visible text by traversing the DOM and removing
    /// non-visible nodes and redundant whitespace/newlines.
    fn html_to_text(html: &str) -> String {
        let doc = Html::parse_document(html);

        // gather text by walking the DOM and skipping non-visible containers.
        // remove css styles and html syntax stuff.
        let mut buf = String::new();
        fn walk(n: NodeRef<Node>, out: &mut String) {
            match n.value() {
                Node::Text(t) => {
                    out.push_str(t);
                }
                Node::Element(el) => {
                    let name = el.name();
                    // skip non-visible content entirely
                    if matches!(name, "style" | "script" | "noscript" | "template" | "head") {
                        return;
                    }
                    // Line breaks for some block-ish tags
                    if matches!(
                        name,
                        "br" | "p"
                            | "div"
                            | "li"
                            | "tr"
                            | "section"
                            | "article"
                            | "header"
                            | "footer"
                            | "h1"
                            | "h2"
                            | "h3"
                            | "h4"
                            | "h5"
                            | "h6"
                    ) {
                        if !out.ends_with('\n') {
                            out.push('\n');
                        }
                    }
                    for c in n.children() {
                        walk(c, out);
                    }
                    if matches!(name, "p" | "div" | "li" | "tr" | "section" | "article") {
                        if !out.ends_with('\n') {
                            out.push('\n');
                        }
                    }
                    return;
                }
                _ => {}
            }
            for c in n.children() {
                walk(c, out);
            }
        }
        walk(doc.tree.root(), &mut buf);

        // char fixes
        let mut t = buf
            .replace('\u{00a0}', " ") // nbsp
            .replace('\u{200b}', ""); // zero-width

        // collapse intra-line spaces; keep newlines
        let re_intraline = Regex::new(r"[ \t]+").unwrap();
        t = re_intraline.replace_all(&t, " ").into_owned();

        // collapse multiple newlines
        let re_newlines = Regex::new(r"\n{2,}").unwrap();
        t = re_newlines.replace_all(&t, "\n").into_owned();

        // trim lines & drop empties
        t.lines()
            .map(|l| l.trim())
            .filter(|l| !l.is_empty())
            .collect::<Vec<_>>()
            .join("\n")
    }

    /// Uses the configured Ollama model to extract structured `ReceiptList`
    /// from email HTML by prompting an LLM and parsing JSON output.
    async fn parse_with_ollmao(&self, raw: &str) -> Result<ReceiptList> {
        println!("Parsing with Ollama: {}", self.model_name);
        let text = EmailService::html_to_text(raw);
        let prompt = format!("Identify the transactions in this text \n {} \n and Return ONLY valid JSON for the schema: {{ 'transactions': [ {{'merchant': '...', 'amount': 0.0, 'currency': '...'}} ] }}", text);
        let res = self
            .ollama
            .generate(
                GenerationRequest::new(self.model_name.clone(), prompt)
                    .format(ollama_rs::generation::parameters::FormatType::Json),
            )
            .await?;
        // println!("Ollama response: {}", res.response);
        let result: ReceiptList = serde_json::from_str(&res.response)?;
        Ok(result)
    }
}
