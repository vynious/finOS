use anyhow::{Context, Result};
use futures::stream::TryStreamExt;
use mongodb::{
    bson::{doc, from_document, DateTime},
    Client, Collection,
};
use reqwest::dns::Name;
use serde::{Deserialize, Serialize};
use std::{env, vec};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct User {
    pub email: String,
    pub name: String,
    pub active: bool,
    pub last_synced: Option<i64>,
    pub secret: Option<Secret>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Secret {
    pub password: String,
}

pub struct UserRepo {
    collection: Collection<User>,
}

impl UserRepo {
    pub fn new(client: &Client) -> Self {
        UserRepo {
            collection: client
                .database(&env::var("DATABASE").expect("Unspecified Database"))
                .collection("users"),
        }
    }

    pub async fn insert_user(&self, user: User) -> Result<()> {
        let user_name = user.name.clone();
        let _ = self
            .collection
            .insert_one(user)
            .await
            .with_context(|| format!("Failed to insert user: {}", user_name))?;
        Ok(())
    }

    pub async fn find_users_by_status(&self, status: bool) -> Result<Vec<User>> {
        let mut users: Vec<User> = Vec::new();
        let mut cursor = self.collection.find(doc! {"active": status}).await?;
        while let Some(user) = cursor.try_next().await? {
            users.push(user);
        }
        Ok(users)
    }
}
