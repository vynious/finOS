use serde::Deserialize;

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
