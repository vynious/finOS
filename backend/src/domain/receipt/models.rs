use serde::{Deserialize, Serialize};

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
