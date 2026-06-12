'use client';

import { motion, AnimatePresence } from 'motion/react';
import { Menu, X } from 'lucide-react';
import { useUiStore } from '@/store/ui-store';
import { Button } from '@/components/buttons/button';
import { EdithGirlIcon } from '@/components/shared/edith-girl-icon';

const NAV_LINKS = [
  { label: 'À propos', href: '#features' },
  { label: 'Intégrations', href: '#integrations' },
  { label: 'Tarifs', href: '#pricing' },
  { label: 'Blog', href: '#blog' },
] as const;

export const Navbar: React.FC = () => {
  const { mobileMenuOpen, setMobileMenuOpen } = useUiStore();

  return (
    <>
      <motion.header
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-x-0 top-0 z-[99] flex items-center justify-center"
        style={{
          padding: '24px 5%',
          backgroundColor: 'rgba(255,255,255,0.012)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        <div
          className="flex w-full items-center"
          style={{ maxWidth: '1216px', justifyContent: 'space-between' }}
        >
          {/* nav-left: flex: 1 */}
          <div className="flex items-center" style={{ flex: 1 }}>
            <a href="#" className="flex items-center gap-2" style={{ height: '32px' }}>
              <EdithGirlIcon className="size-7 text-edith-accent" />
              <span
                className="text-white"
                style={{
                  fontFamily: 'var(--font-space-grotesk), sans-serif',
                  fontSize: '20px',
                  fontWeight: 600,
                  letterSpacing: '-0.02em',
                }}
              >
                Edith
              </span>
            </a>
          </div>

          {/* nav-menu: auto width, naturally centered between flex:1 siblings */}
          <nav className="hidden items-center md:flex" style={{ gap: '16px' }}>
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-white transition-all duration-300"
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  lineHeight: 1.8,
                  letterSpacing: '-0.02em',
                  borderRadius: '99px',
                  border: '1px solid transparent',
                  backgroundColor: 'transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'transparent';
                }}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* nav-right: flex: 1, justify-end */}
          <div
            className="flex items-center"
            style={{ flex: 1, justifyContent: 'flex-end' }}
          >
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden rounded-full border border-white/10 bg-white/[0.03] px-4 text-white hover:border-white/20 hover:bg-white/[0.08] hover:text-white md:inline-flex"
            >
              <a href="/login">Se connecter</a>
            </Button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 text-white/70 transition-colors hover:text-white md:hidden"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-0 top-[88px] z-[98] border-b border-white/5 bg-edith-bg/95 backdrop-blur-xl md:hidden"
          >
            <div className="px-6 py-4">
              <div className="flex flex-col gap-1">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    {link.label}
                  </a>
                ))}
                <a
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="mt-3 block w-full rounded-full bg-edith-accent py-3 text-center text-sm font-semibold text-edith-neutral-100"
                >
                  Se connecter
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
