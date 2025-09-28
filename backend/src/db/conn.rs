use anyhow::{Context, Result};
use mongodb::{
    bson::{doc, Document},
    options::{ClientOptions, ServerApi, ServerApiVersion},
    Client, Collection,
};
use std::env;

pub async fn new_mongo_client() -> Result<Client> {
    println!("Generating Mongo Client");
    let db_url = env::var("MONGO_URI").expect("MONGO_URI must be set");
    let mut client_opt = ClientOptions::parse(db_url)
        .await
        .context("Failed to parse DB url")?;
    let server_api = ServerApi::builder().version(ServerApiVersion::V1).build();
    client_opt.server_api = Some(server_api);
    let client = Client::with_options(client_opt)?;
    client
        .database("fin-os-db")
        .run_command(doc! { "ping": 1 })
        .await
        .context("Failed test ping")?;
    println!("Connected!");
    Ok(client)
}
