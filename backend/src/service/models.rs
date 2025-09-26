use regex::Regex;
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct RawGmailMessage {
    pub id: String,
    pub raw: String,
}

pub struct ParsedEmailContent {
    pub subject: Option<String>,
    pub from_name: Option<String>,
    pub from_addr: Option<String>,
    pub text: Option<String>,
    pub html: Option<String>,
    pub timestamp: Option<i64>,
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

#[derive(Debug, Serialize, Deserialize)]
pub struct ReceiptList {
    pub transactions: Vec<Receipt>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct Receipt {
    pub msg_id: Option<String>, // Gmail message ID
    pub owner: Option<String>,
    pub issuer: Option<String>,
    pub merchant: Option<String>,
    pub amount: Option<f64>,
    pub currency: Option<String>,
    pub categories: Option<Vec<String>>,
    pub timestamp: Option<i64>,
}
