use anyhow::{Context, Result};
use mongodb::{
    bson::{doc, DateTime, Document},
    Client, Collection,
};
use serde::{Deserialize, Serialize};
use std::{env, fmt};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrackedEmails {
    #[serde(rename = "_id")]
    pub id: String, // <-- is the user's email address
    pub email_ids: Vec<String>,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone)]
pub struct EmailRepo {
    collection: Collection<TrackedEmails>,
}

impl EmailRepo {
    pub fn new(client: &Client) -> Self {
        EmailRepo {
            collection: client
                .database(&env::var("DATABASE").expect("Unspecified Database"))
                .collection("tracked_emails"),
        }
    }

    pub async fn set_tracked_emails(
        &self,
        email_addr: &str,
        tracked_emails: Vec<String>,
    ) -> Result<()> {
        let filter = doc! { "_id": email_addr};
        let to_upsert = TrackedEmails {
            id: email_addr.to_string(),
            email_ids: tracked_emails,
            created_at: DateTime::now().timestamp_millis(),
            updated_at: DateTime::now().timestamp_millis(),
        };
        self.collection
            .replace_one(filter, to_upsert)
            .upsert(true)
            .await
            .with_context(|| format!("Failed to set tracked emails for {}", email_addr))?;
        Ok(())
    }

    pub async fn get_tracked_emails(&self, email_addr: &str) -> Result<Option<TrackedEmails>> {
        Ok(self
            .collection
            .find_one(doc! { "_id": email_addr })
            .await
            .with_context(|| format!("Failed to get tracked emails for {}", email_addr))?)
    }
}
