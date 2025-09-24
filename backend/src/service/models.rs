

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
pub struct Receipt {
    pub id: String, // Gmail message ID
    pub issuer: String,
    pub merchant: String,
    pub amount: String,
    pub currency: String,
}


#[derive(Debug, Deserialize)]
pub struct RuleFile {
    pub id: String,
    pub detect: Detect,
    pub extract: Extract,
    pub normalize: Normalize,
}

#[derive(Debug, Deserialize)]
pub struct Detect {
    pub from_contains: Vec<String>,
    pub subject_re: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct Extract {
    // run these patterns against text lines/blocks
    pub patterns: Vec<String>,
}

#[derive(Debug, Deserialize)]
pub struct Normalize {
    pub currency_from_symbol: bool,
    pub decimal_heuristics: Option<String>, // "eu-vs-us"
    pub tz: Option<String>,
}

pub struct CompiledRule {
    pub id: String,
    pub from_contains: Vec<String>,
    pub subject_re: Option<Regex>,
    pub patterns: Vec<Regex>,
    pub norm: Normalize,
}