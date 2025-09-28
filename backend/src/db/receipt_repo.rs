use std::env;

use anyhow::{Context, Result};
use mongodb::{
    bson::{doc, DateTime, Document},
    Client, Collection,
};
use serde::{Deserialize, Serialize};

use crate::{
    db::email_repo,
    service::models::{Receipt, ReceiptList},
};

/// TODO:
///
///
///
///
///
///
///
pub struct ReceiptRepo {
    collection: Collection<Receipt>,
}

impl ReceiptRepo {
    pub fn new(client: &Client) -> Self {
        ReceiptRepo {
            collection: client
                .database(&env::var("DATABASE").expect("Unspecified Database"))
                .collection("receipts"),
        }
    }

    pub async fn insert_receipts(&self, receipts: ReceiptList) -> Result<()> {
        let _ = self
            .collection
            .insert_many(receipts.transactions)
            .await
            .context(format!("Failed to insert receipts"))?;
        Ok(())
    }

    // pub async fn update_receipt(&self, )
}
