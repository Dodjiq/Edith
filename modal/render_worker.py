import os
import shutil
import subprocess
import tempfile
from pathlib import Path

import modal


app = modal.App("edith-render-worker")

image = (
    modal.Image.debian_slim()
    .apt_install("ffmpeg")
    .pip_install_from_requirements("modal/requirements.txt")
)


def _run(command: list[str]) -> None:
    subprocess.run(command, check=True)


def _require_env(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(f"{name} is required")
    return value


@app.function(image=image, timeout=60 * 60)
def render_project(
    project_id: str,
    user_id: str,
    asset_id: str,
    storage_path: str,
    preset: str,
    format: str,
    instructions: str,
    variants_count: int,
    language: str = "fr",
) -> dict:
    """Render Edith variants.

    MVP behavior is intentionally conservative. Until Supabase is connected, this function validates
    environment and returns the plan of work. Real mode should download from Supabase Storage,
    run faster-whisper, render with FFmpeg, upload exports, and update Postgres.
    """

    supabase_url = _require_env("SUPABASE_URL")
    storage_bucket = os.environ.get("SUPABASE_STORAGE_BUCKET", "videos")
    _require_env("SUPABASE_SERVICE_ROLE_KEY")

    with tempfile.TemporaryDirectory() as temp_dir:
      workspace = Path(temp_dir)
      source_path = workspace / "source.mp4"
      output_path = workspace / "variant-1.mp4"

      if Path(storage_path).exists():
          shutil.copy(storage_path, source_path)
          resolution_filter = {
              "9:16": "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920",
              "1:1": "scale=1080:1080:force_original_aspect_ratio=increase,crop=1080:1080",
              "16:9": "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080",
          }.get(format, "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920")
          _run([
              "ffmpeg",
              "-y",
              "-i",
              str(source_path),
              "-vf",
              resolution_filter,
              "-c:v",
              "libx264",
              "-preset",
              "veryfast",
              "-c:a",
              "aac",
              str(output_path),
          ])

    return {
        "mode": "prepared",
        "project_id": project_id,
        "user_id": user_id,
        "asset_id": asset_id,
        "storage_path": storage_path,
        "preset": preset,
        "format": format,
        "instructions": instructions,
        "variants_count": variants_count,
        "language": language,
        "supabase_url": supabase_url,
        "storage_bucket": storage_bucket,
        "next_steps": [
            "download source from Supabase Storage",
            "extract audio with FFmpeg",
            "transcribe with faster-whisper",
            "render variants with FFmpeg",
            "upload exports to Supabase Storage",
            "update project, render_jobs, video_variants",
        ],
    }
