use crate::domain::receipt::models::{Receipt, ReceiptList};
use anyhow::{Context, Result};
use chrono::{TimeZone, Utc};
use futures::TryStreamExt;
use mongodb::{
    bson::{doc, Document},
    Client, Collection,
};

#[derive(Clone)]
pub struct ReceiptRepo {
    collection: Collection<Receipt>,
}

impl ReceiptRepo {
    pub fn new(client: &Client, database: &str) -> Self {
        ReceiptRepo {
            collection: client.database(database).collection("receipts"),
        }
    }

    pub async fn insert(&self, receipts: ReceiptList) -> Result<()> {
        let _ = self
            .collection
            .insert_many(receipts.transactions)
            .await
            .context(format!("Failed to insert receipts"))?;
        Ok(())
    }

    async fn find_by(&self, filter: Document) -> Result<Vec<Receipt>> {
        let mut result = Vec::new();
        let mut cursor = self.collection.find(filter).await?;
        while let Some(doc) = cursor.try_next().await? {
            result.push(doc);
        }
        Ok(result)
    }

    pub async fn by_email(&self, email: &str) -> Result<Vec<Receipt>> {
        self.find_by(doc! {"email": email}).await
    }

    pub async fn by_email_and_month(
        &self,
        email: &str,
        year: i32,
        month: u32,
    ) -> Result<Vec<Receipt>> {
        // start and end timestamps for the month
        let start_date = Utc.with_ymd_and_hms(year, month, 1, 0, 0, 0).unwrap();
        let end_date = if month == 12 {
            Utc.with_ymd_and_hms(year + 1, 1, 1, 0, 0, 0).unwrap()
        } else {
            Utc.with_ymd_and_hms(year, month + 1, 1, 0, 0, 0).unwrap()
        };

        self.find_by(doc! {
            "email": email,
            "timestamp": {
                "$gte": start_date.timestamp(),
                "$lt": end_date.timestamp()
            }
        })
        .await
    }

    pub async fn by_email_and_amount(
        &self,
        email: &str,
        min_amount: f64,
        max_amount: f64,
    ) -> Result<Vec<Receipt>> {
        self.find_by(doc! {
            "email": email,
            "amount": {
                "$gte": min_amount,
                "$lte": max_amount
            }
        })
        .await
    }

    pub async fn by_email_and_merchant(&self, email: &str, merchant: &str) -> Result<Vec<Receipt>> {
        self.find_by(doc! {
            "email": email,
            "merchant": {"$regex": merchant, "$options": "i"}
        })
        .await
    }

    pub async fn get_receipts_by_month(&self, year: i32, month: u32) -> Result<Vec<Receipt>> {
        let start_date = Utc.with_ymd_and_hms(year, month, 1, 0, 0, 0).unwrap();
        let end_date = if month == 12 {
            Utc.with_ymd_and_hms(year + 1, 1, 1, 0, 0, 0).unwrap()
        } else {
            Utc.with_ymd_and_hms(year, month + 1, 1, 0, 0, 0).unwrap()
        };

        self.find_by(doc! {
            "timestamp": {
                "$gte": start_date.timestamp(),
                "$lt": end_date.timestamp()
            }
        })
        .await
    }
}
