use std::sync::Arc;

use crate::service::{
    email_service::EmailService,
    models::ReceiptList,
    receipt_service::ReceiptService,
    user_service::{self, UserService},
};
use anyhow::{Context, Result};
use futures::lock::Mutex;

/// TODO:
///
/// Ingestor service should be run with a cronjob
/// to process and track emails relating to receipts
/// by calling EmailService's functions and stores the
/// receipts into the DB
pub struct IngestorService {
    receipt_service: ReceiptService,
    email_service: EmailService,
    user_service: UserService,
}

impl IngestorService {
    pub fn new(
        email_service: EmailService,
        receipt_service: ReceiptService,
        user_service: UserService,
    ) -> Self {
        IngestorService {
            receipt_service: receipt_service,
            email_service: email_service,
            user_service: user_service,
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
    pub async fn sync_receipts(&self) -> Result<()> {
        // get users
        let users = self
            .user_service
            .get_users_by_status(true)
            .await
            .context("Retrieving users for syncing")?;
        let mut all_receipts: ReceiptList = ReceiptList {
            transactions: Vec::new(),
        };

        // Process all users in parallel
        let handles: Vec<_> = users
            .into_iter()
            .map(|user| {
                let queries = Vec::new(); // TODO: build query string
                let email_service = self.email_service.clone(); // Assuming EmailService implements Clone
                tokio::spawn(async move {
                    email_service
                        .query_and_process_untracked(&user.email, queries)
                        .await
                })
            })
            .collect();

        for handle in handles {
            if let Ok(Ok(recipts)) = handle.await {
                all_receipts.transactions.extend(recipts.transactions);
            }
        }

        self.receipt_service.store_receipts(all_receipts).await?;
        Ok(())
    }

    pub fn get_time_query(last_synced: i64) {
        // get current time now and
    }
}
