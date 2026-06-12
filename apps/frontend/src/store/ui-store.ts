import { create } from 'zustand';

type BillingCycle = 'monthly' | 'annual';
type PlanId = 'starter' | 'growth' | 'agency';

type UiStore = {
  mobileMenuOpen: boolean;
  selectedPlan: PlanId;
  billingCycle: BillingCycle;
  demoModalOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  setSelectedPlan: (plan: PlanId) => void;
  setBillingCycle: (cycle: BillingCycle) => void;
  setDemoModalOpen: (open: boolean) => void;
};

export const useUiStore = create<UiStore>((set) => ({
  mobileMenuOpen: false,
  selectedPlan: 'growth',
  billingCycle: 'monthly',
  demoModalOpen: false,
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  setSelectedPlan: (plan) => set({ selectedPlan: plan }),
  setBillingCycle: (cycle) => set({ billingCycle: cycle }),
  setDemoModalOpen: (open) => set({ demoModalOpen: open }),
}));
