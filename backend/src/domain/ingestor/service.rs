use std::time::{SystemTime, UNIX_EPOCH};

use crate::domain::{
    email::service::EmailService,
    receipt::{models::ReceiptList, service::ReceiptService},
    user::{models::User, service::UserService},
};
use anyhow::{Context, Result};
use std::sync::Arc;

/// Ingestor service should be run with a cronjob
/// to process and track emails relating to receipts
/// by calling EmailService's functions and stores the
/// receipts into the DB
pub struct IngestorService {
    receipt_service: Arc<ReceiptService>,
    email_service: Arc<EmailService>,
    user_service: Arc<UserService>,
    issuers_email: Vec<String>,
}

impl IngestorService {
    pub fn new(
        email_service: Arc<EmailService>,
        receipt_service: Arc<ReceiptService>,
        user_service: Arc<UserService>,
        issuers_email: Vec<String>,
    ) -> Self {
        IngestorService {
            receipt_service: receipt_service,
            email_service: email_service,
            user_service: user_service,
            issuers_email,
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
    /// 6. Update last synced time for users
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

        // Process all users in parallel, while building an updated copy to persist
        println!("Processing all users");
        let email_service = self.email_service.clone();
        let mut updated_users: Vec<User> = Vec::with_capacity(users.len());
        let mut handles = Vec::with_capacity(users.len());

        for user in users.iter() {
            let now_ms = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .expect("Time went backwards")
                .as_millis() as i64;

            let mut user_for_task = user.clone();
            user_for_task.last_synced = Some(now_ms);
            updated_users.push(user_for_task.clone());

            let queries = self.build_query(now_ms, &user_for_task);
            let email_service = email_service.clone();
            handles.push(tokio::spawn(async move {
                email_service
                    .query_and_process_untracked(&user_for_task.email, queries)
                    .await
            }));
        }

        for handle in handles {
            if let Ok(Ok(recipts)) = handle.await {
                all_receipts.transactions.extend(recipts.transactions);
            }
        }
        // store receipts
        self.receipt_service.store(all_receipts).await?;
        // update user last synced
        self.user_service.update_last_synced(updated_users).await?;
        Ok(())
    }

    pub fn get_time_query(current_time: i64, last_synced: i64) -> String {
        let day_ms: i64 = 1000 * 60 * 60 * 24;
        let diff_ms = last_synced - current_time;
        // round up
        let diff_days = (diff_ms + day_ms - 1) / (1000 * 60 * 60 * 24);
        diff_days.to_string()
    }

    fn build_query(&self, current_time: i64, user: &User) -> Vec<String> {
        let category = "primary";
        let days: String = match user.last_synced {
            Some(last_synced) => IngestorService::get_time_query(current_time, last_synced),
            None => {
                // default 1 week
                "7".to_string()
            }
        };

        vec![
            format!("category:{}", category),
            format!("from:({})", self.issuers_email.join(" OR ")),
            format!("newer_than:{}d", days),
        ]
    }
}
