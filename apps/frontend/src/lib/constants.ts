export const NAV_LINKS = [
  { label: 'Comment ça marche', href: '#workflow' },
  { label: 'Tarifs', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
] as const;

export const HERO_PROOF_POINTS = [
  'Gratuit pour commencer',
  'Sans compétences en montage',
  'Résultat en moins de 2 minutes',
  'TikTok · Reels · Meta Ads',
] as const;

export const LOGO_CLOUD_ITEMS = [
  'TikTok Ads',
  'Meta Ads',
  'Shopify',
  'WooCommerce',
  'WhatsApp',
  'YouTube Shorts',
  'Instagram Reels',
  'Google Drive',
] as const;

export const WORKFLOW_STEPS = [
  {
    number: '01',
    title: 'Importez vos vidéos',
    description:
      'Ajoutez vos vidéos produits, rushs UGC, vidéos concurrentes, démonstrations ou captures. Edith prépare automatiquement une base de montage.',
    tags: ['rush-produit.mp4', 'ugc-client.mp4', 'inspiration.mp4'],
  },
  {
    number: '02',
    title: 'Décrivez le montage',
    description:
      'Écrivez une instruction simple : style TikTok dynamique, hook fort, sous-titres visibles, cuts rapides, CTA WhatsApp.',
    tags: ['Hook', 'Cut', 'CTA', 'UGC'],
  },
  {
    number: '03',
    title: 'Laissez Edith structurer',
    description:
      "L'IA organise les scènes, améliore le rythme, place les sous-titres et prépare plusieurs angles marketing.",
    tags: ['Rythme', 'Sous-titres', 'Angles'],
  },
  {
    number: '04',
    title: 'Exportez et testez',
    description:
      'Téléchargez plusieurs variantes prêtes pour TikTok, Reels, Shorts, Facebook Ads et WhatsApp.',
    tags: ['9:16', '1:1', '16:9'],
  },
] as const;

export const FEATURES = [
  {
    title: 'Montage multi-vidéos',
    description:
      'Importez plusieurs vidéos et laissez Edith sélectionner les meilleures séquences.',
    icon: 'Layers',
  },
  {
    title: 'Prompts créatifs',
    description:
      'Demandez un style UGC, premium, agressif, storytelling, avant/après ou viral.',
    icon: 'Sparkles',
  },
  {
    title: 'Sous-titres automatiques',
    description:
      'Ajoutez des captions lisibles, rythmées et adaptées aux formats courts.',
    icon: 'Subtitles',
  },
  {
    title: 'Hooks publicitaires',
    description:
      'Créez des débuts de vidéo plus forts pour retenir l\'attention dès les 3 premières secondes.',
    icon: 'Zap',
  },
  {
    title: 'Exports sociaux',
    description:
      'Générez rapidement des formats 9:16, 1:1 et 16:9 pour tous vos canaux.',
    icon: 'Share2',
  },
  {
    title: 'Variantes A/B',
    description:
      'Créez plusieurs versions d\'une même vidéo pour tester différents angles marketing.',
    icon: 'GitBranch',
  },
] as const;

export const USE_CASES = [
  {
    tag: 'Test produit',
    title: 'Test produit rapide',
    description:
      'Créez 5 à 10 créas pour tester un produit sans passer la journée sur CapCut.',
  },
  {
    tag: 'COD',
    title: 'Publicités COD',
    description:
      'Générez des vidéos orientées commande WhatsApp, formulaire ou livraison à domicile.',
  },
  {
    tag: 'UGC',
    title: 'UGC simulé',
    description:
      'Structurez vos vidéos comme un avis client, une démonstration ou une preuve sociale.',
  },
  {
    tag: 'Analyse',
    title: 'Clipping concurrent',
    description:
      "Analysez des vidéos existantes et recréez des angles plus propres pour vos tests.",
  },
] as const;

export const INTEGRATIONS = [
  { name: 'Shopify', category: 'E-commerce' },
  { name: 'WooCommerce', category: 'E-commerce' },
  { name: 'TikTok', category: 'Ads' },
  { name: 'Meta Ads', category: 'Ads' },
  { name: 'WhatsApp', category: 'Distribution' },
  { name: 'Google Drive', category: 'Stockage' },
  { name: 'Voice Clone', category: 'Audio' },
  { name: 'API', category: 'Dev' },
  { name: 'Analytics', category: 'Data' },
] as const;

export const PRICING_PLANS = [
  {
    id: 'basic' as const,
    nameKey: 'pricing.basic.name',
    descKey: 'pricing.basic.desc',
    ctaKey: 'pricing.basic.cta',
    price: { monthly: 0, annual: 0 },
    popular: false,
    featureKeys: [
      'pricing.basic.f1',
      'pricing.basic.f2',
      'pricing.basic.f3',
      'pricing.basic.f4',
      'pricing.basic.f5',
      'pricing.basic.f6',
      'pricing.basic.f7',
      'pricing.basic.f8',
    ],
  },
  {
    id: 'pro' as const,
    nameKey: 'pricing.pro.name',
    descKey: 'pricing.pro.desc',
    ctaKey: 'pricing.pro.cta',
    price: { monthly: 19.99, annual: 167.92 },
    popular: true,
    featureKeys: [
      'pricing.pro.f1',
      'pricing.pro.f2',
      'pricing.pro.f3',
      'pricing.pro.f4',
      'pricing.pro.f5',
      'pricing.pro.f6',
      'pricing.pro.f7',
      'pricing.pro.f8',
      'pricing.pro.f9',
    ],
  },
  {
    id: 'premium' as const,
    nameKey: 'pricing.premium.name',
    descKey: 'pricing.premium.desc',
    ctaKey: 'pricing.premium.cta',
    price: { monthly: 29.99, annual: 251.92 },
    popular: false,
    featureKeys: [
      'pricing.premium.f1',
      'pricing.premium.f2',
      'pricing.premium.f3',
      'pricing.premium.f4',
      'pricing.premium.f5',
      'pricing.premium.f6',
      'pricing.premium.f7',
      'pricing.premium.f8',
      'pricing.premium.f9',
      'pricing.premium.f10',
    ],
  },
] as const;

export const FAQ_ITEMS = [
  { questionKey: 'faq.q1', answerKey: 'faq.a1' },
  { questionKey: 'faq.q2', answerKey: 'faq.a2' },
  { questionKey: 'faq.q3', answerKey: 'faq.a3' },
  { questionKey: 'faq.q4', answerKey: 'faq.a4' },
] as const;

export const TESTIMONIALS = [
  {
    name: 'Sarah',
    role: 'E-commerçante',
    company: 'Beauté & bien-être',
    quote:
      "Avant, je perdais trop de temps sur CapCut. Avec Edith, je peux sortir plusieurs versions et tester plus vite mes produits.",
    initials: 'SA',
  },
  {
    name: 'David',
    role: 'Media buyer',
    company: 'Agence Ads',
    quote:
      "Le plus utile, c'est la logique de variantes. On peut tester hook, sous-titres, rythme et CTA sans refaire toute la vidéo.",
    initials: 'DK',
  },
  {
    name: 'Amina',
    role: 'Créatrice UGC',
    company: 'Contenu TikTok',
    quote:
      "Je peux livrer des vidéos plus propres aux clients, même quand les rushs de base sont désorganisés.",
    initials: 'AM',
  },
] as const;

export const STATS = [
  { value: '48h', label: 'de montage économisées sur une grosse semaine de tests créas' },
  { value: '95%', label: 'du workflow peut être fait sans logiciel de montage complexe' },
  { value: '22K+', label: 'variantes créatives possibles avec templates, prompts et exports' },
] as const;

export const BLOG_ARTICLES = [
  {
    category: 'Creative Strategy',
    title: 'Comment structurer un hook qui retient l\'attention',
    excerpt:
      'Les premières secondes décident souvent si votre vidéo sera regardée ou ignorée.',
    readTime: '5 min',
  },
  {
    category: 'Product Ads',
    title: 'Créer 10 variantes vidéo à partir d\'un seul produit',
    excerpt:
      'Une méthode simple pour tester bénéfices, objections, preuves sociales et offres.',
    readTime: '7 min',
  },
  {
    category: 'E-commerce Afrique',
    title: 'Adapter ses créas au COD et WhatsApp',
    excerpt:
      'Comment orienter vos vidéos vers une action claire : message, appel ou commande.',
    readTime: '6 min',
  },
] as const;

export const FOOTER_LINKS = {
  product: [
    { label: 'Features', href: '#features' },
    { label: 'Workflow', href: '#workflow' },
    { label: 'Integrations', href: '#integrations' },
    { label: 'Pricing', href: '#pricing' },
  ],
  useCases: [
    { label: 'TikTok Ads', href: '#' },
    { label: 'Meta Ads', href: '#' },
    { label: 'UGC Videos', href: '#' },
    { label: 'COD Afrique', href: '#' },
  ],
  resources: [
    { label: 'Blog', href: '#blog' },
    { label: 'FAQ', href: '#faq' },
    { label: 'Guides', href: '#' },
    { label: 'Changelog', href: '#' },
  ],
  company: [
    { label: 'Contact Sales', href: '#' },
    { label: 'Licence', href: '#' },
    { label: 'Privacy', href: '#' },
    { label: 'Terms', href: '#' },
  ],
} as const;
