'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { FAQ_ITEMS } from '@/lib/constants';
import { fadeUp, staggerContainer, VERVE_EASE } from '@/lib/motion';

/* ---------- FAQ icon (custom rotating + ↔ ×) ---------- */

const FaqIcon: React.FC<{ open: boolean }> = ({ open }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    style={{
      transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
      transition: 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    }}
  >
    <path
      d="M11.25 11.25V6.75H12.75V11.25H17.25V12.75H12.75V17.25H11.25V12.75H6.75V11.25H11.25Z"
      fill="currentColor"
    />
  </svg>
);

/* ---------- 3D Cube illustration ---------- */

const FaqCubeIllustration: React.FC = () => (
  <svg width="658" height="670" viewBox="0 0 658 670" fill="none" aria-hidden="true">
    {/* Light cone */}
    <path
      d="M388.791 307.484H225.409L49 130.532H568.457L388.791 307.484Z"
      fill="url(#fcube_cone)"
      fillOpacity="0.16"
    />
    {/* Mint glow */}
    <g filter="url(#fcube_centerBlur)">
      <circle cx="331.5" cy="343.5" r="146.5" fill="url(#fcube_centerGlow)" fillOpacity="0.05" />
    </g>
    {/* Cube faces */}
    <g filter="url(#fcube_backdropBlur)">
      <path d="M388.503 474.123L437.643 428.08L437.643 261.347L388.503 307.389V428.081V474.123Z" fill="url(#fcube_face)" fillOpacity="0.06" />
      <path d="M274.006 428.081L224.866 474.123V307.389L274.006 261.347V307.389V428.081Z" fill="url(#fcube_face)" fillOpacity="0.06" />
      <path d="M274.006 428.081L224.866 474.123H388.503V428.081L274.006 428.081Z" fill="url(#fcube_face)" fillOpacity="0.06" />
      <path d="M274.006 307.389V428.081L388.503 428.081V307.389H274.006Z" fill="url(#fcube_face)" fillOpacity="0.06" />
      <path d="M388.503 307.389L437.643 261.347H274.006V307.389H388.503Z" fill="url(#fcube_face)" fillOpacity="0.06" />
      <path
        d="M437.643 428.08L388.503 474.123M437.643 428.08L437.643 261.347M437.643 428.08L388.503 428.081M388.503 474.123H224.866M388.503 474.123V428.081M224.866 474.123L274.006 428.081M224.866 474.123V307.389M274.006 428.081L388.503 428.081M274.006 428.081V307.389M437.643 261.347L388.503 307.389M437.643 261.347H274.006M388.503 307.389V428.081M388.503 307.389H274.006M224.866 307.389L274.006 261.347M224.866 307.389H274.006M274.006 261.347V307.389"
        stroke="white"
        strokeOpacity="0.24"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </g>
    {/* Highlights */}
    <path d="M274.006 428.081L224.866 474.123H388.503V428.081L274.006 428.081Z" fill="url(#fcube_highlight)" fillOpacity="0.16" />
    <path d="M388.503 307.389L437.643 261.347H274.006V307.389H388.503Z" fill="url(#fcube_highlight)" fillOpacity="0.16" />
    <path d="M274.006 261.347L224.866 307.389H274.006V261.347Z" fill="url(#fcube_highlight)" fillOpacity="0.16" />
    <path d="M388.503 474.123L437.643 428.08L388.503 428.081V474.123Z" fill="url(#fcube_highlight)" fillOpacity="0.16" />
    {/* Vertex dots */}
    {[
      { x: 274.006, y: 428.082, dx: 437.643 },
      { x: 274.006, y: 261.347, dx: 437.643 },
      { x: 224.866, y: 474.123, dx: 388.503 },
      { x: 224.866, y: 307.388, dx: 388.503 },
    ].map((d, i) => (
      <g key={i}>
        <circle cx={d.x} cy={d.y} r="3.2" fill="white" fillOpacity="0.64" />
        <circle cx={d.dx} cy={d.y} r="3.2" fill="white" fillOpacity="0.64" />
        <line x1={d.x} y1={d.y} x2={d.dx} y2={d.y} stroke="white" strokeOpacity="0.64" strokeWidth="0.6" />
      </g>
    ))}
    {/* Floating discs */}
    <g filter="url(#fcube_discBlur1)">
      <ellipse cx="455" cy="220" rx="38" ry="18" fill="url(#fcube_discFill)" fillOpacity="0.16" transform="rotate(-18 455 220)" />
      <ellipse cx="455" cy="220" rx="38" ry="18" fill="none" stroke="white" strokeOpacity="0.16" strokeWidth="0.6" transform="rotate(-18 455 220)" />
    </g>
    <g filter="url(#fcube_discBlur2)">
      <ellipse cx="383" cy="117" rx="30" ry="13" fill="url(#fcube_discFill)" fillOpacity="0.16" transform="rotate(-12 383 117)" />
      <ellipse cx="383" cy="117" rx="30" ry="13" fill="none" stroke="white" strokeOpacity="0.16" strokeWidth="0.5" transform="rotate(-12 383 117)" />
    </g>
    <g filter="url(#fcube_discBlur3)">
      <ellipse cx="264" cy="185" rx="76" ry="34" fill="url(#fcube_discFill)" fillOpacity="0.18" transform="rotate(-18 264 185)" />
      <ellipse cx="264" cy="185" rx="76" ry="34" fill="none" stroke="white" strokeOpacity="0.16" strokeWidth="1" transform="rotate(-18 264 185)" />
    </g>
    <defs>
      <filter id="fcube_centerBlur" x="5" y="17" width="653" height="653" filterUnits="userSpaceOnUse">
        <feGaussianBlur stdDeviation="90" />
      </filter>
      <filter id="fcube_backdropBlur" x="137" y="173" width="388" height="388" filterUnits="userSpaceOnUse">
        <feGaussianBlur stdDeviation="43" />
      </filter>
      <filter id="fcube_discBlur1" x="380" y="170" width="160" height="100">
        <feGaussianBlur stdDeviation="0.5" />
      </filter>
      <filter id="fcube_discBlur2" x="330" y="80" width="120" height="80">
        <feGaussianBlur stdDeviation="0.5" />
      </filter>
      <filter id="fcube_discBlur3" x="170" y="120" width="200" height="150">
        <feGaussianBlur stdDeviation="2" />
      </filter>
      <linearGradient id="fcube_cone" x1="308.7" y1="131" x2="308.7" y2="386.5" gradientUnits="userSpaceOnUse">
        <stop stopColor="#030D0C" stopOpacity="0" />
        <stop offset="1" stopColor="white" />
      </linearGradient>
      <radialGradient id="fcube_centerGlow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(331.5 346.35) rotate(90) scale(343.448)">
        <stop stopColor="#51E0CF" />
        <stop offset="1" stopColor="#51E0CF" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="fcube_face" x1="331" y1="261" x2="331" y2="474" gradientUnits="userSpaceOnUse">
        <stop stopColor="white" />
        <stop offset="1" stopColor="white" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="fcube_highlight" x1="443" y1="261" x2="224" y2="308" gradientUnits="userSpaceOnUse">
        <stop stopColor="white" />
        <stop offset="1" stopColor="white" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="fcube_discFill" x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">
        <stop stopColor="white" />
        <stop offset="1" stopColor="white" stopOpacity="0" />
      </linearGradient>
    </defs>
  </svg>
);

