'use client';

import { useRef, useState } from 'react';
import { Play, Pause } from 'lucide-react';

type VideoDemoProps = {
  videoSrc?: string;
  posterSrc?: string;
};

export const VideoDemo: React.FC<VideoDemoProps> = ({
  videoSrc = '/demo.mp4',
  posterSrc,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [hasStarted, setHasStarted] = useState<boolean>(false);

  const handlePlayToggle = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
      setHasStarted(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  return (
    <div className="relative w-full">
      {/* Mint glow behind player */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-12 rounded-[64px]"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(81,224,207,0.10), transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      {/* Player container */}
      <div
        className="relative overflow-hidden"
        style={{
          borderRadius: '24px',
          border: '1px solid rgba(255,255,255,0.08)',
          backgroundColor: '#0a0a0a',
          boxShadow:
            '0 50px 100px -20px rgba(0,0,0,0.7), 0 30px 60px -30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        {/* Aspect ratio wrapper (16:9) */}
        <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
          {/* Poster / Placeholder background (visible until video starts) */}
          {!hasStarted && (
            <div
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(81,224,207,0.08) 0%, rgba(10,10,10,1) 70%), linear-gradient(180deg, #0c0c0c 0%, #050505 100%)',
              }}
            >
              {/* Subtle grid pattern */}
              <div
                className="absolute inset-0 opacity-[0.4]"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
                  backgroundSize: '40px 40px',
                  maskImage:
                    'radial-gradient(ellipse 60% 60% at 50% 50%, black, transparent 80%)',
                }}
              />

              {/* Thumbnail "preview" centered label */}
              <div className="absolute top-6 left-6">
                <span
                  className="inline-flex items-center"
                  style={{
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: '99px',
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    fontSize: '11px',
                    fontWeight: 600,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.4)',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <span
                    className="size-1.5 rounded-full bg-edith-accent"
                    style={{ animation: 'pulse 2s ease-in-out infinite' }}
                  />
                  Démo Edith
                </span>
              </div>

              {/* Duration badge */}
              <div className="absolute top-6 right-6">
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    fontFamily: 'var(--font-space-grotesk), sans-serif',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: 'rgba(255,255,255,0.6)',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  1:42
                </span>
              </div>

              {/* Bottom caption */}
              <div className="absolute bottom-6 left-6 right-6">
                <p
                  style={{
                    fontFamily: 'var(--font-space-grotesk), sans-serif',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: 'rgba(255,255,255,0.5)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Comment générer 10 variantes publicitaires en 2 minutes
                </p>
              </div>
            </div>
          )}

          {/* HTML5 video element */}
          <video
            ref={videoRef}
            className="absolute inset-0 size-full"
            playsInline
            preload="metadata"
            poster={posterSrc}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            controls={hasStarted && isPlaying}
            style={{
              objectFit: 'cover',
              opacity: hasStarted ? 1 : 0,
              transition: 'opacity 0.4s cubic-bezier(0.6, 0.6, 0, 1)',
            }}
          >
            <source src={videoSrc} type="video/mp4" />
            Votre navigateur ne supporte pas la lecture vidéo.
          </video>

          {/* Play button overlay */}
          {(!isPlaying || !hasStarted) && (
            <button
              onClick={handlePlayToggle}
              aria-label={isPlaying ? 'Pause' : 'Play demo'}
              className="absolute inset-0 flex items-center justify-center group"
              style={{
                backgroundColor: hasStarted ? 'rgba(0,0,0,0.3)' : 'transparent',
                transition: 'background-color 0.3s cubic-bezier(0.6, 0.6, 0, 1)',
              }}
            >
              <div
                className="relative flex items-center justify-center transition-all duration-300"
                style={{
                  width: '88px',
                  height: '88px',
                  borderRadius: '99px',
                  backgroundColor: '#51e0cf',
                  boxShadow:
                    '0 0 60px rgba(81,224,207,0.4), 0 20px 40px -10px rgba(0,0,0,0.5)',
                  transition: 'all 0.3s cubic-bezier(0.6, 0.6, 0, 1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.08)';
                  e.currentTarget.style.backgroundColor = '#6deddc';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.backgroundColor = '#51e0cf';
                }}
              >
                {/* Animated mint ring */}
                <span
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full"
                  style={{
                    border: '1px solid rgba(81,224,207,0.4)',
                    animation: 'video-ring-pulse 2s cubic-bezier(0.6, 0.6, 0, 1) infinite',
                  }}
                />
                {isPlaying ? (
                  <Pause
                    className="size-9"
                    style={{ color: '#0a0f0f' }}
                    strokeWidth={2}
                    fill="#0a0f0f"
                  />
                ) : (
                  <Play
                    className="size-9 translate-x-0.5"
                    style={{ color: '#0a0f0f' }}
                    strokeWidth={2}
                    fill="#0a0f0f"
                  />
                )}
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Local keyframes for the ring pulse */}
      <style jsx>{`
        @keyframes video-ring-pulse {
          0% {
            transform: scale(1);
            opacity: 0.6;
          }
          70% {
            transform: scale(1.5);
            opacity: 0;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};
