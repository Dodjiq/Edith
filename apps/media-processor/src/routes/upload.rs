//! Audio Extraction Route Handler
//!
//! Provides audio extraction from video files for transcription pipeline.
//!
//! Endpoints:
//! - GET /extract-audio?url=<presigned_url> - Extract audio from video URL, returns MP3
//!
//! Flow:
//! 1. NestJS server uploads video to S3 via multipart
//! 2. NestJS calls /extract-audio with presigned S3 URL
//! 3. This service extracts audio via FFmpeg and returns MP3
//! 4. NestJS sends MP3 to ElevenLabs Scribe v2 for transcription

use axum::{
    extract::{Query, State},
    http::StatusCode,
    response::IntoResponse,
    routing::get,
    Router,
};
use serde::Deserialize;
use std::sync::Arc;

use crate::routes::AppServices;

#[derive(Deserialize)]
pub struct ExtractAudioQuery {
    pub url: String,
}

pub fn create_upload_routes(services: AppServices) -> Router {
    Router::new()
        .route("/extract-audio", get(handle_extract_audio))
        .with_state(Arc::new(services))
}

/// Extract audio from a URL and return as MP3.
/// Streams the video from the URL, extracts audio via FFmpeg, returns MP3 binary.
/// This is used for large video files before sending to ElevenLabs Scribe v2.
///
/// Optimized with:
/// - Reduced probesize (32KB vs 5MB) for faster format detection
/// - Limited analyzeduration (0.5s vs 5s) for quicker stream analysis
/// - HTTP reconnection for reliability
/// - Multi-threaded decoding
async fn handle_extract_audio(
    State(services): State<Arc<AppServices>>,
    Query(params): Query<ExtractAudioQuery>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let url = params.url;
    tracing::info!("Extracting audio from URL: {}", &url[..url.len().min(100)]);

    if !services.ffmpeg.can_extract_audio("video/mp4") {
        return Err((
            StatusCode::SERVICE_UNAVAILABLE,
            "FFmpeg not available".to_string(),
        ));
    }

    let start = std::time::Instant::now();

    let audio_data = services
        .ffmpeg
        .extract_audio_from_url(&url)
        .await
        .map_err(|e| {
            tracing::error!("FFmpeg extraction failed: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Audio extraction failed: {}", e),
            )
        })?;

    let duration = start.elapsed();
    tracing::info!(
        "Audio extraction complete: {} bytes in {:.2}s",
        audio_data.len(),
        duration.as_secs_f64()
    );

    Ok((
        [(axum::http::header::CONTENT_TYPE, "audio/mpeg")],
        audio_data,
    ))
}
