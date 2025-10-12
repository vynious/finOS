
// use crate::domain::user::models::User;
// use crate::domain::user::repository::UserRepo;
// use anyhow::{Context, Ok, Result};

// #[derive(Clone)]
// pub struct UserService {
//     db_client: UserRepo,
// }

// impl UserService {
//     pub fn new(db_client: UserRepo) -> Self {
//         UserService {
//             db_client: db_client,
//         }
//     }

//     pub async fn get_users_by_status(&self, status: bool) -> Result<Vec<User>> {
//         Ok(self
//             .db_client
//             .find_users_by_status(status)
//             .await
//             .context("Retrieving users by status")?)
//     }

//     pub async fn register_new_user(&self, user: User) -> Result<()> {
//         let _ = self
//             .db_client
//             .insert_user(user)
//             .await
//             .context("Registering new user")?;
//         Ok(())
//     }

//     pub async fn update_last_synced(&self, users: Vec<User>) -> Result<()> {
//         let _ = self
//             .db_client
//             .bulk_update_users(users)
//             .await
//             .context("Bulk updating last_synced")?;
//         Ok(())
//     }
// }

// pub async fn 