use anyhow::{Context, Result};
use mongodb::{
    bson::{doc, DateTime, Document},
    Client, Collection,
};
use serde::{Deserialize, Serialize};
use std::env;



pub struct User {
    email: String,
    name: String,
}


pub struct UserRepo {}
impl UserRepo {}