/* ---------- FAQ item — Webflow w-dropdown structure ---------- */

const FaqItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
  const [open, setOpen] = useState<boolean>(false);

  return (
    <div
      className="faq"
      style={{
        borderBottom: '1px solid rgba(255,255,255,0.078)',
        transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        overflow: 'hidden',
        display: 'block',
      }}
    >
      {/* faq-toggle - padding 24px 24px 24px 0 */}
      <button
        onClick={() => setOpen(!open)}
        className="faq-toggle"
        style={{
          padding: '24px 24px 24px 0',
          display: 'block',
          width: '100%',
          textAlign: 'left',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
        }}
        aria-expanded={open}
      >
        {/* faq-title-wrap - gap 12px, align center */}
        <div
          className="faq-title-wrap"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: '12px',
            width: '100%',
          }}
        >
          {/* faq-icon-wrap - 24x24, color #ffffffb8 */}
          <div
            className="faq-icon-wrap"
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '32px',
              color: '#ffffffb8',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flex: 'none',
              position: 'relative',
            }}
          >
            <FaqIcon open={open} />
          </div>
          {/* faq-title - 16px Space Grotesk 600 */}
          <div
            className="faq-title"
            style={{
              fontFamily: 'var(--font-space-grotesk), sans-serif',
              fontSize: '16px',
              fontWeight: 600,
              lineHeight: 1.8,
              letterSpacing: '-0.02em',
              color: '#ffffffb8',
            }}
          >
            {question}
          </div>
        </div>
      </button>

      {/* faq-content - padding 0 24px 0 36px */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: VERVE_EASE }}
            className="faq-content"
            style={{
              padding: '0 24px 0 36px',
              overflow: 'hidden',
              display: 'block',
            }}
          >
            {/* faq-tab - margin-top -8px, padding-bottom 24px */}
            <div
              className="faq-tab"
              style={{ marginTop: '-8px', paddingBottom: '24px' }}
            >
              <p
                className="faq-text"
                style={{
                  fontSize: '14px',
                  lineHeight: 1.8,
                  letterSpacing: '-0.02em',
                  color: '#ffffff7a',
                  margin: 0,
                }}
              >
                {answer}
              </p>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ---------- Section — Verve HTML structure exactly ---------- */

