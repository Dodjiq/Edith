import json
import os
import subprocess
import tempfile
from pathlib import Path
from typing import Any

import httpx
import modal
from fastapi import HTTPException, Request


app = modal.App("edith-render-worker")

image = (
    modal.Image.debian_slim()
    .apt_install("ffmpeg", "fonts-dejavu-core")
    .pip_install_from_requirements("modal/requirements.txt")
)

secrets = [modal.Secret.from_name("edith-render-secrets")]


def _run(command: list[str]) -> None:
    subprocess.run(command, check=True)


def _require_env(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(f"{name} is required")
    return value


class SupabaseRestClient:
    def __init__(self) -> None:
        self.url = _require_env("SUPABASE_URL").rstrip("/")
        self.service_key = _require_env("SUPABASE_SERVICE_ROLE_KEY")
        self.headers = {
            "apikey": self.service_key,
            "Authorization": f"Bearer {self.service_key}",
        }

    def update(self, table: str, filters: dict[str, str], values: dict[str, Any]) -> None:
        response = httpx.patch(
            f"{self.url}/rest/v1/{table}",
            params={field: f"eq.{value}" for field, value in filters.items()},
            headers={**self.headers, "Content-Type": "application/json"},
            json=values,
            timeout=60,
        )
        response.raise_for_status()

    def insert(self, table: str, values: dict[str, Any]) -> None:
        response = httpx.post(
            f"{self.url}/rest/v1/{table}",
            headers={**self.headers, "Content-Type": "application/json"},
            json=values,
            timeout=60,
        )
        response.raise_for_status()

    def select_variants(self, project_id: str, limit: int) -> list[dict[str, Any]]:
        response = httpx.get(
            f"{self.url}/rest/v1/video_variants",
            params={
                "select": "id,name,hook_text,edit_plan",
                "project_id": f"eq.{project_id}",
                "order": "created_at.asc",
                "limit": str(limit),
            },
            headers=self.headers,
            timeout=60,
        )
        response.raise_for_status()
        return response.json()

    def download_storage_file(self, bucket: str, storage_path: str, output_path: Path) -> None:
        response = httpx.get(
            f"{self.url}/storage/v1/object/{bucket}/{storage_path}",
            headers=self.headers,
            timeout=300,
        )
        response.raise_for_status()
        output_path.write_bytes(response.content)

    def upload_storage_file(self, bucket: str, storage_path: str, file_path: Path, content_type: str) -> None:
        response = httpx.post(
            f"{self.url}/storage/v1/object/{bucket}/{storage_path}",
            headers={**self.headers, "Content-Type": content_type, "x-upsert": "true"},
            content=file_path.read_bytes(),
            timeout=300,
        )
        response.raise_for_status()


def _resolution_filter(format_value: str) -> str:
    return {
        "9:16": "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920",
        "1:1": "scale=1080:1080:force_original_aspect_ratio=increase,crop=1080:1080",
        "16:9": "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080",
    }.get(format_value, "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920")


def _escape_drawtext(text: str) -> str:
    return text.replace("\\", "\\\\").replace(":", "\\:").replace("'", "\\'")


def _build_filter(format_value: str, hook_text: str) -> str:
    base = _resolution_filter(format_value)
    hook = _escape_drawtext(hook_text[:90] or "Test creative")
    return (
        f"{base},"
        "drawbox=x=70:y=80:w=iw-140:h=170:color=black@0.55:t=fill,"
        f"drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:"
        f"text='{hook}':x=90:y=115:fontsize=48:fontcolor=white:"
        "box=0:line_spacing=10"
    )


def _extract_audio(source_path: Path, audio_path: Path) -> None:
    _run(["ffmpeg", "-y", "-i", str(source_path), "-vn", "-acodec", "mp3", str(audio_path)])


def _transcribe_if_enabled(audio_path: Path, language: str) -> dict[str, Any]:
    if os.environ.get("ENABLE_REAL_TRANSCRIPTION", "false").lower() != "true":
        return {"full_text": "", "segments": []}

    from faster_whisper import WhisperModel

    model_size = os.environ.get("WHISPER_MODEL_SIZE", "base")
    model = WhisperModel(model_size, device="cpu", compute_type="int8")
    segments, info = model.transcribe(str(audio_path), language=None if language == "auto" else language)
    normalized_segments = [
        {
            "start": segment.start,
            "end": segment.end,
            "text": segment.text.strip(),
        }
        for segment in segments
    ]
    return {
        "language": info.language,
        "full_text": " ".join(segment["text"] for segment in normalized_segments).strip(),
        "segments": normalized_segments,
    }


@app.function(image=image, secrets=secrets, timeout=60 * 60)
def render_project(
    project_id: str,
    user_id: str,
    asset_id: str | None,
    storage_path: str,
    preset: str,
    format: str,
    instructions: str,
    variants_count: int,
    language: str = "fr",
) -> dict:
    client = SupabaseRestClient()
    bucket = os.environ.get("SUPABASE_STORAGE_BUCKET", "videos")

    try:
        client.update("projects", {"id": project_id}, {"status": "transcribing"})
        client.update("render_jobs", {"project_id": project_id}, {"status": "transcribing"})

        with tempfile.TemporaryDirectory() as temp_dir:
            workspace = Path(temp_dir)
            source_path = workspace / "source.mp4"
            audio_path = workspace / "audio.mp3"

            client.download_storage_file(bucket, storage_path, source_path)
            _extract_audio(source_path, audio_path)
            transcription = _transcribe_if_enabled(audio_path, language)

            if transcription["segments"] or transcription["full_text"]:
                client.insert(
                    "transcriptions",
                    {
                        "project_id": project_id,
                        "asset_id": asset_id,
                        "user_id": user_id,
                        "provider": "faster-whisper",
                        "language": transcription.get("language", language),
                        "full_text": transcription["full_text"],
                        "transcription_segments": transcription["segments"],
                    },
                )

            client.update("projects", {"id": project_id}, {"status": "rendering"})
            client.update("render_jobs", {"project_id": project_id}, {"status": "rendering"})
            variants = client.select_variants(project_id, variants_count)

            for index, variant in enumerate(variants):
                variant_id = variant["id"]
                hook_text = variant.get("hook_text") or f"Variante {index + 1}"
                output_path = workspace / f"{variant_id}.mp4"
                export_path = f"{user_id}/{project_id}/exports/{variant_id}.mp4"

                client.update("video_variants", {"id": variant_id}, {"status": "rendering"})
                _run(
                    [
                        "ffmpeg",
                        "-y",
                        "-i",
                        str(source_path),
                        "-vf",
                        _build_filter(format, hook_text),
                        "-c:v",
                        "libx264",
                        "-preset",
                        "veryfast",
                        "-crf",
                        "23",
                        "-c:a",
                        "aac",
                        "-b:a",
                        "128k",
                        "-movflags",
                        "+faststart",
                        str(output_path),
                    ]
                )
                client.upload_storage_file(bucket, export_path, output_path, "video/mp4")
                client.update(
                    "video_variants",
                    {"id": variant_id},
                    {
                        "status": "completed",
                        "export_path": export_path,
                        "render_metadata": {
                            "preset": preset,
                            "format": format,
                            "instructions": instructions,
                            "modal": "completed",
                        },
                    },
                )

        client.update("projects", {"id": project_id}, {"status": "completed"})
        client.update("render_jobs", {"project_id": project_id}, {"status": "completed"})
        return {"status": "completed", "project_id": project_id}
    except Exception as error:
        message = str(error)
        client.update("projects", {"id": project_id}, {"status": "failed", "error_message": message})
        client.update("render_jobs", {"project_id": project_id}, {"status": "failed", "error_message": message})
        client.update("video_variants", {"project_id": project_id}, {"status": "failed", "error_message": message})
        raise


@app.function(image=image, secrets=secrets)
@modal.fastapi_endpoint(method="POST")
async def submit_render_project(request: Request) -> dict:
    expected_secret = _require_env("MODAL_WEBHOOK_SECRET")
    authorization = request.headers.get("authorization", "")

    if authorization != f"Bearer {expected_secret}":
        raise HTTPException(status_code=401, detail="Unauthorized")

    payload = await request.json()
    required_fields = ["project_id", "user_id", "storage_path", "preset", "format", "variants_count", "language"]
    missing_fields = [field for field in required_fields if not payload.get(field)]

    if missing_fields:
        raise HTTPException(status_code=400, detail=f"Missing fields: {', '.join(missing_fields)}")

    function_call = render_project.spawn(
        project_id=payload["project_id"],
        user_id=payload["user_id"],
        asset_id=payload.get("asset_id"),
        storage_path=payload["storage_path"],
        preset=payload["preset"],
        format=payload["format"],
        instructions=payload.get("instructions", ""),
        variants_count=int(payload["variants_count"]),
        language=payload.get("language", "fr"),
    )

    return {
        "job_id": getattr(function_call, "object_id", None) or str(function_call),
        "status": "queued",
    }
