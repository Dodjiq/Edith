"use client";
import { Audio } from "@remotion/media";
import { TransitionSeries } from "@remotion/transitions";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { componentsById } from "../../components";
import { EffectsWrap } from "../../effects/EffectsWrap";
import {
  type Project,
  type ProjectAudio,
  projectDuration,
} from "../../project";
import { proxyExternalAudio } from "../../proxy-image";
import { compositionsById } from "../../registry";
import { resolveTransition, toPresentation, toTiming } from "../../transitions";

export const ProjectComposition: React.FC<Project> = ({
  clips,
  defaultTransition,
  audio,
  ...rest
}) => {
  const { width, height } = useVideoConfig();
  const videoDuration = projectDuration({
    clips,
    defaultTransition,
    fps: rest.fps,
    width,
    height,
  });
  return (
    <AbsoluteFill
      style={{
        background: "#000",
        // Headless rendering (CLI + @remotion/web-renderer) rasterizes each
        // frame independently. macOS Chromium's default subpixel-antialiased
        // font smoothing positions glyphs relative to the LCD subpixel grid,
        // so any sub-pixel `transform: translateY()` lands the glyph on a
        // different subpixel each frame → visible wobble in exports.
        // Forcing grayscale AA + geometricPrecision metrics makes glyph
        // rasterization independent of sub-pixel position.
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
        textRendering: "geometricPrecision",
      }}
    >
      <TransitionSeries>
        {clips.flatMap((clip, index) => {
          const Component = componentsById[clip.compositionId];
          const info = compositionsById[clip.compositionId];
          const isLocked = info?.brandMode === "locked";
          const styleProps = isLocked ? {} : { clipStyle: clip.style };

          const inner = Component ? (
            <Component key={`c-${clip.id}`} {...clip.props} {...styleProps} />
          ) : (
            <MissingClip
              key={`c-${clip.id}`}
              compositionId={clip.compositionId}
            />
          );

          const sequence = (
            <TransitionSeries.Sequence
              key={`seq-${clip.id}`}
              durationInFrames={clip.durationInFrames}
            >
              <EffectsWrap
                effects={clip.effects}
                clipDurationInFrames={clip.durationInFrames}
              >
                {inner}
              </EffectsWrap>
            </TransitionSeries.Sequence>
          );

          if (index === 0) {
            return [sequence];
          }

          const t = resolveTransition({
            clipTransition: clip.transition,
            projectDefault: defaultTransition,
            index,
          });

          // Skip transition entirely when duration is 0 or kind is "none" —
          // TransitionSeries handles zero-duration transitions, but emitting
          // them as a hard cut is cleaner.
          if (t.kind === "none" || t.durationInFrames <= 0) {
            return [sequence];
          }

          return [
            <TransitionSeries.Transition
              key={`tx-${clip.id}`}
              timing={toTiming(t)}
              presentation={toPresentation(t, { width, height })}
            />,
            sequence,
          ];
        })}
      </TransitionSeries>

      {audio ? (
        <ProjectAudioTrack audio={audio} videoDuration={videoDuration} />
      ) : null}
    </AbsoluteFill>
  );
};

/**
 * Linear-ramp volume envelope: silent → peak over `fadeInFrames`, hold at
 * peak, then peak → silent over `fadeOutFrames` at the very end of the
 * audio's `durationFrames`. Both ramps respect `peak` so quieter master
 * volumes still fade proportionally.
 */
function audioVolumeAt(
  frame: number,
  audio: ProjectAudio,
  totalFrames: number,
): number {
  const fadeIn = Math.max(0, audio.fadeInFrames ?? 15);
  const fadeOut = Math.max(0, audio.fadeOutFrames ?? 30);
  const peak = Math.max(0, Math.min(1, audio.volume));
  if (totalFrames <= 0) return 0;
  if (fadeIn > 0 && frame < fadeIn) {
    return peak * (frame / fadeIn);
  }
  if (fadeOut > 0 && frame > totalFrames - fadeOut) {
    return peak * Math.max(0, (totalFrames - frame) / fadeOut);
  }
  return peak;
}

function ProjectAudioTrack({
  audio,
  videoDuration,
}: {
  audio: ProjectAudio;
  videoDuration: number;
}) {
  const { fps } = useVideoConfig();
  const requestedDuration = audio.durationFrames ?? videoDuration;
  // Audio can never outlast the video. Clamp at render time too so JSON
  // produced before a clip got trimmed doesn't keep silent audio playing
  // past the final frame.
  const audioDuration = Math.max(1, Math.min(requestedDuration, videoDuration));
  const trimBefore = Math.max(0, Math.round((audio.trimStartSec ?? 0) * fps));
  // Route http/https through the same-origin audio proxy so the canvas
  // export stays untainted; blob:/data:/local paths pass through.
  const resolvedSrc = proxyExternalAudio(audio.src);

  return (
    <Sequence durationInFrames={audioDuration} layout="none">
      <Audio
        src={resolvedSrc}
        // `@remotion/media`'s Audio uses `trimBefore` (frames into the
        // source) — equivalent to the classic `<Audio startFrom>` API.
        trimBefore={trimBefore}
        loop={audio.loop ?? false}
        // Per-frame volume envelope. Remotion calls this once per frame
        // while the sequence is active.
        volume={(frame) => audioVolumeAt(frame, audio, audioDuration)}
      />
    </Sequence>
  );
}

function MissingClip({ compositionId }: { compositionId: string }) {
  return (
    <AbsoluteFill
      style={{
        background: "#1a1a1d",
        color: "#fafafa",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Display', Inter, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        padding: "0 80px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 48, fontWeight: 700, letterSpacing: "-0.02em" }}>
        Missing scene
      </div>
      <div style={{ fontSize: 22, opacity: 0.6 }}>
        No component registered for id &ldquo;{compositionId}&rdquo;.
      </div>
    </AbsoluteFill>
  );
}
