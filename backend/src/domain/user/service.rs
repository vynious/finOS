use crate::domain::user::models::User;
use crate::domain::user::repository::UserRepo;
use anyhow::{Context, Result};

#[derive(Clone)]
pub struct UserService {
    db_client: UserRepo,
}

impl UserService {
    pub fn new(db_client: UserRepo) -> Self {
        UserService {
            db_client: db_client,
        }
    }

    pub async fn get_users_by_status(&self, status: bool) -> Result<Vec<User>> {
        Ok(self
            .db_client
            .find_users_by_status(status)
            .await
            .context("Retrieving users by status")?)
    }

    pub async fn register_new_user(&self, user: User) -> Result<()> {
        let _ = self
            .db_client
            .insert_user(user)
            .await
            .context("Registering new user")?;
        Ok(())
    }

    pub async fn find_by_email(&self, email: &str) -> Result<Option<User>> {
        self.db_client
            .find_user_by_email(email)
            .await
            .context("Fetching user by email")
    }

    pub async fn ensure_google_user(
        &self,
        email: &str,
        sub: &str,
        name: Option<&str>,
    ) -> Result<User> {
        if let Some(mut user) = self.find_by_email(email).await? {
            if user.google_sub.as_deref() != Some(sub) {
                self.db_client
                    .update_google_profile(email, sub, name)
                    .await?;
                user.google_sub = Some(sub.to_string());
                if let Some(new_name) = name {
                    user.name = new_name.to_string();
                }
            }
            return Ok(user);
        }

        let new_user = User {
            email: email.to_string(),
            google_sub: Some(sub.to_string()),
            name: name
                .filter(|n| !n.is_empty())
                .map(str::to_string)
                .unwrap_or_else(|| email.to_string()),
            active: true,
            last_synced: None,
            secret: None,
            gmail_token: None,
        };

        self.register_new_user(new_user.clone()).await?;
        Ok(new_user)
    }

    pub async fn update_last_synced(&self, users: Vec<User>) -> Result<()> {
        let _ = self
            .db_client
            .bulk_update_users(users)
            .await
            .context("Bulk updating last_synced")?;
        Ok(())
    }
}
