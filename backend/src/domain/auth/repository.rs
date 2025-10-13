use async_trait::async_trait;
use time::OffsetDateTime;

use std::collections::HashMap;
use tokio::sync::RwLock;

#[derive(Clone, Debug)]
pub struct TokenRecord {
    pub user_id: String,
    pub provider: String,
    pub scope: String,
    pub access_token: String,
    pub refresh_token: Option<String>,
    pub expires_at: Option<OffsetDateTime>,
    pub updated_at: OffsetDateTime,
}

#[async_trait]
pub trait TokenStore: Send + Sync {
    async fn store(&self, rec: TokenRecord) -> anyhow::Result<()>;
    async fn get(&self, user_id: &str, provider: &str) -> anyhow::Result<Option<TokenRecord>>;
    async fn update(&self, rec: TokenRecord) -> anyhow::Result<()>;
}

#[derive(Default)]
struct InMemoryTokenStore {
    inner: RwLock<HashMap<(String, String), TokenRecord>>,
}

#[async_trait]
impl TokenStore for InMemoryTokenStore {
    async fn store(&self, rec: TokenRecord) -> anyhow::Result<()> {
        self.inner
            .write()
            .await
            .insert((rec.user_id.clone(), rec.provider.clone()), rec);
        Ok(())
    }
    async fn get(&self, user_id: &str, provider: &str) -> anyhow::Result<Option<TokenRecord>> {
        Ok(self
            .inner
            .read()
            .await
            .get(&(user_id.to_string(), provider.to_string()))
            .cloned())
    }
    async fn update(&self, rec: TokenRecord) -> anyhow::Result<()> {
        self.store(rec).await
    }
}
