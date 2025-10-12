


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
    pub fn new(user_service: UserService, receipt_service: ReceiptService, email_service: EmailService) -> Self {
        Self {
            user_service: Arc::new(user_service),
            receipt_service: Arc::new(receipt_service),
            email_service: Arc::new(email_service),
        }
    }
}