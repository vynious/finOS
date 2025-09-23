use std::collections::{HashMap, HashSet};
use base64::Engine;
use mail_parser::{MessageParser, Message, HeaderValue};
use reqwest::Client;
use serde::{Deserialize};
use anyhow::{Result, Context};
use tokio::fs;
use yup_oauth2::{ApplicationSecret, InstalledFlowAuthenticator, AccessToken};



#[derive(Deserialize)]
struct RawGmailMessage { id: String, raw: String }


struct ParsedEmailContent {
    subject: Option<String>,
    from_name: Option<String>,
    from_addr: Option<String>,
    text: Option<String>,
    html: Option<String>,
}



fn decode_base64url(s: &str) -> Result<Vec<u8>> {
    let mut s = s.replace('-', "+").replace('_', "/");
    while s.len() % 4 != 0 { s.push('='); }
    Ok(base64::engine::general_purpose::STANDARD.decode(s)?)
}



pub struct EmailService {
    client: Client
}


#[derive(Debug, Deserialize)]
struct GmailMessagesResponse {
    messages: Option<Vec<GmailMessage>>,
    #[serde(rename = "nextPageToken")]
    next_page_token: Option<String>,
    #[serde(rename = "resultSizeEstimate")]
    result_size_estimate: Option<u64>,
}

#[derive(Debug, Deserialize)]
struct GmailMessage {
    id: String,
    #[serde(rename = "threadId")]
    thread_id: String,
}


impl EmailService {
    pub fn new() -> Self {
        EmailService { client:reqwest::Client::new() }
    }

    /// TODO: 
    pub async fn query_and_process_unseen(&self, queries: Vec<String>) -> Result<()> {
        // authentication
        // get all emails based on given query
        // filter to get untracked emails
        let mut emails = Vec::new();
        let mut seen_emails: HashSet<String> = HashSet::new();

        // get authenticated token
        let token = self.authenticate().await?;
        
        // get email ids by queries
        if let Some(token_str) = token.token() {
            println!("parsing token: {}", token_str);
            emails = self.list_all_messages(&token_str, &queries.join(" ")).await?;
        } else {
            // cooked auth failed....
        }

        // filter out emails that are seen
        let filtered_emails: Vec<&GmailMessage> = emails
        .iter()
        .filter(|email| !seen_emails.contains(&email.id))
        .collect();

        // add into seen emails
        for email in filtered_emails {
                seen_emails.insert(email.id.to_string());
        }
        
        Ok(())
    }

    /// Lists all the Messages based on the given queries.
    /// Automatically runs pagination based on the returned response
    /// For Gmail API
    pub async fn list_all_messages(&self, token: &str, combined_queries: &str) -> Result<Vec<GmailMessage>> {
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
    pub async fn authenticate(&self) -> Result<AccessToken> {
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

    async fn fetch_and_parse_email(&self, token: &str, id: &str) -> Result<()> {   
        let bytes = self.fetch_email_raw(token, id).await?;
        let message = self.parse_message(&bytes);
        let extracted = self.extract_email_content(&message);

        println!("extracted subject -> {}", extracted.subject.unwrap());
        println!("extracted from addr -> {}", extracted.from_addr.unwrap());
        println!("extracted from name -> {}", extracted.from_name.unwrap());
        println!("extracted text -> {}", extracted.text.unwrap());
        println!("extracted html -> {}", extracted.html.unwrap());
        
        Ok(())
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

}
