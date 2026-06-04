"""Edith Modal render worker.

Supported payload fields (POST /submit_render_project):
  Required: project_id, user_id, storage_path, preset, format, variants_count, language
  Optional:
    asset_id (str | None)            - source asset reference
    instructions (str)               - user instructions, stored in metadata
    apply_watermark (bool, True)     - burn "Edith" mark top-right
    remove_silences (bool, False)    - cut silent gaps via FFmpeg silencedetect
    caption_style (str, "bold_tiktok") - one of bold_tiktok | clean_white | none
    zoom_punches (bool, False)       - subtle zoompan accents on long kept segments
    voiceover_url (str | None)       - presigned URL to a voiceover audio file
    duration_seconds (float | None)  - informational, logged only
"""

import json
import os
import re
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

FONT_FILE_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_FILE_REGULAR = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"


def _run(command: list[str]) -> None:
    subprocess.run(command, check=True)


def _run_capture(command: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(command, check=False, capture_output=True, text=True)


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


def _probe_duration(media_path: Path) -> float:
    """Best-effort duration probe via ffprobe; returns 0.0 if unavailable."""
    result = _run_capture(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            str(media_path),
        ]
    )
    try:
        return float(result.stdout.strip())
    except (TypeError, ValueError):
        return 0.0


def _detect_silences(
    audio_path: Path,
    noise_threshold_db: float = -32,
    min_silence_duration: float = 0.4,
) -> list[tuple[float, float]]:
    """Run FFmpeg silencedetect and parse stderr for silence_start / silence_end lines."""
    command = [
        "ffmpeg",
        "-hide_banner",
        "-nostats",
        "-i",
        str(audio_path),
        "-af",
        f"silencedetect=noise={noise_threshold_db}dB:d={min_silence_duration}",
        "-f",
        "null",
        "-",
    ]
    result = _run_capture(command)
    stderr = result.stderr or ""

    start_pattern = re.compile(r"silence_start:\s*([0-9.]+)")
    end_pattern = re.compile(r"silence_end:\s*([0-9.]+)")
    starts = [float(value) for value in start_pattern.findall(stderr)]
    ends = [float(value) for value in end_pattern.findall(stderr)]

    intervals: list[tuple[float, float]] = []
    for index, start in enumerate(starts):
        end = ends[index] if index < len(ends) else start + min_silence_duration
        if end > start:
            intervals.append((start, end))
    return intervals


def _build_keep_intervals(
    silences: list[tuple[float, float]],
    total_duration: float,
) -> list[tuple[float, float]]:
    """Invert silence intervals to keep ranges; drop segments shorter than 0.4 s."""
    if total_duration <= 0:
        return []

    keep: list[tuple[float, float]] = []
    cursor = 0.0
    for silence_start, silence_end in sorted(silences):
        clamped_start = max(silence_start, 0.0)
        if clamped_start - cursor >= 0.4:
            keep.append((cursor, clamped_start))
        cursor = max(cursor, silence_end)

    if total_duration - cursor >= 0.4:
        keep.append((cursor, total_duration))

    return keep


def _build_silence_trim_filter(keep_intervals: list[tuple[float, float]]) -> str:
    """Build matching video select + audio aselect filters for kept ranges."""
    if not keep_intervals:
        return ""

    # Single keep range covering [0, +inf) -> nothing to trim.
    if len(keep_intervals) == 1 and keep_intervals[0][0] <= 0.01:
        return ""

    expressions = "+".join(f"between(t,{start:.3f},{end:.3f})" for start, end in keep_intervals)
    video_chain = f"select='{expressions}',setpts=N/FRAME_RATE/TB"
    audio_chain = f"aselect='{expressions}',asetpts=N/SR/TB"
    return f"{video_chain}||{audio_chain}"


def _caption_drawtext(segments: list[dict], style: str, fontfile: str) -> str:
    """Render one drawtext per transcription segment, gated by between(t,start,end)."""
    if style == "none" or not segments:
        return ""

    chains: list[str] = []
    for segment in segments:
        text = str(segment.get("text", "")).strip()
        if not text:
            continue
        start = float(segment.get("start", 0) or 0)
        end = float(segment.get("end", 0) or 0)
        if end <= start:
            continue
        safe = _escape_drawtext(text[:120])
        enable = f"between(t,{start:.3f},{end:.3f})"

        if style == "bold_tiktok":
            chains.append(
                f"drawtext=fontfile={fontfile}:text='{safe}':"
                f"fontsize=56:fontcolor=white:box=1:boxcolor=black@0.70:boxborderw=20:"
                f"x=(w-text_w)/2:y=h-(h/4):enable='{enable}'"
            )
        elif style == "clean_white":
            chains.append(
                f"drawtext=fontfile={fontfile}:text='{safe}':"
                f"fontsize=44:fontcolor=white:borderw=2:bordercolor=black@0.55:"
                f"x=(w-text_w)/2:y=h-(h/5):enable='{enable}'"
            )

    return ",".join(chains)


