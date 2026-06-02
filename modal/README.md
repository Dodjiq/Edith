# Edith Modal render worker

This folder contains Edith's heavy video pipeline for Modal.

Real rendering runs on Modal, never on Cloudflare.

## Required environment

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=videos
MODAL_WEBHOOK_SECRET=
ENABLE_REAL_TRANSCRIPTION=true
ENABLE_HF_WHISPER=true
HF_WHISPER_SPACE_URL=https://dodjiq-ads-voice.hf.space
HF_WHISPER_API_NAME=/predict
HF_TOKEN=
WHISPER_MODEL_SIZE=base
```

## Modal secret

Create or update the Modal secret:

```powershell
modal secret create edith-render-secrets `
  SUPABASE_URL=$env:SUPABASE_URL `
  SUPABASE_SERVICE_ROLE_KEY=$env:SUPABASE_SERVICE_ROLE_KEY `
  SUPABASE_STORAGE_BUCKET=$env:SUPABASE_STORAGE_BUCKET `
  MODAL_WEBHOOK_SECRET=$env:MODAL_WEBHOOK_SECRET `
  ENABLE_REAL_TRANSCRIPTION=true `
  ENABLE_HF_WHISPER=true `
  HF_WHISPER_SPACE_URL=https://dodjiq-ads-voice.hf.space `
  HF_WHISPER_API_NAME=/predict `
  HF_TOKEN=$env:HF_TOKEN `
  WHISPER_MODEL_SIZE=base
```

Then deploy:

```powershell
modal deploy modal/render_worker.py
```

After deploy, copy the `submit_render_project` endpoint URL into Cloudflare:

```env
ENABLE_REAL_MODAL=true
MODAL_RENDER_ENDPOINT_URL=https://...
MODAL_WEBHOOK_SECRET=...
```

## Transcription

When `ENABLE_REAL_TRANSCRIPTION=true` and `ENABLE_HF_WHISPER=true`, transcription is delegated to the Hugging Face Space configured by `HF_WHISPER_SPACE_URL`.

If `ENABLE_HF_WHISPER=false`, the worker falls back to local `faster-whisper`.

## Implementation notes

The worker downloads a source video from Supabase Storage, extracts audio with FFmpeg, transcribes audio, renders variants with FFmpeg, uploads exports, and updates Postgres statuses.

The worker uses Supabase REST and Storage HTTP endpoints through `httpx` instead of `supabase-py`. This avoids a Windows deploy import conflict because the repo also has a local `supabase/` schema folder.

## Mock mode

`ENABLE_MOCK_RENDER=true` in the Next.js app simulates jobs and variants while Supabase/Modal are not connected.
