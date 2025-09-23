use mongodb::{ 
	bson::{Document, doc},
	Client,
	Collection,
    options::{ClientOptions, ServerApi, ServerApiVersion}
};
use anyhow::Result;
use serde_json::ser;
use std::env;


pub async fn new_mongo_client() -> Result<Client> {
    let db_url = env::var("MONGO_URI").expect("MONGO_URI must be set");
    let mut client_opt = ClientOptions::parse(db_url).await?;
    let server_api = ServerApi::builder().version(ServerApiVersion::V1).build();
    client_opt.server_api = Some(server_api);
    let client = Client::with_options(client_opt)?;
    Ok(client)
}