

use serde::{Deserialize};
use regex::Regex;


#[derive(Deserialize)]
pub struct RawGmailMessage { pub id: String, pub raw: String }


pub struct ParsedEmailContent {
    pub subject: Option<String>,
    pub from_name: Option<String>,
    pub from_addr: Option<String>,
    pub text: Option<String>,
    pub html: Option<String>,
}


#[derive(Debug, Deserialize)]
pub struct GmailMessagesResponse {
    pub messages: Option<Vec<GmailMessage>>,
    #[serde(rename = "nextPageToken")]
    pub next_page_token: Option<String>,
    #[serde(rename = "resultSizeEstimate")]
    pub result_size_estimate: Option<u64>,
}

#[derive(Debug, Deserialize)]
pub struct GmailMessage {
    pub id: String,
    #[serde(rename = "threadId")]
    pub thread_id: String,
}



#[derive(Debug, Deserialize)]
pub struct Transaction {
    pub id: String,
    pub issuer: String,
    pub merchant: String,
    pub amount: f32,
    pub currency: String,
}


#[derive(Debug, Deserialize)]
struct RuleFile {
    id: String,
    detect: Detect,
    extract: Extract,
    normalize: Normalize,
}

#[derive(Debug, Deserialize)]
struct Detect {
    from_contains: Vec<String>,
    subject_re: Option<String>,
}

#[derive(Debug, Deserialize)]
struct Extract {
    // run these patterns against text lines/blocks
    patterns: Vec<String>,
}

#[derive(Debug, Deserialize)]
struct Normalize {
    currency_from_symbol: bool,
    decimal_heuristics: Option<String>, // "eu-vs-us"
    tz: Option<String>,
}

pub struct CompiledRule {
    pub id: String,
    pub from_contains: Vec<String>,
    pub subject_re: Option<Regex>,
    pub patterns: Vec<Regex>,
    pub norm: Normalize,
}