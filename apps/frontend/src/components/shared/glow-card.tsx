'use client';

import { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

type GlowCardProps = {
  children: React.ReactNode;
  className?: string;
};

export const GlowCard: React.FC<GlowCardProps> = ({ children, className }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [glowPos, setGlowPos] = useState<{ x: number; y: number } | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    setGlowPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseLeave = () => setGlowPos(null);

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={{ y: -4, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } }}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-white/8 bg-white/3 p-6',
        className,
      )}
    >
      {glowPos && (
        <div
          className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
          style={{
            background: `radial-gradient(280px circle at ${glowPos.x}px ${glowPos.y}px, rgba(48,244,210,0.07), transparent 70%)`,
          }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
};
