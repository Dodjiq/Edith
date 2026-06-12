import { create } from 'zustand';

type WizardStep = 1 | 2 | 3;

type WizardState = {
  step: WizardStep;
  files: File[];
  projectName: string;
  platform: string;
  outputFormat: string;
  preset: string;
  language: string;
  instructions: string;
  variantsCount: number;
  isSubmitting: boolean;
  setStep: (s: WizardStep) => void;
  setFiles: (files: File[]) => void;
  setField: <K extends keyof WizardState>(key: K, value: WizardState[K]) => void;
  setIsSubmitting: (v: boolean) => void;
  reset: () => void;
};

const defaultState = {
  step: 1 as WizardStep,
  files: [],
  projectName: '',
  platform: 'tiktok',
  outputFormat: '9:16',
  preset: 'ugc_dynamic',
  language: 'fr',
  instructions: '',
  variantsCount: 3,
  isSubmitting: false,
};

export const useWizardStore = create<WizardState>((set) => ({
  ...defaultState,
  setStep: (step) => set({ step }),
  setFiles: (files) => set({ files }),
  setField: (key, value) => set({ [key]: value } as Partial<WizardState>),
  setIsSubmitting: (isSubmitting) => set({ isSubmitting }),
  reset: () => set(defaultState),
}));
