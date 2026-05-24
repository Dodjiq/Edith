//! FFmpeg Audio Extraction Service
//!
//! Extracts audio from video files using ffmpeg for transcription pipeline.
//!
//! Output format (for Speechmatics Batch API):
//! - MP3 format (128kbps)
//! - 44.1kHz sample rate
//! - Mono channel
//!
//! Performance optimizations:
//! - Reduced probesize (32KB vs 5MB default) for faster format detection
//! - Limited analyzeduration (0.5s vs 5s default) for quicker stream analysis
//! - Multi-threaded decoding with `-threads 0`
//! - HTTP reconnection for reliability
//!
//! Related files:
//! - `routes/upload.rs` - Exposes /extract-audio endpoint

use std::process::Stdio;
use thiserror::Error;
use tokio::process::Command;

#[derive(Error, Debug)]
pub enum FfmpegError {
    #[error("FFmpeg execution failed: {0}")]
    ExecutionError(String),
    #[error("FFmpeg not found - ensure ffmpeg is installed")]
    NotFound,
    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),
}

/// Check if a content type can have audio extracted
pub fn is_audio_extractable(content_type: &str) -> bool {
    content_type.starts_with("video/")
        || content_type.starts_with("audio/")
        || content_type == "application/octet-stream"
}

/// Check if ffmpeg is available on the system
async fn can_run_ffmpeg(command: &str) -> bool {
    Command::new(command)
        .arg("-version")
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .status()
        .await
        .map(|s| s.success())
        .unwrap_or(false)
}

async fn resolve_ffmpeg_command() -> Option<String> {
    if let Ok(custom_path) = std::env::var("FFMPEG_PATH") {
        let trimmed_path = custom_path.trim();
        if !trimmed_path.is_empty() && can_run_ffmpeg(trimmed_path).await {
            return Some(trimmed_path.to_string());
        }
    }

    if can_run_ffmpeg("ffmpeg").await {
        return Some("ffmpeg".to_string());
    }

    for candidate in ["/opt/homebrew/bin/ffmpeg", "/usr/local/bin/ffmpeg"] {
        if can_run_ffmpeg(candidate).await {
            return Some(candidate.to_string());
        }
    }

    None
}

#[derive(Clone)]
pub struct FfmpegService {
    command: Option<String>,
}

impl FfmpegService {
    pub async fn new() -> Self {
        let command = resolve_ffmpeg_command().await;

        match command.as_deref() {
            Some("ffmpeg") => tracing::info!("FFmpeg service initialized"),
            Some(path) => tracing::info!("FFmpeg service initialized with binary: {}", path),
            None => tracing::warn!("FFmpeg not found - audio extraction will be unavailable"),
        }

        Self { command }
    }

    /// Check if the content type can have audio extracted
    pub fn can_extract_audio(&self, content_type: &str) -> bool {
        self.command.is_some() && is_audio_extractable(content_type)
    }

    /// Extract audio from a URL (e.g., S3 presigned URL) with low-latency optimizations.
    /// Returns MP3 audio for Speechmatics Batch API.
    pub async fn extract_audio_from_url(&self, url: &str) -> Result<Vec<u8>, FfmpegError> {
        use std::time::Instant;

        let Some(command) = self.command.as_deref() else {
            return Err(FfmpegError::NotFound);
        };

        let total_start = Instant::now();
        tracing::info!("[TIMING] Starting FFmpeg audio extraction from URL");

        let child = Command::new(command)
            .args([
                "-hide_banner",
                "-loglevel", "warning",
                // === LOW LATENCY PROBING ===
                "-probesize", "32768",
                "-analyzeduration", "500000",
                // === HTTP OPTIMIZATION ===
                "-reconnect", "1",
                "-reconnect_streamed", "1",
                "-reconnect_delay_max", "5",
                // === THREADING ===
                "-threads", "0",
                // === INPUT ===
                "-i", url,
                // === SKIP NON-AUDIO ===
                "-vn", "-dn", "-sn",
                "-map", "0:a:0",
                // === AUDIO ENCODING (MP3 for Speechmatics Batch) ===
                "-c:a", "libmp3lame",
                "-b:a", "128k",
                "-ar", "44100",
                "-ac", "1",
                // === OUTPUT ===
                "-f", "mp3",
                "pipe:1",
            ])
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| {
                if e.kind() == std::io::ErrorKind::NotFound {
                    FfmpegError::NotFound
                } else {
                    FfmpegError::IoError(e)
                }
            })?;

        let output = child.wait_with_output().await.map_err(FfmpegError::IoError)?;

        if !output.status.success() {
            let stderr_str = String::from_utf8_lossy(&output.stderr);
            tracing::error!("[FFMPEG] Extraction failed: {}", stderr_str);
            return Err(FfmpegError::ExecutionError(format!(
                "FFmpeg extraction failed: {}",
                stderr_str
            )));
        }

        let total_duration = total_start.elapsed();
        let output_size = output.stdout.len();
        let speed_mbps = (output_size as f64 / 1024.0 / 1024.0) / total_duration.as_secs_f64();

        tracing::info!(
            "[TIMING] FFmpeg extraction complete: {} bytes ({:.2} MB) in {:.2}s ({:.2} MB/s output)",
            output_size,
            output_size as f64 / 1024.0 / 1024.0,
            total_duration.as_secs_f64(),
            speed_mbps
        );

        Ok(output.stdout)
    }
}
