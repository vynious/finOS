use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct User {
    pub email: String,
    pub name: String,
    pub active: bool,
    pub last_synced: Option<i64>,
    pub secret: Option<Secret>,
    pub gmail_token: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Secret {
    pub password: String,
}
