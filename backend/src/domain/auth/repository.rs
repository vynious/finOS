use crate::domain::auth::models::TokenRecord;
use async_trait::async_trait;
use mongodb::{
    bson::{self, doc},
    Client, Collection,
};

#[async_trait]
pub trait TokenStore: Send + Sync {
    async fn store(&self, rec: TokenRecord) -> anyhow::Result<TokenRecord>;
    async fn get(&self, user_id: &str, provider: &str) -> anyhow::Result<Option<TokenRecord>>;
    async fn update(&self, rec: TokenRecord) -> anyhow::Result<TokenRecord>;
}

#[derive(Clone)]
pub struct MongoTokenStore {
    collection: Collection<TokenRecord>,
}

impl MongoTokenStore {
    pub fn new(client: &Client, database: &str) -> Self {
        let db = client.database(database);
        let collection = db.collection("tokens");
        Self { collection }
    }
}

#[async_trait]
impl TokenStore for MongoTokenStore {
    async fn store(&self, rec: TokenRecord) -> anyhow::Result<TokenRecord> {
        self.collection.insert_one(rec.clone()).await?;
        Ok(rec)
    }

    async fn get(&self, user_id: &str, provider: &str) -> anyhow::Result<Option<TokenRecord>> {
        let filter = doc! { "user_id": user_id, "provider": provider };
        let result = self.collection.find_one(filter).await?;
        Ok(result)
    }

    async fn update(&self, rec: TokenRecord) -> anyhow::Result<TokenRecord> {
        let filter = doc! { "user_id": &rec.user_id, "provider": &rec.provider };
        let update = doc! { "$set": bson::to_document(&rec)? };
        self.collection.update_one(filter, update).await?;
        Ok(rec)
    }
}
