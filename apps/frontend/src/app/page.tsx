import { Navbar } from '@/components/landing/navbar';
import { Hero } from '@/components/landing/hero';
import { LogoCloud } from '@/components/landing/logo-cloud';
import { FeaturesSection } from '@/components/landing/features-section';
import { FeatureGridSection } from '@/components/landing/feature-grid-section';
import { TestimonialsSection } from '@/components/landing/testimonials-section';
import { PricingSection } from '@/components/landing/pricing-section';
import { BlogSection } from '@/components/landing/blog-section';
import { FaqSection } from '@/components/landing/faq-section';
import { FinalCta } from '@/components/landing/final-cta';
import { Footer } from '@/components/landing/footer';
import { CursorOverlay } from '@/components/landing/cursor-overlay';

const Home: React.FC = () => (
  <div className="bg-edith-bg text-edith-text">
    <CursorOverlay />
    <Navbar />
    <Hero />
    <LogoCloud />
    <FeaturesSection />
    <FeatureGridSection />
    <TestimonialsSection />
    <PricingSection />
    <BlogSection />
    <FaqSection />
    <FinalCta />
    <Footer />
  </div>
);

export default Home;
