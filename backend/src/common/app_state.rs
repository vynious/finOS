


use crate::domain::{
    email::service::EmailService,
    receipt::service::ReceiptService,
    user::service::UserService,
};
use std::sync::Arc;


pub struct AppState {
    pub user_service: Arc<UserService>,
    pub receipt_service: Arc<ReceiptService>,
    pub email_service: Arc<EmailService>,
}


impl AppState {
    pub fn new(user_service: Arc<UserService>, receipt_service: Arc<ReceiptService>, email_service: Arc<EmailService>) -> Self {
        Self {
            user_service: user_service,
            receipt_service: receipt_service,
            email_service: email_service,
        }
    }
}