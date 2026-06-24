export type Platform = 'Shopify' | 'Vinted' | 'TikTok Shop' | 'Etsy' | 'eBay' | 'Dropshipping' | 'Marque e-commerce' | 'Inconnue';
export type Ranking = 'chaud' | 'moyen' | 'faible';
export type ContactStatus = 'nouveau' | 'contacte' | 'reponse' | 'relance' | 'supprime';

export type Prospect = {
  id: string;
  nomBoutique: string;
  siteWeb?: string;
  instagram?: string;
  tiktok?: string;
  linkedin?: string;
  email?: string;
  telephone?: string;
  plateforme: Platform;
  typeProduits: string;
  ville: string;
  pays: string;
  score: number;
  classement: Ranking;
  statutContact: ContactStatus;
  volumeSignaux: string[];
  sourceUrl: string;
  notes?: string;
  lastContactAt?: string;
  nextFollowUpAt?: string;
  createdAt: string;
};

export type SearchCriteria = {
  platform: Platform | 'Toutes';
  productType: string;
  location: string;
  keywords: string;
};

const nowIso = () => new Date().toISOString();
const addDays = (days: number) => new Date(Date.now() + days * 86400000).toISOString();

export function scoreProspect(input: Partial<Prospect> & { volumeSignaux?: string[] }): { score: number; classement: Ranking } {
  let score = 2;
  const signals = input.volumeSignaux ?? [];
  score += Math.min(4, signals.length);
  if (input.email) score += 1;
  if (input.telephone) score += 1;
  if (input.siteWeb) score += 1;
  if (['Shopify', 'TikTok Shop', 'Etsy', 'eBay', 'Vinted'].includes(String(input.plateforme))) score += 1;
  if ((input.ville ?? '').toLowerCase().match(/montpellier|lavérune|laverune|le crès|le cres|nîmes|nimes|sète|sete|béziers|beziers|occitanie/)) score += 1;
  const finalScore = Math.max(1, Math.min(10, score));
  return { score: finalScore, classement: finalScore >= 8 ? 'chaud' : finalScore >= 5 ? 'moyen' : 'faible' };
}

export function generateMessage(prospect: Prospect, step: 0 | 2 | 5 | 10 = 0) {
  const firstLine = prospect.typeProduits ? `J’ai vu votre boutique ${prospect.nomBoutique} autour de ${prospect.typeProduits}.` : `J’ai vu votre boutique ${prospect.nomBoutique}.`;
  const local = prospect.ville ? ` depuis Montpellier / Lavérune / Le Crès vers vos clients` : ' depuis Montpellier / Lavérune / Le Crès';
  const base = `${firstLine}\n\nChez Colock-Gistik, nous aidons les vendeurs e-commerce à externaliser la réception marchandise, le stockage, la préparation colis, l’emballage et l’expédition multi-transporteurs${local}.\n\nSi vous expédiez régulièrement des colis, je peux vous proposer une solution simple pour gagner du temps sans recruter ni louer plus d’espace.\n\nEst-ce que je peux vous envoyer une estimation rapide adaptée à vos volumes ?\n\nBonne journée,\nL’équipe Colock-Gistik`;
  const relances: Record<number, string> = {
    2: `Bonjour,\n\nJe me permets une relance rapide concernant ${prospect.nomBoutique}. Si vos commandes augmentent, Colock-Gistik peut prendre en charge stockage, préparation et expédition depuis la métropole de Montpellier.\n\nSouhaitez-vous que je vous envoie une proposition courte ?`,
    5: `Bonjour,\n\nJe reviens vers vous une dernière fois cette semaine. Nous accompagnons des petites marques e-commerce qui veulent expédier plus vite sans gérer l’entrepôt au quotidien.\n\nSi ce n’est pas le bon moment, dites-le moi et je ne vous relancerai pas.`,
    10: `Bonjour,\n\nJe clôture ma prise de contact pour ${prospect.nomBoutique}. Si vous cherchez plus tard une solution de stockage, préparation colis et expédition multi-transporteurs à Montpellier, vous pouvez me répondre ici.\n\nBonne continuation !`,
  };
  return step === 0 ? base : relances[step];
}

