//! Routes Module
//!
//! Aggregates all HTTP route handlers and creates the main router.
//! Provides the health check endpoint and delegates to sub-modules for features.
//!
//! Endpoints:
//! - `GET /health` - Health check (returns "OK")
//! - `GET /extract-audio` - Extract audio from video URL (see upload.rs)
//!
//! Related files:
//! - `main.rs` - Mounts routes into the application
//! - `upload.rs` - Audio extraction endpoint implementation
//! - `services/` - Services passed to route handlers

pub mod upload;

use axum::{routing::get, Router};

use crate::services::ffmpeg::FfmpegService;

/// Container for all application services
#[derive(Clone)]
pub struct AppServices {
    pub ffmpeg: FfmpegService,
}

pub fn create_routes(services: AppServices) -> Router {
    Router::new()
        .route("/health", get(health_check))
        .nest("/", upload::create_upload_routes(services))
}

async fn health_check() -> &'static str {
    "OK"
}
