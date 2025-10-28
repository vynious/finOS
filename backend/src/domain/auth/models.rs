use serde::{Deserialize, Serialize};
use time::OffsetDateTime;

/// Persisted OAuth token bundle for an authenticated account.
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct TokenRecord {
    pub user_id: String,
    pub account_sub: Option<String>,
    pub account_email: String,
    pub account_name: Option<String>,
    pub provider: String,
    pub scope: String,
    pub access_token: String,
    pub refresh_token: Option<String>,
    pub expires_at: Option<OffsetDateTime>,
    pub updated_at: OffsetDateTime,
}


#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub iat: i64,
    pub exp: i64,
    pub iss: String,
    pub aud: String,
    pub roles: Vec<String>,
}