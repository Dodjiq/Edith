import type { Variants } from 'motion/react';

// Verve signature easing curve (extracted from .button-primary CSS transition)
export const VERVE_EASE = [0.6, 0.6, 0, 1] as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 44 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: VERVE_EASE },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.7, ease: VERVE_EASE },
  },
};

export const fadeLeft: Variants = {
  hidden: { opacity: 0, x: -44 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: VERVE_EASE },
  },
};

export const fadeRight: Variants = {
  hidden: { opacity: 0, x: 44 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: VERVE_EASE },
  },
};

// Dashboard mockup 3D tilt entry (matches Verve's rotateX(10deg) initial state)
export const tiltIn: Variants = {
  hidden: { opacity: 0, rotateX: 10 },
  visible: {
    opacity: 1,
    rotateX: 0,
    transition: { duration: 0.9, ease: VERVE_EASE },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 24 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.85, ease: VERVE_EASE },
  },
};

// Pillar columns grow from bottom (height 0 → 100%)
export const pillarGrow: Variants = {
  hidden: { scaleY: 0 },
  visible: {
    scaleY: 1,
    transition: { duration: 1.4, ease: VERVE_EASE },
  },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

// Legacy alias (kept for compat with components still importing it)
export const slideInLeft = fadeLeft;