export function buildSearchLinks(criteria: SearchCriteria) {
  const target = [criteria.platform !== 'Toutes' ? criteria.platform : 'e-commerce', criteria.productType, criteria.location, criteria.keywords].filter(Boolean).join(' ');
  return [
    { label: 'Google boutiques', url: `https://www.google.com/search?q=${encodeURIComponent(`${target} contact livraison colis`)}` },
    { label: 'Instagram', url: `https://www.google.com/search?q=${encodeURIComponent(`site:instagram.com ${target} boutique`)}` },
    { label: 'TikTok', url: `https://www.google.com/search?q=${encodeURIComponent(`site:tiktok.com ${target} shop`)}` },
    { label: 'Etsy', url: `https://www.etsy.com/search/shops?search_query=${encodeURIComponent(criteria.productType || criteria.keywords || 'france')}` },
    { label: 'eBay', url: `https://www.ebay.fr/sch/i.html?_nkw=${encodeURIComponent(criteria.productType || criteria.keywords || 'boutique française')}` },
    { label: 'Vinted', url: `https://www.google.com/search?q=${encodeURIComponent(`site:vinted.fr ${target} pro`)}` },
  ];
}

const templates = [
  ['Maison Luma', 'https://maison-luma.example', '@maisonluma', '', '', 'contact@maison-luma.example', '', 'Shopify', 'décoration maison', 'Montpellier', ['mentions expédition 24/48h', 'nouveautés chaque semaine', 'avis clients nombreux']],
  ['Atelier Seconde Vie', '', '@ateliersecondevie', '@ateliersecondevie', '', '', '', 'Vinted', 'mode seconde main', 'Nîmes', ['gros catalogue', 'profil pro', 'ventes fréquentes']],
  ['GlowCase FR', 'https://glowcase.example', '@glowcasefr', '@glowcasefr', '', 'hello@glowcase.example', '', 'TikTok Shop', 'accessoires téléphone', 'France', ['live shopping', 'promos quotidiennes', 'dropshipping probable']],
  ['Bijoux Solaires', 'https://bijoux-solaires.example', '@bijouxsolaires', '', '', 'contact@bijoux-solaires.example', '04 00 00 00 00', 'Etsy', 'bijoux fantaisie', 'Béziers', ['beaucoup d’avis', 'personnalisation', 'expédition suivie']],
  ['Sneak Market Sud', '', '@sneakmarketsud', '', '', '', '', 'eBay', 'sneakers et streetwear', 'Le Crès', ['stock important', 'réassorts', 'ventes multi-plateformes']],
] as const;

export function mockProspectSearch(criteria: SearchCriteria): Prospect[] {
  const wanted = criteria.platform;
  return templates
    .filter((row) => wanted === 'Toutes' || row[7] === wanted)
    .map((row, index) => {
      const draft = {
        id: crypto.randomUUID(), nomBoutique: row[0], siteWeb: row[1] || undefined, instagram: row[2] || undefined,
        tiktok: row[3] || undefined, linkedin: row[4] || undefined, email: row[5] || undefined, telephone: row[6] || undefined,
        plateforme: row[7] as Platform, typeProduits: criteria.productType || row[8], ville: criteria.location || row[9], pays: 'France',
        volumeSignaux: [...row[10]], sourceUrl: row[1] || `https://www.google.com/search?q=${encodeURIComponent(row[0])}`,
      };
      const scored = scoreProspect(draft);
      return { ...draft, ...scored, statutContact: 'nouveau' as ContactStatus, notes: 'Donnée publique à vérifier avant contact.', createdAt: nowIso(), nextFollowUpAt: addDays(index + 2) };
    });
}

export const followUpDays = [2, 5, 10];
