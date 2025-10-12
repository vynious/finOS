use crate::domain::{
    email::service::EmailService,
    ingestor::{service::IngestorService},
    receipt::service::ReceiptService,
    user::service::UserService,
};
use std::sync::Arc;


#[derive(Clone)]
pub struct AppState {
    pub user_service: Arc<UserService>,
    pub receipt_service: Arc<ReceiptService>,
    pub email_service: Arc<EmailService>,
    pub ingestor_service: Arc<IngestorService>,
}

impl AppState {
    pub fn new(
        user_service: Arc<UserService>,
        receipt_service: Arc<ReceiptService>,
        email_service: Arc<EmailService>,
        ingestor: Arc<IngestorService>,
    ) -> Self {
        Self {
            user_service: user_service,
            receipt_service: receipt_service,
            email_service: email_service,
            ingestor_service: ingestor,
        }
    }
}


