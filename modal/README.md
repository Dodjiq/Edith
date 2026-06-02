# Edith Modal render worker

This folder prepares the heavy video pipeline for Modal.

The MVP starts in mock mode. Real rendering should run on Modal, never on Cloudflare.

## Required environment

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=videos
MODAL_WEBHOOK_SECRET=
ENABLE_REAL_TRANSCRIPTION=false
WHISPER_MODEL_SIZE=base
```

## Local idea

```bash
modal secret create edith-render-secrets \
  SUPABASE_URL=... \
  SUPABASE_SERVICE_ROLE_KEY=... \
  SUPABASE_STORAGE_BUCKET=videos \
  MODAL_WEBHOOK_SECRET=...

modal deploy modal/render_worker.py
```

After deploy, copy the `submit_render_project` endpoint URL into Cloudflare:

```env
ENABLE_REAL_MODAL=true
MODAL_RENDER_ENDPOINT_URL=https://...
MODAL_WEBHOOK_SECRET=...
```

The worker is expected to download a source video from Supabase Storage, extract audio with FFmpeg, transcribe with faster-whisper, generate an edit plan, render variants with FFmpeg, upload exports, and update Postgres statuses.

## Mock mode

`ENABLE_MOCK_RENDER=true` in the Next.js app simulates jobs and variants while Supabase/Modal are not connected.

`ENABLE_REAL_TRANSCRIPTION=true` enables faster-whisper. Keep it disabled until the FFmpeg render path is verified.
