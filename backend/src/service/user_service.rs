use crate::db::user_repo::{User, UserRepo};

pub struct UserService {
    db_client: UserRepo,
}

impl UserService {
    pub fn new(db_client: UserRepo) -> Self {
        UserService { db_client: db_client }
    }

    pub async fn get_all_users() {}
    pub async fn register_new_user() {}
}