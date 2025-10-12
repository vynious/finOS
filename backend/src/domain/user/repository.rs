use crate::domain::user::models::User;
use anyhow::{Context, Result};
use futures::stream::TryStreamExt;
use mongodb::{bson::doc, Client, Collection};
use std::env;

#[derive(Clone)]
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

    pub async fn bulk_update_users(&self, users: Vec<User>) -> Result<()> {
        let collection = self.collection.clone();
        let handles: Vec<_> = users
            .into_iter()
            .map(|user| {
                let collection = collection.clone();
                tokio::spawn(async move {
                    let _ = collection
                        .update_one(
                            doc! {"email": &user.email, "name": &user.name},
                            doc! {"$set": {"last_synced": user.last_synced}},
                        )
                        .await;
                })
            })
            .collect();

        for h in handles {
            let _ = h.await;
        }

        Ok(())
    }
}
