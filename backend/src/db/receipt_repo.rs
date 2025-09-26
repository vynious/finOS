use std::collections;

use mongodb::{bson::{doc, DateTime, Document}, Client, Collection};
use anyhow::{Result};
use reqwest::header::REFERER;
use serde::{Deserialize, Serialize};

use crate::service::models::{Receipt, ReceiptList};

/// TODO:
/// 
/// 
/// 
/// 
/// 
/// 
/// 
pub struct ReceiptRepo {
    collection: Collection<Receipt>
}

impl ReceiptRepo {
    pub fn new(client: &Client) -> Self {
        ReceiptRepo { collection: client.database("fin-os-db").collection("receipts") }
    }

    pub async fn insert_receipts(&self,receipts: ReceiptList) -> Result<()> {
        let _ = self.collection.insert_many(receipts.transactions).await?;
        Ok(())
    }

    // pub async fn update_receipt(&self, )

}