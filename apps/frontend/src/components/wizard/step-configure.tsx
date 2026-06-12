'use client';

import { useWizardStore } from '@/store/wizard-store';
import { cn } from '@/lib/utils';

const PLATFORMS = [
  { value: 'tiktok', label: 'TikTok', color: 'text-pink-400', bg: 'bg-pink-400/10' },
  { value: 'instagram', label: 'Instagram Reels', color: 'text-purple-400', bg: 'bg-purple-400/10' },
  { value: 'meta', label: 'Meta Ads', color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { value: 'youtube', label: 'YouTube Shorts', color: 'text-red-400', bg: 'bg-red-400/10' },
] as const;

const OUTPUT_FORMATS = [
  { value: '9:16', label: '9:16', sub: 'Vertical' },
  { value: '1:1', label: '1:1', sub: 'Carré' },
  { value: '16:9', label: '16:9', sub: 'Horizontal' },
] as const;

const PRESETS = [
  { value: 'ugc_dynamic', label: 'UGC Dynamique' },
  { value: 'premium', label: 'Premium' },
  { value: 'agressif', label: 'Agressif' },
  { value: 'storytelling', label: 'Storytelling' },
  { value: 'avant_apres', label: 'Avant/Après' },
] as const;

const LANGUAGES = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'Anglais' },
  { value: 'ar', label: 'Arabe' },
] as const;

export const StepConfigure: React.FC = () => {
  const {
    projectName,
    platform,
    outputFormat,
    preset,
    language,
    instructions,
    setField,
  } = useWizardStore();

  return (
    <div className='space-y-6'>
      <div className='space-y-2'>
        <label className='text-sm font-medium text-[#f3fffc]'>Nom du projet</label>
        <input
          type='text'
          value={projectName}
          onChange={(e) => setField('projectName', e.target.value)}
          placeholder='Mon projet vidéo'
          className='w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-[#f3fffc] placeholder-[#8b9d99] outline-none transition-colors focus:border-[#30f4d2]/50 focus:bg-white/[0.07]'
        />
      </div>

      <div className='space-y-2'>
        <label className='text-sm font-medium text-[#f3fffc]'>Plateforme</label>
        <div className='grid grid-cols-2 gap-2'>
          {PLATFORMS.map((p) => (
            <button
              key={p.value}
              onClick={() => setField('platform', p.value)}
              className={cn(
                'flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-colors',
                platform === p.value
                  ? 'border-[#30f4d2]/60 bg-[#30f4d2]/10 text-[#f3fffc]'
                  : 'border-white/10 bg-white/5 text-[#8b9d99] hover:border-white/20 hover:text-[#f3fffc]'
              )}
            >
              <span className={cn('h-2 w-2 rounded-full', p.bg, p.color, 'bg-current opacity-80')} />
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className='space-y-2'>
        <label className='text-sm font-medium text-[#f3fffc]'>Format vidéo</label>
        <div className='flex gap-2'>
          {OUTPUT_FORMATS.map((f) => (
            <button
              key={f.value}
              onClick={() => setField('outputFormat', f.value)}
              className={cn(
                'flex flex-1 flex-col items-center rounded-lg border px-3 py-3 transition-colors',
                outputFormat === f.value
                  ? 'border-[#30f4d2]/60 bg-[#30f4d2]/10'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              )}
            >
              <span
                className={cn(
                  'text-sm font-semibold',
                  outputFormat === f.value ? 'text-[#30f4d2]' : 'text-[#f3fffc]'
                )}
              >
                {f.label}
              </span>
              <span className='mt-0.5 text-xs text-[#8b9d99]'>{f.sub}</span>
            </button>
          ))}
        </div>
      </div>

      <div className='grid grid-cols-2 gap-4'>
        <div className='space-y-2'>
          <label className='text-sm font-medium text-[#f3fffc]'>Preset</label>
          <select
            value={preset}
            onChange={(e) => setField('preset', e.target.value)}
            className='w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-[#f3fffc] outline-none transition-colors focus:border-[#30f4d2]/50'
          >
            {PRESETS.map((p) => (
              <option key={p.value} value={p.value} className='bg-[#050b0a]'>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div className='space-y-2'>
          <label className='text-sm font-medium text-[#f3fffc]'>Langue</label>
          <select
            value={language}
            onChange={(e) => setField('language', e.target.value)}
            className='w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-[#f3fffc] outline-none transition-colors focus:border-[#30f4d2]/50'
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value} className='bg-[#050b0a]'>
                {l.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className='space-y-2'>
        <label className='text-sm font-medium text-[#f3fffc]'>Instructions</label>
        <textarea
          rows={4}
          value={instructions}
          onChange={(e) => setField('instructions', e.target.value)}
          placeholder="Style TikTok dynamique, hook fort les 3 premières secondes, sous-titres, CTA WhatsApp..."
          className='w-full resize-none rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-[#f3fffc] placeholder-[#8b9d99] outline-none transition-colors focus:border-[#30f4d2]/50 focus:bg-white/[0.07]'
        />
      </div>
    </div>
  );
};
