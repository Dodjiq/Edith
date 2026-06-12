'use client';

import { useState } from 'react';
import { Eye, EyeOff, Globe2, ImageIcon, Phone, Play, Sparkles, Video } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/buttons/button';
import { Input } from '@/components/inputs/input';
import { EdithGirlIcon } from '@/components/shared/edith-girl-icon';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { createClient } from '@/utils/supabase/client';

type Tab = 'login' | 'signup';

const ERROR_MESSAGES: Record<string, string> = {
  'Invalid login credentials': 'Email ou mot de passe incorrect.',
  'Email not confirmed': 'Veuillez confirmer votre email avant de vous connecter.',
  'User already registered': 'Un compte existe deja avec cet email.',
  'Password should be at least 6 characters': 'Le mot de passe doit contenir au moins 6 caracteres.',
  'Unable to validate email address: invalid format': 'Format d email invalide.',
};

const translateError = (message: string): string =>
  ERROR_MESSAGES[message] ?? 'Une erreur est survenue. Veuillez reessayer.';

const previewShots = [
  { label: 'Hook', width: '34%', opacity: 0.7 },
  { label: 'Demo', width: '58%', opacity: 1 },
  { label: 'Proof', width: '45%', opacity: 0.82 },
] as const;

const COUNTRIES = [
  { code: 'FR', label: 'France', dialCode: '+33' },
  { code: 'CI', label: "Cote d'Ivoire", dialCode: '+225' },
  { code: 'SN', label: 'Senegal', dialCode: '+221' },
  { code: 'MA', label: 'Maroc', dialCode: '+212' },
  { code: 'BE', label: 'Belgique', dialCode: '+32' },
  { code: 'CA', label: 'Canada', dialCode: '+1' },
  { code: 'US', label: 'Etats-Unis', dialCode: '+1' },
] as const;

type CountryCode = (typeof COUNTRIES)[number]['code'];

const DEFAULT_COUNTRY = COUNTRIES[0];

const getCountryByCode = (countryCode: CountryCode) =>
  COUNTRIES.find((country) => country.code === countryCode) ?? DEFAULT_COUNTRY;

