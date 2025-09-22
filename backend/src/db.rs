use mongodb::{ 
	bson::{Document, doc},
	Client,
	Collection 
};
use anyhow::Result;


struct MongoService {}

impl MongoService {
    fn new() -> Self {
        MongoService {  }
    }
    async fn get_db_client() {}
    async fn get_seen_emails() {}
    async fn upsert_seen_emails() {}
}

