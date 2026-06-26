import type { Prospect } from './prospecting';

export function exportProspectsCsv(prospects: Prospect[]) {
  const headers = ['nom_boutique','site_web','instagram','facebook','tiktok','linkedin','whatsapp','email','telephone','plateforme','type_produits','ville','pays','score','classement','statut_contact','signaux','source','import_source','source_reelle','shopify_verified','nombre_produits','mono_produit','niche','formulaire_contact','page_expedition','politique_retour','domaine_professionnel'];
  const rows = prospects.map((p) => [p.nomBoutique,p.siteWeb,p.instagram,p.facebook,p.tiktok,p.linkedin,p.whatsapp,p.email,p.telephone,p.plateforme,p.typeProduits,p.ville,p.pays,p.score,p.classement,p.statutContact,p.volumeSignaux.join(' | '),p.sourceUrl,p.source,p.sourceReelle,p.shopifyVerified,p.productCount,p.isMonoProduct,p.niche,p.hasContactForm,p.hasShippingPage,p.hasReturnPolicy,p.professionalDomain]);
  const escape = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  const csv = [headers, ...rows].map((row) => row.map(escape).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `colock-prospects-${new Date().toISOString().slice(0,10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
