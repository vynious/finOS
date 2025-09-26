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
    /// 1. Get the number of existing users
    /// 2. For each users, get their latest sync timestamp 
    /// 3. Build the query string based on the latest timestamp
    /// 4. Run sync receipts for each clients with tokio workers
    /// 5. Collect all the receipts and bulk insert into store
    /// 
    /// 
    /// 
    /// 
    /// 
    /// 
    /// 
    pub async fn sync_receipts(&self, email_addr: &str, queries: Vec<String>) -> Result<()> {
        let receipts = self
            .email_service
            .query_and_process_untracked(email_addr, queries)
            .await?;


        // use futures::stream::{self, StreamExt};

        // let out: Vec<_> = stream::iter(urls)
        //     .map(|u| async move { fetch(u).await })   // -> Future<Output=Result<_>>
        //     .buffer_unordered(8)                      // at most 8 in flight
        //     .collect::<Vec<_>>()                      // Vec<Result<_>>
        //     .await
        //     .into_iter()
        //     .collect::<Result<Vec<_>, _>>()?;


        self.receipt_service.store_receipts(receipts).await?;
        Ok(())
    }
}
