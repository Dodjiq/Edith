export type Locale = 'fr' | 'en';

export const LOCALES: Locale[] = ['fr', 'en'];
export const DEFAULT_LOCALE: Locale = 'fr';

type Dict = Record<Locale, string>;

export const translations = {
  // Navbar
  'nav.about': { fr: 'À propos', en: 'About' },
  'nav.integrations': { fr: 'Intégrations', en: 'Integrations' },
  'nav.pricing': { fr: 'Tarifs', en: 'Pricing' },
  'nav.blog': { fr: 'Blog', en: 'Blog' },
  'nav.signIn': { fr: 'Se connecter', en: 'Sign in' },
  'nav.menu': { fr: 'Menu', en: 'Menu' },

  // Hero
  'hero.badge': { fr: 'Edith Product Overview', en: 'Edith Product Overview' },
  'hero.title': {
    fr: 'Produisez des créas publicitaires de qualité en quelques minutes',
    en: 'Produce high-quality ad creatives in just minutes',
  },
  'hero.subtitle': {
    fr: 'Importez vos rushs, décrivez le résultat voulu. Edith génère plusieurs variantes prêtes à publier sur TikTok, Reels et Meta Ads.',
    en: 'Upload your raw footage, describe the result you want. Edith generates multiple variants ready to publish on TikTok, Reels and Meta Ads.',
  },
  'hero.cta': { fr: 'Commencer gratuitement', en: 'Get started for free' },

  // Logo cloud
  'logoCloud.title': {
    fr: 'Les meilleures équipes e-commerce font confiance à Edith.',
    en: 'The best e-commerce teams trust Edith.',
  },
  'logoCloud.tagline': {
    fr: 'Utilisé par des e-commerçants partout dans le monde.',
    en: 'Used by e-commerce teams around the world.',
  },

  // Features (bento)
  'features.title': {
    fr: 'Découvrez une solution simple de montage vidéo IA.',
    en: 'Discover a simple AI video editing solution.',
  },
  'features.subtitle': {
    fr: 'Edith automatise les étapes répétitives du montage publicitaire pour que vous puissiez vous concentrer sur ce qui compte vraiment : tester vos angles et scaler ce qui convertit.',
    en: 'Edith automates the repetitive steps of ad editing so you can focus on what really matters: testing angles and scaling what converts.',
  },
  'features.card1.title': {
    fr: 'Exprimez vos idées comme un humain, pas comme une machine.',
    en: 'Express ideas like a human, not a machine.',
  },
  'features.card1.desc': {
    fr: 'Décrivez votre vision en langage naturel. Edith comprend les nuances de votre brief et structure le montage selon votre intention créative.',
    en: 'Describe your vision in natural language. Edith understands the nuances of your brief and structures the edit based on your creative intent.',
  },
  'features.card2.title': {
    fr: 'Construisez votre montage bloc par bloc.',
    en: 'Build your edit block by block.',
  },
  'features.card2.desc': {
    fr: 'Edith décompose votre vidéo en scènes intelligibles que vous pouvez réorganiser, remplacer ou modifier en un clic.',
    en: 'Edith breaks your video into clear scenes you can rearrange, replace or modify in one click.',
  },
  'features.card3.title': {
    fr: 'Pilotez tout depuis un dashboard unifié.',
    en: 'Drive everything from a unified dashboard.',
  },
  'features.card3.desc': {
    fr: 'Suivez vos exports, importez vos sources, surveillez vos performances. Tout votre workflow vidéo dans une interface claire.',
    en: 'Track your exports, import your sources, monitor your performance. Your entire video workflow in one clean interface.',
  },

  // Feature grid (6 cards)
  'grid.multiformat.title': { fr: 'Multi-formats automatique', en: 'Automatic multi-formats' },
  'grid.multiformat.desc': {
    fr: 'Générez en un export TikTok 9:16, Reels 9:16, Meta 1:1 et YouTube 16:9.',
    en: 'Export in one go: TikTok 9:16, Reels 9:16, Meta 1:1 and YouTube 16:9.',
  },
  'grid.multiformat.detail': {
    fr: 'Adapté à chaque plateforme publicitaire.',
    en: 'Tailored to every ad platform.',
  },
  'grid.hooks.title': { fr: 'Hooks publicitaires IA', en: 'AI ad hooks' },
  'grid.hooks.desc': {
    fr: 'Edith identifie le bon plan, le bon mot, le bon rythme dans les 3 premières secondes.',
    en: 'Edith identifies the right shot, the right word, the right rhythm in the first 3 seconds.',
  },
  'grid.hooks.detail': {
    fr: 'Hook rate optimisé dès la première itération.',
    en: 'Hook rate optimized from the first iteration.',
  },
  'grid.library.title': { fr: 'Bibliothèque créative', en: 'Creative library' },
  'grid.library.desc': {
    fr: 'Templates UGC, storytelling, comparatif, avant/après, démonstration produit.',
    en: 'Templates for UGC, storytelling, comparison, before/after, product demo.',
  },
  'grid.library.detail': {
    fr: "Choisissez l'angle, Edith fait le reste.",
    en: 'Choose the angle, Edith does the rest.',
  },
  'grid.broadcast.title': { fr: 'Qualité broadcast', en: 'Broadcast quality' },
  'grid.broadcast.desc': {
    fr: 'Rendu 4K, audio mixé, sous-titres lisibles, couleurs étalonnées automatiquement.',
    en: '4K rendering, mixed audio, readable captions, automatically graded colors.',
  },
  'grid.broadcast.detail': {
    fr: 'Prêt à publier sans retouche manuelle.',
    en: 'Ready to publish with no manual touch-up.',
  },
  'grid.captions.title': { fr: 'Sous-titres animés', en: 'Animated captions' },
  'grid.captions.desc': {
    fr: 'Captions dynamiques avec emphases, mots-clés, et animations adaptées à votre brand.',
    en: 'Dynamic captions with emphasis, keywords, and brand-tailored animations.',
  },
  'grid.captions.detail': {
    fr: 'Lisibles sans son, optimisés pour le scroll.',
    en: 'Readable without sound, optimized for scrolling.',
  },
  'grid.express.title': { fr: 'Génération express', en: 'Express generation' },
  'grid.express.desc': {
    fr: 'De vos rushs à la créa finale en moins de 2 minutes, sans intervention humaine.',
    en: 'From raw footage to final creative in under 2 minutes, no human intervention.',
  },
  'grid.express.detail': {
    fr: "Testez 10 angles dans le temps d'un café.",
    en: 'Test 10 angles in the time it takes to drink a coffee.',
  },

  // Testimonials
  'testimonials.badge': { fr: 'Edith Product Overview', en: 'Edith Product Overview' },
  'testimonials.title': {
    fr: "Écoutez l'avis de nos utilisateurs",
    en: 'Hear what our users have to say',
  },
  'testimonials.subtitle': {
    fr: 'Des e-commerçants, media buyers et créateurs UGC partagent leurs résultats avec Edith.',
    en: 'E-commerce founders, media buyers and UGC creators share their results with Edith.',
  },
  'testimonials.stat1.label': {
    fr: "plus rapide qu'un montage manuel sur CapCut ou Premiere.",
    en: 'faster than manual editing on CapCut or Premiere.',
  },
  'testimonials.stat2.label': {
    fr: 'du workflow géré sans logiciel de montage classique.',
    en: 'of the workflow handled without traditional editing software.',
  },
  'testimonials.stat3.label': {
    fr: 'créas générées par les utilisateurs en bêta sur la plateforme.',
    en: 'creatives generated by beta users on the platform.',
  },
  'testimonials.q1': {
    fr: "Edith m'a permis de tester 20 angles publicitaires en une heure. Game changer absolu.",
    en: 'Edith let me test 20 ad angles in one hour. Absolute game changer.',
  },
  'testimonials.q2': {
    fr: "Sortir une créa TikTok en 2 minutes, je n'y croyais pas avant Edith.",
    en: "Shipping a TikTok creative in 2 minutes — I didn't believe it before Edith.",
  },
  'testimonials.q3': {
    fr: 'Le multi-format en un export, ça change tout pour scaler.',
    en: 'Multi-format in a single export changes everything for scaling.',
  },
  'testimonials.q4': {
    fr: 'Mes performances Meta Ads ont doublé en 30 jours.',
    en: 'My Meta Ads performance doubled in 30 days.',
  },
  'testimonials.q5': {
    fr: 'Plus besoin de monteur freelance pour les variantes A/B.',
    en: 'No more need for a freelance editor for A/B variants.',
  },
  'testimonials.q6': {
    fr: 'Les sous-titres animés sont meilleurs que ce que je faisais manuellement.',
    en: 'The animated captions are better than what I made manually.',
  },
  'testimonials.q7': {
    fr: "L'IA comprend vraiment le brief. Du premier coup.",
    en: 'The AI really understands the brief. First try.',
  },
  'testimonials.q8': {
    fr: 'Format 9:16, 1:1, 16:9 en simultané. Mes équipes social et paid travaillent enfin sur les mêmes assets.',
    en: '9:16, 1:1, 16:9 formats at the same time. My social and paid teams finally work on the same assets.',
  },
  'testimonials.q9': {
    fr: "Le rendu broadcast quality m'évite l'étape étalonnage. Direct prêt à publier.",
    en: 'Broadcast-quality rendering saves me the color-grading step. Ready to publish, instantly.',
  },

  // FAQ
  'faq.badge': { fr: 'Edith Product Overview', en: 'Edith Product Overview' },
  'faq.title': { fr: 'Questions fréquentes', en: 'Frequently asked questions' },
  'faq.subtitle': {
    fr: "Pour toute autre question, n'hésitez pas à",
    en: 'For any other questions, feel welcome to',
  },
  'faq.reachOut': { fr: 'contacter notre équipe.', en: 'reach out to our team.' },
  'faq.q1': {
    fr: 'Je dois avoir des compétences en montage ?',
    en: 'Do I need video editing skills?',
  },
  'faq.a1': {
    fr: "Non. Vous importez vos vidéos, vous décrivez le résultat voulu, et Edith génère la créa en moins de 2 minutes. Aucun logiciel de montage nécessaire.",
    en: 'No. You upload your videos, describe the result you want, and Edith generates the creative in less than 2 minutes. No editing software needed.',
  },
  'faq.q2': {
    fr: 'Est-ce que je peux générer plusieurs variantes ?',
    en: 'Can I generate multiple variants?',
  },
  'faq.a2': {
    fr: "Oui. C'est l'objectif principal : créer plusieurs versions avec différents hooks, rythmes et angles pour identifier rapidement ce qui convertit.",
    en: "Yes. That's the main goal: create multiple versions with different hooks, paces and angles to quickly identify what converts.",
  },
  'faq.q3': { fr: 'Quels formats sont disponibles ?', en: 'Which formats are available?' },
  'faq.a3': {
    fr: '9:16 pour TikTok, Reels et Shorts. 1:1 pour Meta Ads. 16:9 pour YouTube. Tous générés en une seule session.',
    en: '9:16 for TikTok, Reels and Shorts. 1:1 for Meta Ads. 16:9 for YouTube. All generated in a single session.',
  },
  'faq.q4': {
    fr: 'Est-ce adapté au marché africain et COD ?',
    en: 'Is it suitable for the African market and COD?',
  },
  'faq.a4': {
    fr: "Oui. Edith est pensé pour les workflows COD, WhatsApp, UGC local et publicités rapides pour Togo, Côte d'Ivoire, Sénégal et autres marchés.",
    en: "Yes. Edith is designed for COD, WhatsApp, local UGC workflows and fast ads for Togo, Ivory Coast, Senegal and other markets.",
  },

  // Blog
  'blog.badge': { fr: 'Edith Product Overview', en: 'Edith Product Overview' },
  'blog.title': { fr: 'Blog & Articles', en: 'Blog & Articles' },
  'blog.subtitle': {
    fr: "Stratégies créatives, retours d'expérience et tactiques de growth pour produire des publicités vidéo qui convertissent en 2026.",
    en: 'Creative strategies, case studies and growth tactics to produce video ads that convert in 2026.',
  },
  'blog.article1.category': { fr: 'Creative Strategy', en: 'Creative Strategy' },
  'blog.article1.title': {
    fr: "Comment structurer un hook qui retient l'attention",
    en: 'How to structure a hook that grabs attention',
  },
  'blog.article1.excerpt': {
    fr: 'Les premières secondes décident souvent si votre vidéo sera regardée ou ignorée. Voici la méthode des 4 ancrages narratifs.',
    en: 'The first seconds often decide whether your video will be watched or ignored. Here is the 4-narrative-anchor method.',
  },
  'blog.article2.category': { fr: 'Edith Product', en: 'Edith Product' },
  'blog.article2.title': {
    fr: 'Construire ses pages de vente avec Edith',
    en: 'Build your sales pages with Edith',
  },
  'blog.article2.excerpt': {
    fr: "Utilisez l'IA d'Edith pour générer rapidement des vidéos d'accompagnement pour vos pages de vente Shopify.",
    en: "Use Edith's AI to quickly generate companion videos for your Shopify sales pages.",
  },
  'blog.article3.category': { fr: 'Growth E-commerce', en: 'Growth E-commerce' },
  'blog.article3.title': {
    fr: 'Adapter ses créas au COD et WhatsApp',
    en: 'Tailor your creatives for COD and WhatsApp',
  },
  'blog.article3.excerpt': {
    fr: 'Comment orienter vos vidéos vers une action claire : message, appel ou commande. Le playbook complet.',
    en: 'How to guide your videos toward a clear action: message, call or order. The complete playbook.',
  },

  // Final CTA
  'finalCta.title': {
    fr: 'Lancez votre essai gratuit de 7 jours',
    en: 'Start your free 7-day trial',
  },
  'finalCta.free': { fr: 'Essai 7 jours gratuit', en: '7-day free trial' },
  'finalCta.noCard': { fr: 'Sans carte bancaire', en: 'No credit card required' },
  'finalCta.cta': { fr: 'Commencer', en: 'Get started' },
  'finalCta.rating': {
    fr: 'Sur 300+ retours utilisateurs',
    en: 'From 300+ user reviews',
  },

  // Footer
  'footer.description': {
    fr: "Montage vidéo IA pour e-commerçants qui veulent produire du volume de créas publicitaires sans passer la journée sur un logiciel.",
    en: 'AI video editing for e-commerce founders who want to produce ad volume without spending the day in editing software.',
  },
  'footer.product': { fr: 'Produit', en: 'Product' },
  'footer.features': { fr: 'Fonctionnalités', en: 'Features' },
  'footer.legal': { fr: 'Légal', en: 'Legal' },
  'footer.social': { fr: 'Social', en: 'Social' },
  'footer.copyright': { fr: '© 2026 Edith. Tous droits réservés.', en: '© 2026 Edith. All rights reserved.' },
  'footer.madeWith': { fr: 'Fait avec', en: 'Made with' },
  'footer.forEcommerce': { fr: 'pour les e-commerçants', en: 'for e-commerce founders' },
  'footer.changelog': { fr: 'Changelog', en: 'Changelog' },
  'footer.licence': { fr: 'Licence', en: 'License' },
  'footer.link.features': { fr: 'Fonctionnalités', en: 'Features' },
  'footer.link.pricing': { fr: 'Tarifs', en: 'Pricing' },
  'footer.link.tools': { fr: 'Outils', en: 'Tools' },
  'footer.link.blog': { fr: 'Blog', en: 'Blog' },
  'footer.link.privacy': { fr: 'Confidentialité', en: 'Privacy' },
  'footer.link.terms': { fr: 'Conditions', en: 'Terms' },
  'footer.link.refund': { fr: 'Remboursement', en: 'Refund' },
  'footer.link.legal': { fr: 'Mentions légales', en: 'Legal notice' },
  'footer.link.twitter': { fr: 'Twitter / X', en: 'Twitter / X' },
  'footer.link.tiktok': { fr: 'TikTok', en: 'TikTok' },
  'footer.link.contact': { fr: 'Contact', en: 'Contact' },

  // Pricing
  'pricing.title': {
    fr: 'Tarification flexible adaptée à tes besoins',
    en: 'Flexible pricing tailored to your needs',
  },
  'pricing.monthly': { fr: 'Mensuel', en: 'Monthly' },
  'pricing.annual': { fr: 'Annuel', en: 'Yearly' },
  'pricing.perMonth': { fr: '/ mois', en: '/ month' },
  'pricing.popular': { fr: 'Populaire', en: 'Popular' },
  'pricing.footnote': {
    fr: 'Sans carte bancaire pour commencer · Annulez à tout moment',
    en: 'No credit card required · Cancel anytime',
  },
  // Basic plan
  'pricing.basic.name': { fr: 'Basic', en: 'Basic' },
  'pricing.basic.desc': { fr: 'Pour découvrir gratuitement', en: 'To discover for free' },
  'pricing.basic.cta': { fr: 'Choisir Basic', en: 'Choose Basic' },
  'pricing.basic.f1': { fr: '2 créas vidéo / mois', en: '2 video creatives / month' },
  'pricing.basic.f2': { fr: 'Sous-titres automatiques', en: 'Automatic captions' },
  'pricing.basic.f3': { fr: 'Format TikTok 9:16 & Reels', en: 'TikTok 9:16 & Reels formats' },
  'pricing.basic.f4': { fr: 'Templates UGC de base', en: 'Basic UGC templates' },
  'pricing.basic.f5': { fr: 'Hook IA basique', en: 'Basic AI hook' },
  'pricing.basic.f6': { fr: 'Watermark Edith', en: 'Edith watermark' },
  'pricing.basic.f7': { fr: 'Historique 7 jours', en: '7-day history' },
  'pricing.basic.f8': { fr: 'Support communautaire', en: 'Community support' },
  // Pro plan
  'pricing.pro.name': { fr: 'Pro', en: 'Pro' },
  'pricing.pro.desc': { fr: 'Pour les créateurs actifs', en: 'For active creators' },
  'pricing.pro.cta': { fr: 'Choisir Pro', en: 'Choose Pro' },
  'pricing.pro.f1': { fr: '30 créas vidéo / mois', en: '30 video creatives / month' },
  'pricing.pro.f2': { fr: 'Tout Basic inclus', en: 'Everything in Basic' },
  'pricing.pro.f3': {
    fr: 'Multi-formats simultanés (9:16, 1:1, 16:9)',
    en: 'Simultaneous multi-formats (9:16, 1:1, 16:9)',
  },
  'pricing.pro.f4': { fr: 'Hooks IA avancés', en: 'Advanced AI hooks' },
  'pricing.pro.f5': { fr: 'Variantes A/B en batch', en: 'A/B variants in batch' },
  'pricing.pro.f6': { fr: 'Bibliothèque créative complète', en: 'Full creative library' },
  'pricing.pro.f7': { fr: 'Sous-titres animés premium', en: 'Premium animated captions' },
  'pricing.pro.f8': { fr: 'Sans watermark', en: 'No watermark' },
  'pricing.pro.f9': { fr: 'Support prioritaire', en: 'Priority support' },
  // Premium plan
  'pricing.premium.name': { fr: 'Premium', en: 'Premium' },
  'pricing.premium.desc': { fr: 'Pour scaler sans limites', en: 'To scale without limits' },
  'pricing.premium.cta': { fr: 'Choisir Premium', en: 'Choose Premium' },
  'pricing.premium.f1': { fr: '100 créas vidéo / mois', en: '100 video creatives / month' },
  'pricing.premium.f2': { fr: 'Tout Pro inclus', en: 'Everything in Pro' },
  'pricing.premium.f3': { fr: 'Qualité broadcast 4K', en: 'Broadcast 4K quality' },
  'pricing.premium.f4': { fr: 'Génération express (< 2 min)', en: 'Express generation (< 2 min)' },
  'pricing.premium.f5': {
    fr: 'Voice cloning + voix de marque',
    en: 'Voice cloning + brand voice',
  },
  'pricing.premium.f6': { fr: 'Workspaces équipes', en: 'Team workspaces' },
  'pricing.premium.f7': { fr: 'API publique (bêta)', en: 'Public API (beta)' },
  'pricing.premium.f8': { fr: 'White-label (bientôt)', en: 'White-label (soon)' },
  'pricing.premium.f9': {
    fr: 'Templates premium exclusifs',
    en: 'Exclusive premium templates',
  },
  'pricing.premium.f10': {
    fr: 'Support dédié & onboarding',
    en: 'Dedicated support & onboarding',
  },
} as const satisfies Record<string, Dict>;

export type TranslationKey = keyof typeof translations;
