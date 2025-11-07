use anyhow::{Context, Result};
use mongodb::{
    bson::doc,
    options::{ClientOptions, ServerApi, ServerApiVersion},
    Client,
};

pub async fn new_mongo_client(mongo_uri: &str, database: &str) -> Result<Client> {
    println!("Spawning Mongo Client");
    let mut client_opt = ClientOptions::parse(mongo_uri)
        .await
        .context("Failed to parse DB url")?;
    let server_api = ServerApi::builder().version(ServerApiVersion::V1).build();
    client_opt.server_api = Some(server_api);
    let client = Client::with_options(client_opt)?;
    client
        .database(database)
        .run_command(doc! { "ping": 1 })
        .await
        .context("Failed test ping")?;
    println!("Connected!");
    Ok(client)
}
