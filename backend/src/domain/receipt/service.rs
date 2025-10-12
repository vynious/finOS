use crate::{domain::models::ReceiptList, domain::receipt::repository::ReceiptRepo};
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
}
