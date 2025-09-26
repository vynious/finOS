use crate::service::{email_service::{self, EmailService}, receipt_service::ReceiptService};
use crate::db::email_repo::*;


/// TODO: 
/// 
/// Ingestor service should be run with a cronjob
/// to process and track emails relating to receipts
/// by calling EmailService's functions and stores the
/// receipts into the DB
pub struct IngestorService {
    receipt_service: ReceiptService,
    email_service: EmailService
}

impl IngestorService {
    pub fn new(model_name: String, email_db_client: EmailRepo) -> Self {
        IngestorService { 
            receipt_service: ReceiptService::new(), 
            email_service: EmailService::new(model_name, email_db_client)
        }
    }

    /// TODO: Main Orchestrator of syncing the receipts into the DB.
    /// 
    /// We can create a pool of worker threads to run the sync asynchronously for each client
    /// 
    /// 1. Get the the last sync date 
    /// 2. Craft the query for Gmail API to retrieve all from last sync date
    /// 3. Call query_and_process_untracked in EmailService 
    /// 4. Insert new receipts and tracked emails into the DB
    pub async fn sync_receipts() {}
}