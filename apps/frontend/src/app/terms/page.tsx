import Link from 'next/link';
import { Clapperboard } from 'lucide-react';

const sections: Array<[string, string]> = [
  ['Objet', 'Edith est un SaaS de generation de variantes publicitaires video pour e-commerce et dropshipping.'],
  ['Compte utilisateur', 'L utilisateur est responsable de la securite de son compte, de ses fichiers et des instructions envoyees.'],
  ['Contenus envoyes', 'L utilisateur doit disposer des droits necessaires sur les videos, musiques, voix, textes, marques et assets fournis.'],
  ['Rendus', 'Les rendus peuvent varier selon la qualite du fichier source, le preset, les instructions et les services externes branches.'],
  ['Credits et paiement', 'La logique credits/Stripe est preparee pour le MVP et devra etre finalisee avant facturation reelle.'],
  ['Limites', 'Cloudflare ne realise aucun rendu video lourd. Les traitements FFmpeg/transcription sont reserves au worker Modal.'],
];

const TermsPage = () => {
  return (
    <main className="min-h-screen bg-[#030303] px-5 py-8 text-[#f4f1ed] sm:px-8 lg:px-10">
      <nav className="mx-auto flex max-w-5xl items-center justify-between">
        <Link href="/" className="flex items-center gap-3 text-sm font-semibold">
          <span className="grid size-8 place-items-center rounded-md bg-[#e7b59f] text-[#130b08]">
            <Clapperboard className="size-4" />
          </span>
          Edith
        </Link>
        <Link href="/contact" className="text-sm text-[#9f9690] hover:text-white">
          Contact
        </Link>
      </nav>

      <header className="mx-auto max-w-5xl py-20">
        <p className="text-[11px] uppercase text-[#8f7066]">/ Conditions d utilisation</p>
        <h1 className="mt-4 max-w-3xl text-5xl font-medium leading-tight md:text-7xl" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
          Conditions du service.
        </h1>
        <p className="mt-6 max-w-2xl text-sm leading-7 text-[#9f9690]">
          Document de travail pour le MVP Edith. Il devra etre relu juridiquement avant une mise en production commerciale.
        </p>
      </header>

      <section className="mx-auto grid max-w-5xl gap-6 border-t border-white/[0.07] py-12 md:grid-cols-2">
        {sections.map(([title, detail]) => (
          <article key={title} className="border-t border-white/[0.08] pt-5">
            <h2 className="text-sm font-semibold">{title}</h2>
            <p className="mt-3 text-sm leading-7 text-[#8f8781]">{detail}</p>
          </article>
        ))}
      </section>
    </main>
  );
};

export default TermsPage;