def _watermark_drawtext(fontfile: str) -> str:
    """Small white 'Edith' mark anchored to the top-right corner."""
    return (
        f"drawtext=fontfile={fontfile}:text='Edith':"
        "fontsize=24:fontcolor=white@0.60:"
        "x=w-text_w-20:y=20"
    )


def _zoom_punch_filter(intervals: list[tuple[float, float]]) -> str:
    """Add tasteful zoompan accents around the midpoint of long kept intervals."""
    long_intervals = [(start, end) for start, end in intervals if end - start > 2.5]
    if not long_intervals:
        return ""

    # FFmpeg zoompan over a regular video stream is awkward; emulate punches via
    # a scale+crop driven by a per-segment time expression. Max zoom is 1.15x and
    # ease-in-out is approximated with a smoothstep curve.
    expr_parts: list[str] = ["1"]
    for start, end in long_intervals:
        center = (start + end) / 2.0
        half_window = min(0.6, (end - start) / 4.0)
        attack = center - half_window
        release = center + half_window
        # Smooth ramp up to 1.15 between [attack, center] and back to 1.0 by release.
        ramp = (
            f"if(between(t,{attack:.3f},{center:.3f}),"
            f"1+0.15*((t-{attack:.3f})/{half_window:.3f}),"
            f"if(between(t,{center:.3f},{release:.3f}),"
            f"1+0.15*(1-((t-{center:.3f})/{half_window:.3f})),"
            f"1))"
        )
        expr_parts.append(ramp)

    zoom_expr = "*".join(expr_parts)
    # scale up by the dynamic factor then crop back to original frame size.
    return (
        f"scale=w='iw*({zoom_expr})':h='ih*({zoom_expr})':eval=frame,"
        "crop=w='iw/(iw/ow)':h='ih/(ih/oh)':x='(in_w-out_w)/2':y='(in_h-out_h)/2'"
    )


def _build_filter(
    format_value: str,
    hook_text: str,
    *,
    caption_segments: list[dict] | None = None,
    caption_style: str = "none",
    apply_watermark: bool = False,
    zoom_intervals: list[tuple[float, float]] | None = None,
) -> str:
    """Compose the per-variant video filter chain.

    Order: silence-trimmed source -> resolution scale/crop -> zoom punches ->
    hook banner -> captions -> watermark. Silence trimming is handled
    separately and prepended at the FFmpeg invocation level.
    """
    chain_parts: list[str] = [_resolution_filter(format_value)]

    if zoom_intervals:
        zoom_chain = _zoom_punch_filter(zoom_intervals)
        if zoom_chain:
            chain_parts.append(zoom_chain)

    hook = _escape_drawtext((hook_text or "Test creative")[:90])
    chain_parts.append("drawbox=x=70:y=80:w=iw-140:h=170:color=black@0.55:t=fill")
    chain_parts.append(
        f"drawtext=fontfile={FONT_FILE_BOLD}:text='{hook}':"
        "x=90:y=115:fontsize=48:fontcolor=white:box=0:line_spacing=10"
    )

    if caption_segments and caption_style != "none":
        caption_chain = _caption_drawtext(caption_segments, caption_style, FONT_FILE_BOLD)
        if caption_chain:
            chain_parts.append(caption_chain)

    if apply_watermark:
        chain_parts.append(_watermark_drawtext(FONT_FILE_REGULAR))

    return ",".join(chain_parts)


def _extract_audio(source_path: Path, audio_path: Path) -> None:
    _run(["ffmpeg", "-y", "-i", str(source_path), "-vn", "-acodec", "mp3", str(audio_path)])


