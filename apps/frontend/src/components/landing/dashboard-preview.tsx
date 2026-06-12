'use client';

import { motion } from 'motion/react';
import { Container } from '@/components/shared/container';
import { scaleIn } from '@/lib/motion';

const FileItem: React.FC<{ name: string; duration: string; active?: boolean }> = ({
  name,
  duration,
  active,
}) => (
  <div
    className={`flex items-center gap-2.5 rounded-lg px-3 py-2 transition-colors ${
      active ? 'bg-edith-accent/10 border border-edith-accent/20' : 'hover:bg-white/5'
    }`}
  >
    <div className="flex size-8 shrink-0 items-center justify-center rounded bg-white/8">
      <div className="size-2.5 rounded-sm bg-edith-accent/60" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="truncate text-xs font-medium text-edith-text">{name}</p>
      <p className="text-[10px] text-edith-muted">{duration}</p>
    </div>
    {active && <div className="size-1.5 rounded-full bg-edith-accent" />}
  </div>
);

const TimelineTrack: React.FC<{ label: string; segments: Array<{ w: number; color: string }> }> = ({
  label,
  segments,
}) => (
  <div className="flex items-center gap-2">
    <span className="w-12 shrink-0 text-right text-[10px] text-edith-muted">{label}</span>
    <div className="flex h-5 flex-1 items-center gap-px overflow-hidden rounded">
      {segments.map((seg, i) => (
        <div
          key={i}
          className="h-full rounded-sm"
          style={{ width: `${seg.w}%`, backgroundColor: seg.color }}
        />
      ))}
    </div>
  </div>
);

export const DashboardPreview: React.FC = () => (
  <section className="bg-edith-bg py-8 sm:py-12">
    <Container>
      <motion.div
        variants={scaleIn}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-edith-bg2 shadow-[0_32px_80px_rgba(0,0,0,0.6)]"
        style={{ aspectRatio: '16/9', minHeight: 360 }}
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(48,244,210,0.15), transparent)',
          }}
        />

        <div className="flex h-full">
          {/* Sidebar */}
          <div className="flex w-52 shrink-0 flex-col border-r border-white/8 p-3 lg:w-60">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-edith-muted">
                Fichiers
              </span>
              <button className="rounded p-0.5 text-edith-muted hover:text-edith-accent">
                <span className="block size-3.5 rounded border border-current" />
              </button>
            </div>
            <div className="flex flex-col gap-1">
              <FileItem name="produit-hero.mp4" duration="0:34" active />
              <FileItem name="ugc-client-1.mp4" duration="1:12" />
              <FileItem name="inspiration-tiktok.mp4" duration="0:28" />
              <FileItem name="rush-packshot.mp4" duration="0:15" />
            </div>
            <div className="mt-auto border-t border-white/8 pt-3">
              <div className="rounded-lg bg-edith-accent/10 p-2.5 text-[10px] text-edith-accent">
                <div className="mb-1 font-semibold">Variante A générée</div>
                <div className="text-edith-muted">Hook fort · Sous-titres · 9:16</div>
              </div>
            </div>
          </div>

          {/* Main area */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Preview */}
            <div className="flex flex-1 items-center justify-center bg-black/30 p-4">
              <div className="relative aspect-[9/16] h-full max-h-52 overflow-hidden rounded-xl border border-white/10 bg-zinc-900">
                <div className="absolute inset-0 flex flex-col">
                  <div className="flex-1 bg-gradient-to-b from-zinc-800 to-zinc-900" />
                  <div className="p-3">
                    <div className="mb-2 rounded bg-edith-accent/90 px-2 py-1 text-center text-[9px] font-bold text-edith-bg">
                      RÉSULTATS INCROYABLES EN 7 JOURS
                    </div>
                    <div className="flex gap-1.5">
                      <div className="h-1 flex-1 rounded-full bg-edith-accent" />
                      <div className="h-1 flex-1 rounded-full bg-white/20" />
                      <div className="h-1 flex-1 rounded-full bg-white/20" />
                    </div>
                  </div>
                </div>
                <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 size-8 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                  <div className="ml-0.5 size-0 border-y-4 border-l-[6px] border-y-transparent border-l-white" />
                </div>
              </div>

              <div className="ml-4 hidden flex-col gap-2 lg:flex">
                <div className="rounded-lg border border-white/8 bg-white/5 p-3 text-[10px]">
                  <div className="mb-1.5 font-semibold text-edith-text">Prompt créatif</div>
                  <div className="leading-relaxed text-edith-muted">
                    Style TikTok dynamique,<br />
                    hook fort 3s, CTA WhatsApp
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  {['Variante A — Hook bénéfice', 'Variante B — Preuve sociale', 'Variante C — Urgence'].map(
                    (v, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[10px] ${
                          i === 0
                            ? 'border-edith-accent/30 bg-edith-accent/8 text-edith-accent'
                            : 'border-white/8 bg-white/3 text-edith-muted'
                        }`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${i === 0 ? 'bg-edith-accent' : 'bg-white/20'}`}
                        />
                        {v}
                      </div>
                    ),
                  )}
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="shrink-0 border-t border-white/8 bg-black/20 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-edith-muted">
                  Timeline
                </span>
                <span className="text-[10px] text-edith-muted">0:18 / 0:30</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <TimelineTrack
                  label="Vidéo"
                  segments={[
                    { w: 15, color: 'rgba(48,244,210,0.5)' },
                    { w: 3, color: 'transparent' },
                    { w: 22, color: 'rgba(48,244,210,0.35)' },
                    { w: 2, color: 'transparent' },
                    { w: 18, color: 'rgba(48,244,210,0.45)' },
                    { w: 40, color: 'rgba(48,244,210,0.2)' },
                  ]}
                />
                <TimelineTrack
                  label="Audio"
                  segments={[
                    { w: 60, color: 'rgba(125,255,233,0.3)' },
                    { w: 40, color: 'rgba(125,255,233,0.15)' },
                  ]}
                />
                <TimelineTrack
                  label="Captions"
                  segments={[
                    { w: 12, color: 'rgba(255,255,255,0.25)' },
                    { w: 2, color: 'transparent' },
                    { w: 14, color: 'rgba(255,255,255,0.25)' },
                    { w: 2, color: 'transparent' },
                    { w: 10, color: 'rgba(255,255,255,0.25)' },
                    { w: 3, color: 'transparent' },
                    { w: 57, color: 'transparent' },
                  ]}
                />
              </div>
              <div className="relative mt-1.5 h-0.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-edith-accent"
                  style={{ width: '60%' }}
                />
                <div className="absolute top-1/2 h-3 w-0.5 -translate-y-1/2 rounded-full bg-edith-accent shadow-[0_0_6px_rgba(48,244,210,0.8)]" style={{ left: '60%' }} />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </Container>
  </section>
);
