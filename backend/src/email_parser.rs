use std::{future::pending, path::Prefix};

use base64::Engine;
use mail_parser::{MessageParser, Message, HeaderValue};
use reqwest::Client;
use serde::Deserialize;
use anyhow::Result;



#[derive(Deserialize)]
struct RawMsg { id: String, raw: String }


struct ParsedEmail {
    subject: Option<String>,
    from_name: Option<String>,
    from_addr: Option<String>,
    text: Option<String>,
    html: Option<String>,
}


pub async fn get_parsed_email(client: &Client, token: &str, id: &str) -> Result<()> {   
        
    let bytes = fetch_email_raw_format(client, token, id).await?;
    let message = parse_into_message(&bytes);
    let extracted = extract_content(&message);

    println!("extracted subject -> {}", extracted.subject.unwrap());
    println!("extracted from addr -> {}", extracted.from_addr.unwrap());
    println!("extracted from name -> {}", extracted.from_name.unwrap());
    println!("extracted text -> {}", extracted.text.unwrap());
    println!("extracted html -> {}", extracted.html.unwrap());
    
    Ok(())
}

async fn fetch_email_raw_format(client: &Client, token: &str, id: &str) -> Result<Vec<u8>> {
    let url = format!("https://gmail.googleapis.com/gmail/v1/users/me/messages/{}?format=raw", id);
    let raw_msg: RawMsg = client.get(&url)
        .bearer_auth(token)
        .send().await?
        .error_for_status()?
        .json().await?;
    Ok(base64url_decode(&raw_msg.raw)?)
}


fn parse_into_message(bytes: &[u8]) -> mail_parser::Message<'_> {
    MessageParser::default().parse(bytes).expect("parse email")
}


fn extract_content(parsed: &Message<'_>) -> ParsedEmail {
    let subject = parsed.subject().map(|s| s.to_string());
    let (from_name, from_addr) = parsed.from()
        .and_then(|addrs| {addrs.first()})
        .map(|addr| (addr.name().map(|n| n.to_string()), addr.address().map(|a| a.to_string())))
        .unwrap_or((None, None));
    let text = parsed.body_text(0).map(|x|x.to_string());
    let html = parsed.body_html(0).map(|x| x.to_string());

    ParsedEmail {
        subject,
        from_name,
        from_addr,
        text,
        html
    }
}

fn base64url_decode(s: &str) -> Result<Vec<u8>> {
    let mut s = s.replace('-', "+").replace('_', "/");
    while s.len() % 4 != 0 { s.push('='); }
    Ok(base64::engine::general_purpose::STANDARD.decode(s)?)
}
