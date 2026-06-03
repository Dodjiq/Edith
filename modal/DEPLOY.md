# Edith Modal worker — first-time deploy guide

Step-by-step runbook to deploy `modal/render_worker.py` for the first time. Follow each section in order.

For architecture and env reference see `modal/README.md`. This file is the deployment runbook.

## Prerequisites

- A Modal account (https://modal.com)
- Python 3.11 or higher
- The Modal CLI installed locally: `pip install modal`
- A Supabase project already provisioned (URL + service role key in hand)
- A Hugging Face token if you plan to use the HF Whisper Space (`HF_TOKEN`)
- FFmpeg is bundled into the Modal image automatically, no local install needed for deploy

Security notes:

- Never commit `.env` files containing real keys.
- Never commit `~/.modal.toml` (Modal stores your auth tokens there).
- The `MODAL_WEBHOOK_SECRET` must stay private — it is the only auth on the public Modal endpoint.

## 1. Authenticate the Modal CLI

Run locally:

```bash
modal token new
```

This opens a browser, completes OAuth, and writes a token pair to `~/.modal.toml`. If you prefer storing them in your app env, copy the printed `MODAL_TOKEN_ID` and `MODAL_TOKEN_SECRET` values into your repo-root `.env` (kept out of git).

Verify auth:

```bash
modal token current
```

## 2. Create the Modal secret with Supabase + webhook keys

The worker reads all credentials from a Modal secret named `edith-render-secrets`. Create it once:

```bash
modal secret create edith-render-secrets \
  SUPABASE_URL=https://xxx.supabase.co \
  SUPABASE_SERVICE_ROLE_KEY=ey... \
  SUPABASE_STORAGE_BUCKET=videos \
  MODAL_WEBHOOK_SECRET=$(openssl rand -hex 32) \
  ENABLE_REAL_TRANSCRIPTION=true \
  ENABLE_HF_WHISPER=true \
  HF_WHISPER_SPACE_URL=https://dodjiq-ads-voice.hf.space \
  HF_WHISPER_API_NAME=/predict \
  HF_TOKEN=hf_xxx \
  WHISPER_MODEL_SIZE=base
```

Important:

- Save the generated `MODAL_WEBHOOK_SECRET` value. You will paste the same value into your Vercel/app env in step 4.
- If you are on Windows PowerShell, replace `$(openssl rand -hex 32)` with a 64-char hex string you generated separately, or run the command from WSL/git-bash.
- To update an existing secret without recreating, use `modal secret create edith-render-secrets --force ...` with the full list of key=value pairs.

To inspect:

```bash
modal secret list
```

## 3. Deploy the worker

From the repo root (`framedeck/`):

```bash
modal deploy modal/render_worker.py
```

Modal will:

1. Build the container image (Debian slim + FFmpeg + DejaVu fonts + the pip deps in `modal/requirements.txt`).
2. Push the `render_project` function and the `submit_render_project` FastAPI endpoint to your workspace.
3. Print the public endpoint URL, of the form:

```
https://<workspace>--edith-render-worker-submit-render-project.modal.run
```

Copy that URL.

## 4. Wire the endpoint URL into the Next.js app

Add the following to `apps/frontend/.env` for local dev, and to your Vercel project env vars for production:

```
MODAL_RENDER_ENDPOINT_URL=https://<workspace>--edith-render-worker-submit-render-project.modal.run
MODAL_WEBHOOK_SECRET=<same value you put in the Modal secret in step 2>
ENABLE_REAL_MODAL=true
ENABLE_MOCK_RENDER=false
```

`MODAL_WEBHOOK_SECRET` must match exactly on both sides — the worker rejects any request whose `Authorization: Bearer <secret>` header does not match.

## 5. Verify the deploy

Auth check (should return HTTP 400 because the body is empty, which confirms the secret matched and you got past auth):

```bash
curl -X POST "$MODAL_RENDER_ENDPOINT_URL" \
  -H "Authorization: Bearer $MODAL_WEBHOOK_SECRET" \
  -H "Content-Type: application/json" \
  -d '{}'
```

- 400 with `Missing fields: ...` means auth works and the endpoint is live.
- 401 means `MODAL_WEBHOOK_SECRET` is wrong on one side.

End-to-end check: open the deployed app, create a new project, upload a source video, and start a render. In Supabase, `render_jobs.status` should walk through `queued -> transcribing -> rendering -> completed`. `video_variants.status` should flip to `completed` and `export_path` should point at the uploaded MP4 in the `videos` bucket.

## 6. Iterate

Stream live logs:

```bash
modal app logs edith-render-worker
```

Redeploy after a code change (Modal handles versioning automatically):

```bash
modal deploy modal/render_worker.py
```

View deploy history:

```bash
modal app history edith-render-worker
```

Roll back to a previous deployment:

```bash
modal app rollback edith-render-worker <deployment-id>
```

## Troubleshooting

- `401 Unauthorized` from the endpoint → `MODAL_WEBHOOK_SECRET` differs between your app `.env` and the Modal secret. Update one of them and redeploy/restart.
- `400 Missing fields: ...` → expected when calling with empty body; the app should always send `project_id`, `user_id`, `storage_path`, `preset`, `format`, `variants_count`, `language`.
- `SUPABASE_URL is required` (or any other `... is required` runtime error) → the Modal secret is missing that key. Add it with `modal secret create edith-render-secrets --force KEY=value ...` then redeploy.
- HF Whisper Space times out or returns 503 → the Space is sleeping. Hit `HF_WHISPER_SPACE_URL` in a browser to wake it, or temporarily set `ENABLE_HF_WHISPER=false` in the Modal secret to fall back to local `faster-whisper`.
- Supabase Storage upload returns 403 → the service role key is wrong, or the `SUPABASE_STORAGE_BUCKET` does not exist. Create the `videos` bucket in the Supabase dashboard.
- FFmpeg errors during render → check `modal app logs edith-render-worker` for the actual stderr. Most common cause is the source video failing to download from Supabase Storage (check `storage_path` in `render_jobs`).
