'use client';

import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft } from 'lucide-react';
import { useWizardStore } from '@/store/wizard-store';
import { StepUpload } from './step-upload';
import { StepConfigure } from './step-configure';
import { StepGenerate } from './step-generate';

type WizardStep = 1 | 2 | 3;

const STEPS: { step: WizardStep; label: string }[] = [
  { step: 1, label: 'Vidéos' },
  { step: 2, label: 'Configuration' },
  { step: 3, label: 'Génération' },
];

const StepContent: React.FC<{ step: WizardStep }> = ({ step }) => {
  if (step === 1) return <StepUpload />;
  if (step === 2) return <StepConfigure />;
  return <StepGenerate />;
};

export const WizardShell: React.FC = () => {
  const { step, setStep, files, instructions } = useWizardStore();

  const canGoNext = step === 1 ? files.length > 0 : step === 2 ? instructions.trim().length > 0 : false;
  const canGoPrev = step > 1;

  const goNext = () => {
    if (step < 3 && canGoNext) setStep((step + 1) as WizardStep);
  };

  const goPrev = () => {
    if (step > 1) setStep((step - 1) as WizardStep);
  };

  return (
    <div className='min-h-screen bg-[#020504] px-4 py-10'>
      <div className='mx-auto w-full max-w-xl'>
        <div className='mb-8 flex items-center justify-center gap-3'>
          {STEPS.map(({ step: s, label }, index) => {
            const isActive = step === s;
            const isCompleted = step > s;
            return (
              <div key={s} className='flex items-center gap-3'>
                <div className='flex flex-col items-center gap-1.5'>
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                      isActive
                        ? 'bg-[#30f4d2] text-[#020504]'
                        : isCompleted
                        ? 'bg-[#30f4d2]/50 text-[#020504]'
                        : 'bg-white/20 text-[#8b9d99]'
                    }`}
                  >
                    {s}
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      isActive ? 'text-[#30f4d2]' : isCompleted ? 'text-[#30f4d2]/60' : 'text-[#8b9d99]'
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`mb-5 h-px w-12 transition-colors ${
                      step > s ? 'bg-[#30f4d2]/50' : 'bg-white/10'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className='rounded-2xl border border-white/10 bg-[#050b0a] p-6 shadow-xl'>
          <AnimatePresence mode='wait'>
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <StepContent step={step} />
            </motion.div>
          </AnimatePresence>

          {step < 3 && (
            <div className='mt-6 flex items-center justify-between'>
              {canGoPrev ? (
                <button
                  onClick={goPrev}
                  className='flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-[#8b9d99] transition-colors hover:text-[#f3fffc]'
                >
                  <ChevronLeft className='h-4 w-4' />
                  Précédent
                </button>
              ) : (
                <div />
              )}

              <button
                onClick={goNext}
                disabled={!canGoNext}
                className='rounded-lg bg-[#30f4d2] px-5 py-2.5 text-sm font-semibold text-[#020504] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40'
              >
                Suivant
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
