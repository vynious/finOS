use crate::service::{email_service::EmailService, receipt_service::ReceiptService};
use anyhow::Result;

/// TODO:
///
/// Ingestor service should be run with a cronjob
/// to process and track emails relating to receipts
/// by calling EmailService's functions and stores the
/// receipts into the DB
pub struct IngestorService {
    receipt_service: ReceiptService,
    email_service: EmailService,
}

impl IngestorService {
    pub fn new(email_service: EmailService, receipt_service: ReceiptService) -> Self {
        IngestorService {
            receipt_service: receipt_service,
            email_service: email_service,
        }
    }

    /// Main Orchestrator of syncing the receipts into the DB.
    ///
    /// We can create a pool of worker threads to run the sync asynchronously for each client
    ///
    /// 1. Get the the last sync date
    /// 3. Call query_and_process_untracked in EmailService
    /// 4. Insert new receipts and tracked emails into the DB
    pub async fn sync_receipts(&self, email_addr: &str, queries: Vec<String>) -> Result<()> {
        let receipts = self
            .email_service
            .query_and_process_untracked(email_addr, queries)
            .await?;
        self.receipt_service.store_receipts(receipts).await?;
        Ok(())
    }
}
