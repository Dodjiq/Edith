//! Configuration Module
//!
//! Loads and manages application configuration from environment variables.
//!
//! Environment variables:
//! - `PORT` - Server port used by portless and most process managers
//! - `RUST_MEDIA_PROCESSOR_PORT` - Legacy fallback server port (default: 4005)
//!
//! Related files:
//! - `main.rs` - Uses Config to initialize the server

use std::env;

#[derive(Clone)]
pub struct Config {
    pub port: u16,
}

impl Config {
    pub fn from_env() -> Self {
        Self {
            port: env::var("PORT")
                .or_else(|_| env::var("RUST_MEDIA_PROCESSOR_PORT"))
                .unwrap_or_else(|_| "4005".to_string())
                .parse()
                .expect("PORT or RUST_MEDIA_PROCESSOR_PORT must be a valid number"),
        }
    }
}
