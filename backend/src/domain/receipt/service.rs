use crate::domain::receipt::{models::ReceiptList, repository::ReceiptRepo};
use anyhow::Result;

#[derive(Clone)]
pub struct ReceiptService {
    db_client: ReceiptRepo,
}

/// ReceiptService handles business logic for transactions relating to email receipts.
impl ReceiptService {
    pub fn new(db_client: ReceiptRepo) -> Self {
        ReceiptService {
            db_client: db_client,
        }
    }

    pub async fn store(&self, receipts: ReceiptList) -> Result<()> {
        println!("Storing receipts");
        self.db_client.insert(receipts).await?;
        Ok(())
    }

    pub async fn get_by(&self, email: &str) -> Result<ReceiptList> {
        println!("Getting receipts for {}", email);
        let receipts = self.db_client.by_email(email).await?;
        Ok(ReceiptList {
            transactions: receipts,
        })
    }

    pub async fn update_categories(&self, msg_id: &str, categories: Vec<String>) -> Result<()> {
        println!("Updating categories for {}", msg_id);
        self.db_client.upsert_categories(msg_id, categories).await?;
        Ok(())
    }
}
