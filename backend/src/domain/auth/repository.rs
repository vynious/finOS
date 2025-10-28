use crate::domain::auth::models::TokenRecord;
use async_trait::async_trait;
use mongodb::{
    bson::{self, doc},
    Client, Collection,
};
use time::OffsetDateTime;

#[async_trait]
pub trait TokenStore: Send + Sync {
    async fn store(&self, rec: TokenRecord) -> anyhow::Result<()>;
    async fn get(&self, user_id: &str, provider: &str) -> anyhow::Result<Option<TokenRecord>>;
    async fn update(&self, rec: TokenRecord) -> anyhow::Result<()>;
}

#[derive(Clone)]
pub struct MongoTokenStore {
    collection: Collection<TokenRecord>,
}

impl MongoTokenStore {
    pub fn new(client: &Client) -> Self {
        let db = client.database("fin-os-db");
        let collection = db.collection("tokens");
        Self { collection }
    }
}

#[async_trait]
impl TokenStore for MongoTokenStore {
    async fn store(&self, rec: TokenRecord) -> anyhow::Result<()> {
        self.collection.insert_one(rec).await?;
        Ok(())
    }

    async fn get(&self, user_id: &str, provider: &str) -> anyhow::Result<Option<TokenRecord>> {
        let filter = doc! { "user_id": user_id, "provider": provider };
        let result = self.collection.find_one(filter).await?;
        Ok(result)
    }

    async fn update(&self, rec: TokenRecord) -> anyhow::Result<()> {
        let filter = doc! { "user_id": &rec.user_id, "provider": &rec.provider };
        let update = doc! { "$set": bson::to_document(&rec)? };
        self.collection.update_one(filter, update).await?;
        Ok(())
    }
}
