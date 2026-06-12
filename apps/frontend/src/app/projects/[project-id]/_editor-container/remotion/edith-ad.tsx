import React from 'react';
import { AbsoluteFill, OffthreadVideo, Sequence, useVideoConfig } from 'remotion';

export type EdithAdScene = {
  assetUrl: string;
  assetPath: string;
  startMs: number;
  endMs: number;
  type: string;
};

export type EdithAdCaption = {
  text: string;
  startMs: number;
  endMs: number;
};

export type EdithAdProps = {
  scenes: EdithAdScene[];
  captions: EdithAdCaption[];
  totalDurationMs: number;
  width: number;
  height: number;
};

export const EdithAdComposition: React.FC<EdithAdProps> = ({ scenes, captions }) => {
  const { fps } = useVideoConfig();

  const msToFrames = (ms: number) => Math.max(1, Math.round((ms / 1000) * fps));

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {scenes.map((scene, i) => {
        const from = msToFrames(scene.startMs);
        const duration = msToFrames(scene.endMs - scene.startMs);
        if (duration <= 0) return null;

        return (
          <Sequence key={i} from={from} durationInFrames={duration}>
            <AbsoluteFill>
              {scene.type === 'video' || !scene.type ? (
                <OffthreadVideo
                  src={scene.assetUrl}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <img
                  src={scene.assetUrl}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  alt=""
                />
              )}
            </AbsoluteFill>
          </Sequence>
        );
      })}

      {captions.map((cap, i) => {
        const from = msToFrames(cap.startMs);
        const duration = msToFrames(cap.endMs - cap.startMs);
        if (duration <= 0) return null;

        return (
          <Sequence key={`cap-${i}`} from={from} durationInFrames={duration}>
            <AbsoluteFill
              style={{
                justifyContent: 'flex-end',
                alignItems: 'center',
                paddingBottom: 60,
              }}
            >
              <div
                style={{
                  color: '#fff',
                  fontSize: 32,
                  fontWeight: 700,
                  textAlign: 'center',
                  textShadow: '0 2px 8px rgba(0,0,0,0.9)',
                  background: 'rgba(0,0,0,0.45)',
                  borderRadius: 10,
                  padding: '10px 20px',
                  maxWidth: '85%',
                  lineHeight: 1.3,
                }}
              >
                {cap.text}
              </div>
            </AbsoluteFill>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};