//! Media Processor - Entry Point
//!
//! This is the main entry point for the Rust media processing server.
//! It initializes logging, loads configuration, sets up services,
//! and starts the HTTP server with CORS and tracing middleware.
//!
//! Related files:
//! - `config.rs` - Environment configuration loading
//! - `routes/mod.rs` - Route definitions and aggregation
//! - `services/ffmpeg.rs` - Audio extraction service

mod config;
mod routes;
mod services;

use axum::{extract::DefaultBodyLimit, Router};
use std::net::SocketAddr;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use crate::config::Config;
use crate::routes::{create_routes, AppServices};
use crate::services::ffmpeg::FfmpegService;

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "media_processor=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Load environment variables
    dotenvy::dotenv().ok();

    // Load configuration
    let config = Config::from_env();
    let port = config.port;

    // Initialize services
    let ffmpeg_service = FfmpegService::new().await;

    let services = AppServices {
        ffmpeg: ffmpeg_service,
    };

    // Build CORS layer
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // Build router
    let app = Router::new()
        .merge(create_routes(services))
        .layer(DefaultBodyLimit::max(5 * 1024 * 1024 * 1024)) // 5GB
        .layer(cors)
        .layer(TraceLayer::new_for_http());

    // Start server
    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    tracing::info!("Media processor server listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