def _download_voiceover(voiceover_url: str, output_path: Path) -> bool:
    """Pull a presigned voiceover URL into a temp file; returns True on success."""
    try:
        with httpx.stream("GET", voiceover_url, timeout=120) as response:
            response.raise_for_status()
            with output_path.open("wb") as sink:
                for chunk in response.iter_bytes():
                    sink.write(chunk)
        return True
    except (httpx.HTTPError, OSError) as error:
        print(f"voiceover download failed: {error}")
        return False


def _normalize_space_transcription(result: Any, language: str) -> dict[str, Any]:
    if isinstance(result, dict):
        text = result.get("text") or result.get("transcription") or result.get("full_text") or ""
        segments = result.get("segments") or result.get("chunks") or []
        normalized_segments = [
            {
                "start": segment.get("start", 0),
                "end": segment.get("end", 0),
                "text": str(segment.get("text", "")).strip(),
            }
            for segment in segments
            if isinstance(segment, dict)
        ]
        return {
            "provider": "huggingface-space",
            "language": result.get("language") or language,
            "full_text": str(text).strip(),
            "segments": normalized_segments,
        }

    if isinstance(result, (list, tuple)):
        text_parts = [item for item in result if isinstance(item, str)]
        return {
            "provider": "huggingface-space",
            "language": language,
            "full_text": " ".join(text_parts).strip(),
            "segments": [],
        }

    return {
        "provider": "huggingface-space",
        "language": language,
        "full_text": str(result).strip(),
        "segments": [],
    }


def _transcribe_with_huggingface_space(audio_path: Path, language: str) -> dict[str, Any]:
    from gradio_client import Client, handle_file

    space_url = os.environ.get("HF_WHISPER_SPACE_URL", "https://dodjiq-ads-voice.hf.space")
    api_name = os.environ.get("HF_WHISPER_API_NAME", "/predict")
    hf_token = os.environ.get("HF_TOKEN") or None
    client = Client(space_url, hf_token=hf_token)

    try:
        result = client.predict(handle_file(str(audio_path)), language, api_name=api_name)
    except TypeError:
        result = client.predict(handle_file(str(audio_path)), api_name=api_name)

    return _normalize_space_transcription(result, language)


