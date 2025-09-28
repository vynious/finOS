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
    pub secret: Option<Secret>,
    pub active: bool,
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

    pub async fn find_active_users(&self) -> Result<Vec<User>> {
        let mut users: Vec<User> = Vec::new();
        let mut cursor = self.collection.find(doc! {"active": true}).await?;
        while let Some(user) = cursor.try_next().await? {
            users.push(user);
        }
        Ok(users)
    }
}
