'use client';

import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';

export const CursorOverlay: React.FC = () => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isPointer, setIsPointer] = useState<boolean>(false);
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(true);

  // Motion values for smooth tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Spring smoothing — gives the cursor a soft trailing feel
  const springX = useSpring(mouseX, { damping: 30, stiffness: 400, mass: 0.4 });
  const springY = useSpring(mouseY, { damping: 30, stiffness: 400, mass: 0.4 });

  useEffect(() => {
    // Detect touch device — don't render custom cursor on mobile/tablet
    const isTouch =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia('(pointer: coarse)').matches;
    setIsTouchDevice(isTouch);
    if (isTouch) return;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      setIsVisible(true);

      // Detect if hovering over an interactive element
      const target = e.target as HTMLElement;
      const computed = window.getComputedStyle(target);
      const interactive =
        target.tagName === 'A' ||
        target.tagName === 'BUTTON' ||
        target.closest('a, button, [role="button"]') !== null ||
        computed.cursor === 'pointer';
      setIsPointer(interactive);
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [mouseX, mouseY]);

  if (isTouchDevice) return null;

  return (
    <>
      {/* Outer soft ring — larger, more diffuse */}
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[9998]"
        style={{
          x: springX,
          y: springY,
          translateX: '-50%',
          translateY: '-50%',
          width: isPointer ? '64px' : '40px',
          height: isPointer ? '64px' : '40px',
          borderRadius: '50%',
          backgroundColor: isPointer
            ? 'rgba(81,224,207,0.08)'
            : 'rgba(255,255,255,0.04)',
          border: isPointer
            ? '1px solid rgba(81,224,207,0.25)'
            : '1px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          opacity: isVisible ? 1 : 0,
          transition:
            'width 0.3s cubic-bezier(0.6, 0.6, 0, 1), height 0.3s cubic-bezier(0.6, 0.6, 0, 1), background-color 0.3s, border-color 0.3s, opacity 0.3s',
        }}
      />

      {/* Inner precise dot — follows cursor exactly */}
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[9999]"
        style={{
          x: mouseX,
          y: mouseY,
          translateX: '-50%',
          translateY: '-50%',
          width: '4px',
          height: '4px',
          borderRadius: '50%',
          backgroundColor: isPointer ? '#51e0cf' : 'rgba(255,255,255,0.6)',
          opacity: isVisible ? 1 : 0,
          transition: 'background-color 0.2s, opacity 0.3s',
        }}
      />
    </>
  );
};