def _transcribe_if_enabled(audio_path: Path, language: str) -> dict[str, Any]:
    if os.environ.get("ENABLE_REAL_TRANSCRIPTION", "false").lower() != "true":
        return {"full_text": "", "segments": []}

    if os.environ.get("ENABLE_HF_WHISPER", "false").lower() == "true":
        return _transcribe_with_huggingface_space(audio_path, language)

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
        "provider": "faster-whisper",
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
    apply_watermark: bool = True,
    remove_silences: bool = False,
    caption_style: str = "bold_tiktok",
    zoom_punches: bool = False,
    voiceover_url: str | None = None,
    duration_seconds: float | None = None,
) -> dict:
    client = SupabaseRestClient()
    bucket = os.environ.get("SUPABASE_STORAGE_BUCKET", "videos")
    print(
        f"render_project start project={project_id} variants={variants_count} "
        f"watermark={apply_watermark} silences={remove_silences} captions={caption_style} "
        f"zoom={zoom_punches} voiceover={'yes' if voiceover_url else 'no'} "
        f"duration_hint={duration_seconds}"
    )

    try:
        client.update("projects", {"id": project_id}, {"status": "transcribing"})
        client.update("render_jobs", {"project_id": project_id}, {"status": "transcribing"})

        with tempfile.TemporaryDirectory() as temp_dir:
            workspace = Path(temp_dir)
            source_path = workspace / "source.mp4"
            audio_path = workspace / "audio.mp3"
            voiceover_path = workspace / "voiceover.mp3"

            client.download_storage_file(bucket, storage_path, source_path)
            _extract_audio(source_path, audio_path)
            transcription = _transcribe_if_enabled(audio_path, language)
            transcription_segments: list[dict] = transcription.get("segments") or []

            if transcription["segments"] or transcription["full_text"]:
                client.insert(
                    "transcriptions",
                    {
                        "project_id": project_id,
                        "asset_id": asset_id,
                        "user_id": user_id,
                        "provider": transcription.get("provider", "faster-whisper"),
                        "language": transcription.get("language", language),
                        "full_text": transcription["full_text"],
                        "transcription_segments": transcription["segments"],
                    },
                )

            # Resolve total media duration once; needed for silence inversion
            # and to bound zoom punches even when no transcription is available.
            total_duration = _probe_duration(source_path)

            silence_filter_pair = ""
            keep_intervals: list[tuple[float, float]] = []
            if remove_silences:
                silences = _detect_silences(audio_path)
                keep_intervals = _build_keep_intervals(silences, total_duration)
                silence_filter_pair = _build_silence_trim_filter(keep_intervals)
                print(
                    f"silence pass: {len(silences)} silences -> {len(keep_intervals)} keep ranges"
                )

            zoom_intervals = keep_intervals if zoom_punches else []
            # When silence removal is off but zoom is requested, treat the whole
            # clip as one long interval so we still get a punch near the middle.
            if zoom_punches and not zoom_intervals and total_duration > 0:
                zoom_intervals = [(0.0, total_duration)]

            voiceover_available = False
            if voiceover_url:
                voiceover_available = _download_voiceover(voiceover_url, voiceover_path)

            client.update("projects", {"id": project_id}, {"status": "rendering"})
            client.update("render_jobs", {"project_id": project_id}, {"status": "rendering"})
            variants = client.select_variants(project_id, variants_count)

            for index, variant in enumerate(variants):
                variant_id = variant["id"]
                hook_text = variant.get("hook_text") or f"Variante {index + 1}"
                output_path = workspace / f"{variant_id}.mp4"
                export_path = f"{user_id}/{project_id}/exports/{variant_id}.mp4"

                client.update("video_variants", {"id": variant_id}, {"status": "rendering"})

                video_filter = _build_filter(
                    format,
                    hook_text,
                    caption_segments=transcription_segments,
                    caption_style=caption_style,
                    apply_watermark=apply_watermark,
                    zoom_intervals=zoom_intervals,
                )

                command: list[str] = ["ffmpeg", "-y", "-i", str(source_path)]
                if voiceover_available:
                    command.extend(["-i", str(voiceover_path)])

                # Compose -filter_complex when we need to mix audio or trim
                # silences, otherwise fall back to the simpler -vf / -af pair.
                needs_complex = bool(silence_filter_pair) or voiceover_available
                if needs_complex:
                    parts: list[str] = []
                    if silence_filter_pair:
                        video_chain, audio_chain = silence_filter_pair.split("||")
                        parts.append(f"[0:v]{video_chain},{video_filter}[vout]")
                        if voiceover_available:
                            parts.append(
                                f"[0:a]{audio_chain}[a0];"
                                "[a0][1:a]amix=inputs=2:duration=longest:weights=1 1.4[aout]"
                            )
                        else:
                            parts.append(f"[0:a]{audio_chain}[aout]")
                    else:
                        parts.append(f"[0:v]{video_filter}[vout]")
                        parts.append(
                            "[0:a][1:a]amix=inputs=2:duration=longest:weights=1 1.4[aout]"
                        )
                    command.extend(
                        [
                            "-filter_complex",
                            ";".join(parts),
                            "-map",
                            "[vout]",
                            "-map",
                            "[aout]",
                        ]
                    )
                else:
                    command.extend(["-vf", video_filter])

                command.extend(
                    [
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
                _run(command)

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
                            "apply_watermark": apply_watermark,
                            "remove_silences": remove_silences,
                            "caption_style": caption_style,
                            "zoom_punches": zoom_punches,
                            "voiceover_mixed": voiceover_available,
                        },
                    },
                )

        client.update("projects", {"id": project_id}, {"status": "completed"})
        client.update("render_jobs", {"project_id": project_id}, {"status": "completed"})
        print(f"render_project done project={project_id}")
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

    allowed_caption_styles = {"bold_tiktok", "clean_white", "none"}
    caption_style = payload.get("caption_style", "bold_tiktok")
    if caption_style not in allowed_caption_styles:
        caption_style = "bold_tiktok"

    duration_value = payload.get("duration_seconds")
    duration_seconds: float | None = None
    if duration_value is not None:
        try:
            duration_seconds = float(duration_value)
        except (TypeError, ValueError):
            duration_seconds = None

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
        apply_watermark=bool(payload.get("apply_watermark", True)),
        remove_silences=bool(payload.get("remove_silences", False)),
        caption_style=caption_style,
        zoom_punches=bool(payload.get("zoom_punches", False)),
        voiceover_url=payload.get("voiceover_url") or None,
        duration_seconds=duration_seconds,
    )

    return {
        "job_id": getattr(function_call, "object_id", None) or str(function_call),
        "status": "queued",
    }
