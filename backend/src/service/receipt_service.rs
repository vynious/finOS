use crate::{db::receipt_repo::ReceiptRepo, service::models::ReceiptList};
use anyhow::Result;



pub struct ReceiptService {
    db_client: ReceiptRepo
}


/// ReceiptService handles business logic for transactions relating to email receipts.
impl ReceiptService {
    pub fn new(db_client: ReceiptRepo) -> Self { ReceiptService { db_client: db_client } }

    pub async fn store_receipts(&self, receipts: ReceiptList) -> Result<()>{
        println!("Storing receipts");
        self.db_client.insert_receipts(receipts).await?;
        Ok(())
    }
}

