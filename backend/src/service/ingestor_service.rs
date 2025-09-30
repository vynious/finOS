use std::{env, sync::Arc, time::{self, SystemTime, UNIX_EPOCH}};

use crate::{db::user_repo::User, service::{
    email_service::EmailService,
    models::ReceiptList,
    receipt_service::ReceiptService,
    user_service::{self, UserService},
}};
use anyhow::{Context, Result};

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
            .map(|mut user| {
                let now_ms = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .expect("Time went backwards")
                .as_millis() as i64;
                let queries = self.build_query(now_ms, &user);
                let email_service = self.email_service.clone();
                
                // update user's last synced timestamp
                user.last_synced = Some(now_ms);

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
        // store receipts
        self.receipt_service.store_receipts(all_receipts).await?;
        // update user last synced
        
        Ok(())
    }

    pub fn get_time_query(&self, current_time: i64, last_synced: i64) -> String {
        let day_ms: i64 = 1000 * 60 * 60 * 24;
        let diff_ms = last_synced - current_time;
        // round up
        let diff_days = (diff_ms + day_ms - 1)/ (1000 * 60 * 60 * 24);
        diff_days.to_string()
    }

    fn build_query(&self, current_time: i64, user: &User) -> Vec<String> {
        println!("{}", user.email);

        let category = "primary";
        let days: String =  match user.last_synced {
            Some(last_synced) => {
                self.get_time_query(current_time, last_synced)
            },
            None => {
                // default 1 week 
                "7".to_string()
            }
        };
        let raw = env::var("ISSUER_EMAILS").expect("Missing ISSUER_EMAILS");
        let issuers_email: Vec<String> = serde_json::from_str(&raw).expect("ISSUER_EMAILS must be a JSON array of strings");

        vec![format!("category:{}",category), format!("from:({})",issuers_email.join(" OR ")), format!("newer_than:{}d", days)]
    }
}
