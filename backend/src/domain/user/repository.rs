use crate::domain::user::models::User;
use anyhow::{Context, Result};
use futures::stream::TryStreamExt;
use mongodb::{bson::doc, Client, Collection};

#[derive(Clone)]
pub struct UserRepo {
    collection: Collection<User>,
}

impl UserRepo {
    pub fn new(client: &Client, database: &str) -> Self {
        UserRepo {
            collection: client.database(database).collection("users"),
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

    pub async fn find_user_by_email(&self, email: &str) -> Result<Option<User>> {
        let user = self
            .collection
            .find_one(doc! { "email": email })
            .await
            .context("Failed to query user by email")?;
        Ok(user)
    }

    pub async fn update_google_profile(
        &self,
        email: &str,
        sub: &str,
        name: Option<&str>,
        access: &str,
    ) -> Result<()> {
        self.collection
            .update_one(
                doc! { "email": email },
                doc! {
                    "$set": {
                        "google_sub": sub,
                        "name": name.unwrap_or(email),
                        "active": true,
                        "gmail_token": Some(access.to_string())
                    }
                },
            )
            .await
            .context("Updating google profile fields")?;
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
