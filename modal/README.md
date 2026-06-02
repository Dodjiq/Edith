# Edith Modal render worker

This folder prepares the heavy video pipeline for Modal.

The MVP starts in mock mode. Real rendering should run on Modal, never on Cloudflare.

## Required environment

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=videos
```

## Local idea

```bash
modal deploy modal/render_worker.py
```

The worker is expected to download a source video from Supabase Storage, extract audio with FFmpeg, transcribe with faster-whisper, generate an edit plan, render variants with FFmpeg, upload exports, and update Postgres statuses.

## Mock mode

`ENABLE_MOCK_RENDER=true` in the Next.js app simulates jobs and variants while Supabase/Modal are not connected.