const AuthPreview: React.FC = () => (
  <section className="relative hidden h-dvh overflow-hidden border-l border-white/8 bg-edith-bg lg:block">
    <div
      aria-hidden="true"
      className="absolute inset-0"
      style={{
        backgroundImage:
          'radial-gradient(circle farthest-corner at 30% 0%, rgba(18,139,135,0.48), rgba(5,5,5,0) 48%), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px)',
        backgroundSize: 'auto, 88px 88px, 88px 88px',
      }}
    />

    <div className="relative flex h-full flex-col justify-between px-10 py-7 xl:px-14">
      <div className="flex items-center justify-between text-sm text-white/56">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
          <Sparkles className="size-4 text-edith-accent" strokeWidth={1.5} />
          Image ou video
        </span>
        <span className="font-display text-white/72">Edith preview</span>
      </div>

      <div className="mx-auto flex w-full max-w-[540px] flex-col gap-6">
        <div className="space-y-3">
          <h2 className="font-display text-[clamp(30px,3.3vw,46px)] font-semibold leading-[1.05] tracking-normal text-white">
            <span className="block whitespace-nowrap">Une image attire.</span>
            <span className="block whitespace-nowrap">Une vidéo convertit.</span>
          </h2>
          <p className="max-w-md text-sm leading-6 text-edith-text">
            Edith transforme vos rushs produits en sequences courtes, rythmees et pretes a tester.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18, rotateX: 8 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-[24px] border border-white/10 bg-[#07100f]/92 p-3 shadow-[0_40px_120px_rgba(0,0,0,0.45)]"
          style={{ transformStyle: 'preserve-3d' }}
        >
          <div className="grid gap-3 md:grid-cols-[0.78fr_1.22fr]">
            <div className="relative min-h-[300px] overflow-hidden rounded-[18px] border border-white/8 bg-white/[0.025] p-4">
              <div className="mb-4 flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-white/45">
                  <ImageIcon className="size-4" />
                  Image
                </span>
                <span className="rounded-full bg-white/8 px-2 py-1 text-xs text-white/52">1 frame</span>
              </div>
              <div className="absolute inset-x-4 bottom-4 top-16 rounded-2xl border border-white/8 bg-[linear-gradient(150deg,rgba(255,255,255,0.14),rgba(81,224,207,0.04)_42%,rgba(255,255,255,0.03))]" />
              <div className="absolute bottom-8 left-8 right-8 space-y-2">
                <div className="h-2 w-24 rounded-full bg-white/18" />
                <div className="h-2 w-36 rounded-full bg-white/10" />
              </div>
            </div>

            <div className="relative min-h-[300px] overflow-hidden rounded-[18px] border border-edith-accent/25 bg-[#081614] p-4">
              <div className="mb-4 flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-edith-accent">
                  <Video className="size-4" />
                  Video
                </span>
                <span className="rounded-full bg-edith-accent/12 px-2 py-1 text-xs text-edith-accent">
                  9:16 ads
                </span>
              </div>

              <div className="relative h-[190px] overflow-hidden rounded-2xl border border-white/10 bg-[#050807]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_22%,rgba(81,224,207,0.24),transparent_38%)]" />
                <motion.div
                  aria-hidden="true"
                  animate={{ x: ['-24%', '116%'] }}
                  transition={{ duration: 3.2, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
                  className="absolute inset-y-0 w-16 bg-edith-accent/10 blur-xl"
                />
                <div className="absolute left-5 top-5 rounded-full bg-white/10 p-3 text-white">
                  <Play className="size-5 fill-current" />
                </div>
                <div className="absolute bottom-5 left-5 right-5 space-y-2">
                  {previewShots.map((shot) => (
                    <div key={shot.label} className="flex items-center gap-2">
                      <span className="w-10 text-xs text-white/42">{shot.label}</span>
                      <div className="h-2 flex-1 rounded-full bg-white/8">
                        <div
                          className="h-full rounded-full bg-edith-accent"
                          style={{ width: shot.width, opacity: shot.opacity }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-4 gap-2">
                {[0, 1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-14 rounded-xl border border-white/8 bg-white/[0.035]"
                    style={{
                      backgroundImage:
                        item === 1
                          ? 'linear-gradient(135deg, rgba(81,224,207,0.24), rgba(255,255,255,0.04))'
                          : undefined,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="flex items-center justify-between border-t border-white/8 pt-5 text-xs text-white/45">
        <span>Upload. Prompt. Render.</span>
        <span>Silences coupes automatiquement</span>
      </div>
    </div>
  </section>
);

export function AuthPage() {
  const router = useRouter();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<Tab>('signup');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [countryCode, setCountryCode] = useState<CountryCode>(DEFAULT_COUNTRY.code);
  const [phoneNumber, setPhoneNumber] = useState<string>(`${DEFAULT_COUNTRY.dialCode} `);
  const [isLoginPasswordVisible, setIsLoginPasswordVisible] = useState<boolean>(false);
  const [isSignupPasswordVisible, setIsSignupPasswordVisible] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  const selectedCountry = getCountryByCode(countryCode);

  const handleCountryChange = (nextCountryCode: CountryCode) => {
    const previousCountry = getCountryByCode(countryCode);
    const nextCountry = getCountryByCode(nextCountryCode);

    setCountryCode(nextCountryCode);
    setPhoneNumber((currentPhoneNumber) => {
      const trimmedPhoneNumber = currentPhoneNumber.trim();
      const startsWithPreviousDialCode = trimmedPhoneNumber.startsWith(previousCountry.dialCode);
      const phoneWithoutDialCode = startsWithPreviousDialCode
        ? trimmedPhoneNumber.slice(previousCountry.dialCode.length).trimStart()
        : trimmedPhoneNumber;

      return phoneWithoutDialCode
        ? `${nextCountry.dialCode} ${phoneWithoutDialCode}`
        : `${nextCountry.dialCode} `;
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(translateError(signInError.message));
      setLoading(false);
      return;
    }

    router.push('/dashboard');
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          country: selectedCountry.label,
          country_code: selectedCountry.code,
          phone_number: phoneNumber,
        },
      },
    });

    if (signUpError) {
      setError(translateError(signUpError.message));
      setLoading(false);
      return;
    }

    setSuccessMessage('Compte cree. Verifiez votre email pour confirmer votre inscription.');
    setLoading(false);
  };

  const switchTab = (tab: Tab) => {
    setActiveTab(tab);
    setError('');
    setSuccessMessage('');
  };

  return (
    <main className="h-dvh overflow-hidden bg-edith-bg text-white">
      <div className="grid h-dvh overflow-hidden lg:grid-cols-[minmax(420px,0.9fr)_minmax(560px,1.1fr)]">
        <section className="flex h-dvh items-center justify-center overflow-hidden px-5 py-5 sm:px-8">
          <div className="w-full max-w-[420px]">
            <Link href="/" className="mb-6 inline-flex items-center gap-2">
              <EdithGirlIcon className="size-7 text-edith-accent" />
              <span className="font-display text-xl font-semibold text-white">Edith</span>
            </Link>

            <div className="mb-5 space-y-2.5">
              <p className="text-sm font-medium text-edith-accent">
                {activeTab === 'signup' ? 'Creation de compte' : 'Bon retour'}
              </p>
              <h1 className="font-display text-3xl font-semibold leading-tight tracking-normal text-white">
                {activeTab === 'signup' ? 'Lancez votre premiere video.' : 'Connectez-vous a votre studio.'}
              </h1>
              <p className="text-sm leading-5 text-edith-text">
                {activeTab === 'signup'
                  ? 'Importez vos rushs, demandez une crea, puis laissez Edith assembler les coupes, sous-titres et variations.'
                  : 'Retrouvez vos projets, rendus et workflows de montage IA.'}
              </p>
            </div>

            <div className="mb-5 grid grid-cols-2 rounded-full border border-white/10 bg-white/[0.04] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_18px_50px_rgba(0,0,0,0.24)] backdrop-blur-xl">
              <button
                type="button"
                onClick={() => switchTab('login')}
                className={`rounded-full px-3 py-2.5 text-sm font-medium transition-all ${
                  activeTab === 'login'
                    ? 'border border-white/18 bg-white/16 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_8px_24px_rgba(81,224,207,0.12)] backdrop-blur-xl'
                    : 'text-white/56 hover:text-white'
                }`}
              >
                Se connecter
              </button>
              <button
                type="button"
                onClick={() => switchTab('signup')}
                className={`rounded-full px-3 py-2.5 text-sm font-medium transition-all ${
                  activeTab === 'signup'
                    ? 'border border-edith-accent/38 bg-edith-accent/16 text-edith-accent shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_8px_24px_rgba(81,224,207,0.18)] backdrop-blur-xl'
                    : 'text-white/56 hover:text-white'
                }`}
              >
                Creer un compte
              </button>
            </div>

            {activeTab === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <label className="block pl-1 text-sm font-medium leading-5 text-white" htmlFor="login-email">
                    Adresse email
                  </label>
                  <Input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vous@marque.com"
                    required
                    className="h-11 rounded-xl border-white/10 bg-white/[0.035] px-4 text-white placeholder:text-white/32 focus-visible:border-edith-accent/60 focus-visible:ring-edith-accent/20"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block pl-1 text-sm font-medium leading-5 text-white" htmlFor="login-password">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={isLoginPasswordVisible ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="********"
                      required
                      className="h-11 rounded-xl border-white/10 bg-white/[0.035] px-4 pr-12 text-white placeholder:text-white/32 focus-visible:border-edith-accent/60 focus-visible:ring-edith-accent/20"
                    />
                    <button
                      type="button"
                      aria-label={isLoginPasswordVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                      onClick={() => setIsLoginPasswordVisible((isVisible) => !isVisible)}
                      className="absolute inset-y-1 right-2 flex size-9 items-center justify-center rounded-lg text-white/45 transition-colors hover:bg-white/8 hover:text-white focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-edith-accent/20"
                    >
                      {isLoginPasswordVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="rounded-xl border border-red-400/15 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full rounded-full border border-edith-accent/45 bg-edith-accent/18 font-display font-semibold text-edith-accent shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_14px_40px_rgba(81,224,207,0.16)] backdrop-blur-xl hover:bg-edith-accent/26 hover:text-white"
                >
                  {loading ? 'Connexion...' : 'Se connecter'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSignup} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="block pl-1 text-sm font-medium leading-5 text-white" htmlFor="signup-email">
                    Adresse email
                  </label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vous@marque.com"
                    required
                    className="h-11 rounded-xl border-white/10 bg-white/[0.035] px-4 text-white placeholder:text-white/32 focus-visible:border-edith-accent/60 focus-visible:ring-edith-accent/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block pl-1 text-sm font-medium leading-5 text-white" htmlFor="signup-password">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={isSignupPasswordVisible ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 caracteres"
                      required
                      className="h-11 rounded-xl border-white/10 bg-white/[0.035] px-4 pr-12 text-white placeholder:text-white/32 focus-visible:border-edith-accent/60 focus-visible:ring-edith-accent/20"
                    />
                    <button
                      type="button"
                      aria-label={isSignupPasswordVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                      onClick={() => setIsSignupPasswordVisible((isVisible) => !isVisible)}
                      className="absolute inset-y-1 right-2 flex size-9 items-center justify-center rounded-lg text-white/45 transition-colors hover:bg-white/8 hover:text-white focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-edith-accent/20"
                    >
                      {isSignupPasswordVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block pl-1 text-sm font-medium leading-5 text-white" htmlFor="signup-country">
                    Pays
                  </label>
                  <Select
                    value={countryCode}
                    onValueChange={(value) => handleCountryChange(value as CountryCode)}
                    required
                  >
                    <SelectTrigger
                      id="signup-country"
                      className="h-11 w-full rounded-xl border-white/12 bg-[#0b0f0e] px-3 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-edith-accent/30 hover:bg-[#0e1413] focus-visible:border-edith-accent/60 focus-visible:ring-edith-accent/20 [&_svg]:text-white/38"
                    >
                      <span className="flex min-w-0 flex-1 items-center gap-3">
                        <span className="flex size-7 items-center justify-center rounded-full border border-edith-accent/20 bg-edith-accent/10 text-edith-accent">
                          <Globe2 className="size-4" />
                        </span>
                        <span className="min-w-0 flex-1 truncate text-left text-base font-medium leading-none text-white">
                          {selectedCountry.label}
                        </span>
                        <span className="rounded-full border border-edith-accent/20 bg-edith-accent/10 px-2.5 py-1 text-sm font-medium leading-none text-edith-accent">
                          {selectedCountry.dialCode}
                        </span>
                      </span>
                    </SelectTrigger>
                    <SelectContent
                      align="start"
                      className="border-white/10 bg-[#07100f] text-white shadow-[0_18px_60px_rgba(0,0,0,0.4)]"
                    >
                      {COUNTRIES.map((country) => (
                        <SelectItem
                          key={country.code}
                          value={country.code}
                          className="rounded-lg px-3 py-2.5 text-white/78 focus:bg-edith-accent/12 focus:text-white"
                        >
                          <span className="flex w-full items-center justify-between gap-4">
                            <span>{country.label}</span>
                            <span className="text-xs text-edith-accent">{country.dialCode}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="block pl-1 text-sm font-medium leading-5 text-white" htmlFor="signup-phone">
                    Numéro de téléphone
                  </label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-edith-accent" />
                    <Input
                      id="signup-phone"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder={`${selectedCountry.dialCode} 6 12 34 56 78`}
                      required
                      className="h-11 rounded-xl border-white/10 bg-white/[0.035] px-4 pl-11 text-white placeholder:text-white/32 focus-visible:border-edith-accent/60 focus-visible:ring-edith-accent/20"
                    />
                  </div>
                </div>

                {error && (
                  <p className="rounded-xl border border-red-400/15 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                    {error}
                  </p>
                )}

                {successMessage && (
                  <p className="rounded-xl border border-edith-accent/20 bg-edith-accent/10 px-3 py-2 text-sm text-edith-accent">
                    {successMessage}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full rounded-full border border-edith-accent/45 bg-edith-accent/18 font-display font-semibold text-edith-accent shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_14px_40px_rgba(81,224,207,0.16)] backdrop-blur-xl hover:bg-edith-accent/26 hover:text-white"
                >
                  {loading ? 'Creation...' : 'Creer mon compte'}
                </Button>
              </form>
            )}

            <p className="mt-4 text-xs leading-5 text-white/42">
              En continuant, vous acceptez nos{' '}
              <a href="#" className="text-edith-accent transition hover:text-edith-accent-light">
                Conditions d&apos;utilisation
              </a>{' '}
              et notre{' '}
              <a href="#" className="text-edith-accent transition hover:text-edith-accent-light">
                Politique de confidentialite
              </a>
              .
            </p>
          </div>
        </section>

        <AuthPreview />
      </div>
    </main>
  );
}
