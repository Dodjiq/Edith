import Link from 'next/link';
import { Clapperboard } from 'lucide-react';

const sections: Array<[string, string]> = [
  ['Donnees collectees', 'Edith peut traiter les informations de compte, les projets, les fichiers video envoyes, les instructions de rendu et les metadonnees techniques necessaires au service.'],
  ['Utilisation', 'Ces donnees servent a authentifier l utilisateur, stocker les assets, declencher les rendus, afficher les statuts et ameliorer le workflow produit.'],
  ['Stockage', 'Les videos sources et exports sont stockes dans Supabase Storage. Les taches lourdes de rendu sont prevues sur Modal.'],
  ['Secrets', 'Les cles service role, Modal et Stripe ne doivent jamais etre exposees cote navigateur. Elles restent dans les environnements serveur.'],
  ['Conservation', 'La duree de conservation sera precisee lors du passage en production commerciale. Le MVP conserve les donnees necessaires au fonctionnement du compte.'],
  ['Contact', 'Pour une demande liee aux donnees, contacte contact@edith.video.'],
];

const PrivacyPage = () => {
  return (
    <main className="min-h-screen bg-[#030303] px-5 py-8 text-[#f4f1ed] sm:px-8 lg:px-10">
      <LegalNav />
      <LegalHeader label="/ Politique de confidentialite" title="Confidentialite et donnees." />
      <LegalSections sections={sections} />
    </main>
  );
};

const LegalNav = () => (
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
);

const LegalHeader = ({ label, title }: { label: string; title: string }) => (
  <header className="mx-auto max-w-5xl py-20">
    <p className="text-[11px] uppercase text-[#8f7066]">{label}</p>
    <h1 className="mt-4 max-w-3xl text-5xl font-medium leading-tight md:text-7xl" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
      {title}
    </h1>
    <p className="mt-6 max-w-2xl text-sm leading-7 text-[#9f9690]">
      Document de travail pour le MVP Edith. Il devra etre relu et adapte par un professionnel avant exploitation commerciale.
    </p>
  </header>
);

const LegalSections = ({ sections }: { sections: Array<[string, string]> }) => (
  <section className="mx-auto grid max-w-5xl gap-6 border-t border-white/[0.07] py-12 md:grid-cols-2">
    {sections.map(([title, detail]) => (
      <article key={title} className="border-t border-white/[0.08] pt-5">
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="mt-3 text-sm leading-7 text-[#8f8781]">{detail}</p>
      </article>
    ))}
  </section>
);

export default PrivacyPage;