export const FaqSection: React.FC = () => (
  <section
    id="faq"
    className="section-faq"
    style={{
      padding: '120px 5% 164px',
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: '#050505',
    }}
  >
    {/* container-large - max 1216px, position relative, z-index 2 */}
    <div
      className="container-large"
      style={{
        width: '100%',
        maxWidth: '1216px',
        marginLeft: 'auto',
        marginRight: 'auto',
        position: 'relative',
        zIndex: 2,
      }}
    >
      {/* faq-container - max 800px, LEFT-ALIGNED, position relative for child absolute */}
      <div
        className="faq-container"
        style={{ width: '100%', maxWidth: '800px', position: 'relative' }}
      >
        {/* title-left - mb 64px, flex-col, align-start */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="title-left"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            marginBottom: '64px',
          }}
        >
          {/* badge - margin-bottom 16px */}
          <motion.div variants={fadeUp} style={{ marginBottom: '16px' }}>
            <span
              className="badge inline-flex items-center"
              style={{
                gap: '8px',
                backgroundColor: 'rgba(255,255,255,0.02)',
                backgroundImage:
                  'radial-gradient(circle, rgba(255,255,255,0.04), rgba(255,255,255,0))',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                padding: '4px 12px 4px 10px',
                borderRadius: '99px',
                fontSize: '14px',
                lineHeight: 1.8,
                letterSpacing: '-0.02em',
                color: '#ffffff',
                boxShadow:
                  'inset 0 1px 1px rgba(255,255,255,0.08), inset 0 2px 12px rgba(255,255,255,0.04)',
              }}
            >
              <Sparkles className="size-5 text-edith-accent" strokeWidth={1.5} />
              Edith Product Overview
            </span>
          </motion.div>

          {/* wrap-v-medium - gap 16px */}
          <motion.div
            variants={fadeUp}
            className="wrap-v-medium"
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            <h2 style={{ margin: 0 }}>
              <span
                className="title-linear"
                style={{
                  fontFamily: 'var(--font-space-grotesk), sans-serif',
                  fontSize: 'clamp(36px, 5vw, 56px)',
                  fontWeight: 600,
                  lineHeight: 1.2,
                  letterSpacing: '-0.02em',
                  color: 'transparent',
                  backgroundImage: 'linear-gradient(rgba(255,255,255,0.56), #ffffff 75%)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  display: 'inline-block',
                }}
              >
                Questions fréquentes
              </span>
            </h2>
            <p
              className="paragraph-regular"
              style={{
                fontSize: '16px',
                lineHeight: 1.8,
                letterSpacing: '-0.02em',
                margin: 0,
                color: '#ffffffb8',
              }}
            >
              Pour toute autre question, n'hésitez pas à{' '}
              <span style={{ color: '#ffffff' }}>contacter notre équipe.</span>
            </p>
          </motion.div>
        </motion.div>

        {/* faq-wrapper - max 560px */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="faq-wrapper"
          style={{ width: '100%', maxWidth: '560px' }}
        >
          {FAQ_ITEMS.map((item) => (
            <motion.div key={item.question} variants={fadeUp}>
              <FaqItem question={item.question} answer={item.answer} />
            </motion.div>
          ))}
        </motion.div>

        {/* faq-image - position absolute, top 56px, left 696px (relative to faq-container) */}
        <div
          aria-hidden="true"
          className="faq-image pointer-events-none hidden lg:block"
          style={{
            position: 'absolute',
            top: '56px',
            left: '696px',
          }}
        >
          <FaqCubeIllustration />
        </div>
      </div>

      {/* background-forward - INSIDE container-large, max 1440px, absolute top */}
      <div
        aria-hidden="true"
        className="background-forward pointer-events-none"
        style={{
          position: 'absolute',
          inset: '0 0 auto',
          width: '100%',
          maxWidth: '1440px',
          marginLeft: 'auto',
          marginRight: 'auto',
          height: '764px',
          zIndex: 0,
        }}
      >
        {/* background-light - 2400px wide, top-left, mint radial in RIGHT portion of SVG */}
        <div
          className="background-light"
          style={{
            position: 'absolute',
            inset: '0 auto auto 0',
            width: '2400px',
            maxWidth: 'none',
            height: '764px',
            /* recreates the FAQ Light 01 SVG: radialGradient at translate(1451.62, 0)
               which is on the right side of the 2400px width */
            backgroundImage:
              'radial-gradient(ellipse 645px 1458px at 1451px 0, rgba(76,202,187,0.36), rgba(6,5,28,0) 75%)',
          }}
        />

        {/* background-pattern - sparse + crosses, soft-light blend */}
        <div
          className="background-pattern"
          style={{
            position: 'absolute',
            inset: '0 auto auto 0',
            width: '2400px',
            maxWidth: 'none',
            height: '764px',
            opacity: 0.35,
            mixBlendMode: 'soft-light',
            backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='352' height='352' viewBox='0 0 352 352'><g stroke='white' stroke-width='1' stroke-opacity='0.8' fill='none' stroke-linecap='round'><path d='M176 170 v12 M170 176 h12'/></g></svg>")`,
            backgroundSize: '352px 352px',
            backgroundRepeat: 'repeat',
          }}
        />
      </div>
    </div>
  </section>
);
