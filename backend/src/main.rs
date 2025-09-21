use std::collections::{HashMap, HashSet};

use anyhow::{Context, Error, Ok, Result};
use axum::{
    Router,
    routing::get
};
use reqwest::Client;
use serde::Deserialize;
use tokio::fs;
use yup_oauth2::{AccessToken, ApplicationSecret, InstalledFlowAuthenticator};


#[tokio::main]
async fn main() {

    // let app = Router::new().route("/", get(|| async {"Hello World"}));
    // let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    // axum::serve(listener, app).await.unwrap();
    let _ = query_email(vec!["".to_string()]).await;

    println!("Hello, world!");
}



#[derive(Debug, Deserialize)]
struct GmailListResponse {
    messages: Option<Vec<Message>>,
    #[serde(rename = "nextPageToken")]
    next_page_token: Option<String>,
    #[serde(rename = "resultSizeEstimate")]
    result_size_estimate: Option<u64>,
}

#[derive(Debug, Deserialize)]
struct Message {
    id: String,
    #[serde(rename = "threadId")]
    thread_id: String,
}


/// TODO: 
async fn query_email(queries: Vec<String>) -> Result<()> {
    // authentication
    // get all emails based on given query
    // filter to get untracked emails
    let client = Client::new();
    let mut emails = Vec::new();
    let seen_emails: HashSet<String> = HashSet::new();

    // get authenticated token
    let token = authenticate_connection().await?;
    
    // get email ids by queries
    if let Some(token_str) = token.token() {
        emails = list_all_message(&client, &token_str, &queries.join(" ")).await?;
    } else {
        // cooked auth failed....
    }

    // filter out emails that are seen
    let filtered_emails: Vec<&Message> = emails
    .iter()
    .filter(|email| !seen_emails.contains(&email.id))
    .collect();

    Ok(())
}


/// Lists all the Messages based on the given queries.
/// Automatically runs pagination based on the returned response
async fn list_all_message(client: &Client, token: &str, combined_queries: &str) -> Result<Vec<Message>> {
    let mut all_messages: Vec<Message> = Vec::new();
    let mut current_page_token: Option<String> = None;

    // Run pagination on the query
    loop {
        let mut req = client
        .get("https://gmail.googleapis.com/gmail/v1/users/me/messages")
        .bearer_auth(token)
        .query(&[("q", combined_queries)]);

        if let Some(tok) = &current_page_token {
            req = req.query(&[("pageToken", tok)]);
        }

        let resp: GmailListResponse = req.send().await?.error_for_status()?.json().await?;

        if let Some(mut messages) = resp.messages {
            all_messages.append(&mut messages);
        }
        
        if let Some(tok) = resp.next_page_token {
            current_page_token = Some(tok);
        } else{ 
            break;
        }
    }
    Ok(all_messages)
}


/// Runs authentication based on the client_secret and returns the AccessToken
async fn authenticate_connection() -> Result<AccessToken> {
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