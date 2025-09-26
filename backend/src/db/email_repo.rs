use mongodb::{bson::{doc, DateTime, Document}, Client, Collection};
use anyhow::{Result};
use serde::{Deserialize, Serialize};


#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrackedEmails {
    #[serde(rename = "_id")]
    pub id: String, // <-- is the user's email address 
    pub emails: Vec<String>,
    pub created_at: DateTime,
    pub updated_at: DateTime,
}

pub struct EmailRepo {
    collection: Collection<TrackedEmails>
}


impl EmailRepo {
    pub fn new(client: &Client) -> Self {
        EmailRepo { collection: client.database("fin-os-db").collection("tracked_emails") }
    }

    pub async fn set_tracked_emails(&self, email_addr: &str, tracked_emails: Vec<String>) -> Result<()> {
        let filter = doc! { "_id": email_addr};
        let to_upsert = TrackedEmails {
            id: email_addr.to_string(), 
            emails: tracked_emails,  
            created_at: DateTime::now(), 
            updated_at: DateTime::now()
        };
        self.collection
            .replace_one(filter, to_upsert)
            .upsert(true)
            .await?;
        Ok(())
    }

    pub async fn get_tracked_emails(&self, email_addr: &str) -> Result<Option<TrackedEmails>> {
        Ok(self.collection.find_one(doc! { "_id": email_addr }).await?)
    }
}
