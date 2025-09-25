use std::collections::{HashMap, HashSet};
use base64::Engine;
use mail_parser::{MessageParser, Message, HeaderValue};
use reqwest::Client;
use regex::{escape, Regex};
use ego_tree::NodeRef;
use scraper::{Html, Node};
use anyhow::{bail, Context, Ok, Result};
use tokio::fs;
use yup_oauth2::{ApplicationSecret, InstalledFlowAuthenticator, AccessToken};
use ollama_rs::{generation::completion::request::GenerationRequest, Ollama};
use super::models::*;


fn decode_base64url(s: &str) -> Result<Vec<u8>> {
    let mut s = s.replace('-', "+").replace('_', "/");
    while s.len() % 4 != 0 { s.push('='); }
    Ok(base64::engine::general_purpose::STANDARD.decode(s)?)
}



fn build_keyword_regex(words: &[&str]) -> Regex {
    let body = words.iter().map(|w| escape(w)).collect::<Vec<_>>().join("|");
    Regex::new(&format!(r"(?i)\b(?:{})\b", body)).unwrap()
}


pub struct EmailService {
    client: Client,
    ollama: Ollama
}


impl EmailService {
    pub fn new() -> Self {
        EmailService { 
            client:reqwest::Client::new(),
            ollama: Ollama::default()
        }
    }

    // TODO: 
    pub async fn query_and_process_unseen(&self, queries: Vec<String>) -> Result<()> {
        // authentication
        // get all emails based on given query
        // filter to get untracked emails
        let mut emails = Vec::new();
        let mut seen_emails: HashSet<String> = HashSet::new();

        // get authenticated token
        let token = self.authenticate().await?;
        
        // derive token string once
        let token_str = match token.token() {
            Some(ts) => ts.to_string(),
            None => bail!("failed to obtain access token"),
        };

        // get email ids by queries
        println!("parsing token: {}", token_str);
        emails = self.list_all_messages(&token_str, &queries.join(" ")).await?;

        // omit out emails that are seen
        let filtered_emails: Vec<&GmailMessage> = emails
        .iter()
        .filter(|email| !seen_emails.contains(&email.id))
        .collect();
        let re = build_keyword_regex(&["transaction", "spent", "payment"]);
        // add into seen emails
        for email in filtered_emails {
            println!("checking email: {}", email.id);
            seen_emails.insert(email.id.to_string());
            let parsed_email_content = self.fetch_and_parse_email(&token_str, &email.id).await?;
            // check if email subject is something we want to parse 
            if !re.is_match(parsed_email_content.subject.as_deref().unwrap()) {
                println!("skipped 1... {}", parsed_email_content.subject.as_deref().unwrap());
                continue;
            }
            let receipts = self.parse_with_ollmao(&email.id, &parsed_email_content.html.unwrap(), parsed_email_content.from_name.as_deref().unwrap()).await?;
            for receipt in receipts.transactions {
                println!("Issuer: {}", receipt.issuer.unwrap());
                println!("Merchant: {}", receipt.merchant.unwrap());
                println!("Currency: {}", receipt.currency.unwrap());
                println!("Amount: {}", receipt.amount.unwrap());
                println!("ID: {}", receipt.id.unwrap());
            }
        }




        // TODO:
        // iterate over the new emails, retrieve its details and do additional 
        // filtering on the type of email, if its a receipt of a transaction/payment 
        // parse the details out into a Transaction struct and store into the database
        // we should also store the latest processed email, so when we poll we can poll 
        // from that timestamp onwards this acts like a checkpoint to 
        // optimise the retrieval of the emails.


        Ok(())
    }

