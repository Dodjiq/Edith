//! Services Module
//!
//! Contains business logic services used by route handlers.
//! Services are initialized in main.rs and passed to routes via Axum state.
//!
//! Available services:
//! - `ffmpeg` - Audio extraction from video/audio files
//!
//! Related files:
//! - `main.rs` - Service initialization
//! - `routes/` - Services are injected into route handlers

pub mod ffmpeg;
