use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct User {
    pub email: String,
    pub google_sub: Option<String>,
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

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PublicUser {
    pub email: String,
    pub name: String,
    pub active: bool,
    pub last_synced: Option<i64>,
    pub google_sub: Option<String>,
}

impl From<User> for PublicUser {
    fn from(value: User) -> Self {
        Self {
            email: value.email,
            name: value.name,
            active: value.active,
            last_synced: value.last_synced,
            google_sub: value.google_sub,
        }
    }
}