    /// Lists all the Messages based on the given queries.
    /// Automatically runs pagination based on the returned response
    /// For Gmail API
    async fn list_all_messages(&self, token: &str, combined_queries: &str) -> Result<Vec<GmailMessage>> {
        let mut all_messages: Vec<GmailMessage> = Vec::new();
        let mut current_page_token: Option<String> = None;

        // Run pagination on the query
        loop {
                let mut req = self.client
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
                break;
            } else{ 
                break;
            }
        }
        Ok(all_messages)
    }


    /// Runs authentication based on the client_secret and returns the AccessToken
    async fn authenticate(&self) -> Result<AccessToken> {
        // load client secret  
        println!("running email authentication");
        let secret_str = fs::read_to_string("client_secret_web.json").await.context("parsing web secret")?;
        let secret: ApplicationSecret = serde_json::from_str(&secret_str).map_err(|e| {
            eprintln!("failed to parse {}", e);
            e
        })?;
        
        // create auth
        let auth = InstalledFlowAuthenticator::builder(
            secret, yup_oauth2::InstalledFlowReturnMethod::HTTPRedirect)
        .persist_tokens_to_disk("tokencache.json")
        .build()
        .await?;

        // get readonly token
        let token = auth
        .token(&["https://www.googleapis.com/auth/gmail.readonly"])
        .await?;

        Ok(token)
    }

    /// Retrieves the email based on the GmailMessage ID and extracts the content
    async fn fetch_and_parse_email(&self, token: &str, id: &str) -> Result<ParsedEmailContent> {   
        let bytes = self.fetch_email_raw(token, id).await?;
        let message = self.parse_message(&bytes);
        let extracted = self.extract_email_content(&message);
        Ok(extracted)
    }

    async fn fetch_email_raw(&self, token: &str, id: &str) -> Result<Vec<u8>> {
        let url = format!("https://gmail.googleapis.com/gmail/v1/users/me/messages/{}?format=raw", id);
        let raw_msg: RawGmailMessage = self.client.get(&url)
            .bearer_auth(token)
            .send().await?
            .error_for_status()?
            .json().await?;
        Ok(decode_base64url(&raw_msg.raw)?)
    }


    fn parse_message<'a>(&self, bytes: &'a [u8]) -> mail_parser::Message<'a> {
        MessageParser::default().parse(bytes).expect("parse email")
    }


    fn extract_email_content(&self, parsed: &Message<'_>) -> ParsedEmailContent {
        let subject = parsed.subject().map(|s| s.to_string());
        let (from_name, from_addr) = parsed.from()
            .and_then(|addrs| {addrs.first()})
            .map(|addr| (addr.name().map(|n| n.to_string()), addr.address().map(|a| a.to_string())))
            .unwrap_or((None, None));
        let text = parsed.body_text(0).map(|x|x.to_string());
        let html = parsed.body_html(0).map(|x| x.to_string());

        ParsedEmailContent {
            subject,
            from_name,
            from_addr,
            text,
            html
        }
    }


    fn html_to_text(&self, html: &str) -> String {
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
                    if matches!(name, "br" | "p" | "div" | "li" | "tr" | "section" | "article" |
                                    "header" | "footer" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6") {
                        if !out.ends_with('\n') { out.push('\n'); }
                    }
                    for c in n.children() { walk(c, out); }
                    if matches!(name, "p" | "div" | "li" | "tr" | "section" | "article") {
                        if !out.ends_with('\n') { out.push('\n'); }
                    }
                    return;
                }
                _ => {}
            }
            for c in n.children() { walk(c, out); }
        }
        walk(doc.tree.root(), &mut buf);

        // char fixes
        let mut t = buf.replace('\u{00a0}', " ")  // nbsp
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



    async fn parse_with_ollmao(&self, id: &str, raw: &str, issuer: &str) -> Result<ReceiptList>{
        println!("trying to parse with ollama");
        let text = self.html_to_text(raw);
        let model = "qwen2.5:7b".to_string();
        let prompt = format!("Issuer: {}. Use this {} as the ID and ignore the one in the text. Identify the transactions in this text \n {} \n and Return ONLY valid JSON for the schema: {{ 'transactions': [ {{ 'id': '...', 'merchant': '...', 'amount': 0.0, 'currency': '...', 'issuer': '...' }} ] }}", issuer, id, text);
        let res = self.ollama
            .generate(GenerationRequest::new(model, prompt)
            .format(ollama_rs::generation::parameters::FormatType::Json))
            .await?;
        println!("ollama response: {}", res.response);
        let val: ReceiptList = serde_json::from_str(&res.response)?;
        Ok(val)
    }

}
