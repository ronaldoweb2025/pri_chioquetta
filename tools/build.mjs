import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import config from '../config.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'dist');
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const localAsset = value => {
  if (!/^assets\/[a-z0-9/_.-]+$/i.test(value) || value.includes('..')) throw new Error(`Caminho de asset inválido: ${value}`);
  return value;
};
function safeLink(value) {
  if (/^#[a-z][a-z0-9-]*$/i.test(value)) return value;
  const parsed = new URL(value);
  if (parsed.protocol !== 'https:') throw new Error('Use âncoras ou links HTTPS.');
  return parsed.href;
}
function picture(image, sizes, priority = false) {
  if (!/^[a-z0-9-]+$/i.test(image.name)) throw new Error('Nome de imagem deve ser um basename descritivo.');
  if (!image.widths?.length || image.widths.some(w => !Number.isSafeInteger(w) || w < 1)) throw new Error('Larguras inválidas.');
  const fallback = image.widths.includes(1280) ? 1280 : image.widths.at(-1);
  const set = ext => image.widths.map(w => `assets/images/${image.name}-${w}.${ext} ${w}w`).join(', ');
  const position = image.position || '50% 50%';
  if (!/^\d{1,3}% \d{1,3}%$/.test(position)) throw new Error('Posição de imagem inválida.');
  return `<picture><source type="image/webp" srcset="${set('webp')}" sizes="${escape(sizes)}"><img src="assets/images/${image.name}-${fallback}.jpg" srcset="${set('jpg')}" sizes="${escape(sizes)}" width="${image.width}" height="${image.height}" alt="${escape(image.alt)}" style="--image-position:${position}" ${priority ? 'fetchpriority="high" loading="eager"' : 'loading="lazy"'} decoding="async"></picture>`;
}
const c = config;
if (c.form.mode !== 'preview') throw new Error('Integração não aprovada: esta versão suporta somente o modo preview.');
if (!c.gallery.items.length) throw new Error('Inclua ao menos uma imagem aprovada na galeria.');
const canonical = new URL('/', c.seo.siteUrl).href;
const cta = light => `<a class="button button-${light ? 'light' : 'dark'}" href="${escape(safeLink(c.cta.href))}">${escape(c.cta.label)}</a>`;
const options = items => items.map(item => `<option value="${escape(item)}">${escape(item)}</option>`).join('');
const replacements = {
  pageTitle: escape(c.seo.title), description: escape(c.seo.description), robots: c.seo.allowIndexing ? 'index, follow' : 'noindex, nofollow',
  canonical: escape(canonical), ogImage: escape(new URL(localAsset(c.seo.ogImage), canonical).href), heroAlt: escape(c.hero.image.alt),
  brandName: escape(c.brand.name), brandSubtitle: escape(c.brand.subtitle), brandTagline: escape(c.brand.tagline),
  location: escape(c.hero.location), heroTitle: c.hero.desktopTitleLines?.join(' ') === c.hero.title ? c.hero.desktopTitleLines.map(line => `<span class="hero-title-line">${escape(line)}</span>`).join(' ') : escape(c.hero.title), heroDescription: escape(c.hero.description), heroNote: escape(c.hero.note),
  heroImage: picture(c.hero.image, '(max-width: 767px) 100vw, (max-width: 1100px) 1200px, 100vw', true), heroCta: cta(true),
  values: c.motivations.map(item => `<p>${escape(item.eyebrow)}</p>`).join(''),
  brokerEyebrow: escape(c.broker.eyebrow), brokerTitle: escape(c.broker.title), brokerText: escape(c.broker.text),
  brokerName: escape(c.broker.name), brokerRole: escape(c.broker.role), brokerCreci: escape(c.broker.creci),
  whatsappLink: c.broker.whatsapp && /^\+?[1-9]\d{7,14}$/.test(c.broker.whatsapp) ? `<a href="https://wa.me/${escape(c.broker.whatsapp.replace('+',''))}" target="_blank" rel="noopener noreferrer">WhatsApp da Pri (abre em nova aba)</a>` : '',
  brokerImage: picture(c.broker.image, '(max-width: 767px) 140px, (max-width: 1100px) 235px, 275px'),
  propertyEyebrow: escape(c.property.eyebrow), propertyName: escape(c.property.name), propertyDescription: escape(c.property.description),
  propertyHighlights: c.property.highlights.map(escape).join(' <span aria-hidden="true"> / </span> '),
  propertyImage: picture(c.property.image, '(max-width: 767px) 300px, (max-width: 1100px) 300px, 390px'),
  propertyCaption: escape(c.property.imageCaption), propertyCta: cta(false),
  videoLink: c.property.videoUrl ? `<a class="video-link" href="${escape(safeLink(c.property.videoUrl))}" target="_blank" rel="noopener noreferrer">Ver vídeo do empreendimento <span class="sr-only">(abre em nova aba)</span></a>` : '',
  galleryTitle: escape(c.gallery.title), galleryDisclaimer: escape(c.gallery.disclaimer),
  galleryItems: c.gallery.items.map((item, i) => `<li class="gallery-card" aria-label="${i + 1} de ${c.gallery.items.length}"><figure>${picture(item.image, '(max-width: 767px) calc(100vw - 48px), (max-width: 1100px) calc((100vw - 104px) / 2), (max-width: 1420px) calc((100vw - 184px) / 2), 618px')}<figcaption>${item.title ? `<h3>${escape(item.title)}</h3>` : ''}<p>${escape(item.caption)}</p></figcaption></figure></li>`).join('\n'),
  regionTitle: escape(c.regionTitle),
  motivations: c.motivations.map(item => `<div><h3>${escape(item.title)}</h3><p>${escape(item.text)}</p></div>`).join(''),
  formTitle: escape(c.form.title), formText: escape(c.form.text), formEndpoint: escape(c.form.endpoint), previewNote: escape(c.form.previewNote), previewResult: escape(c.form.previewResult),
  contactImage: picture(c.form.image || c.hero.image, '(max-width: 767px) 100vw, 1px'),
  countries: options(c.form.countries), objectives: options(c.form.objectives), investments: options(c.form.investmentRanges), interests: options(c.form.interests),
  consent: escape(c.form.consent), consentVersion: escape(c.form.consentVersion), ctaLabel: escape(c.cta.label)
};
const template = await fs.readFile(path.join(root, 'templates/index.html'), 'utf8');
const html = template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
  if (!(key in replacements)) throw new Error(`Token desconhecido: ${key}`);
  return replacements[key];
});
if (/\{\{/.test(html)) throw new Error('Token não resolvido no HTML.');
await fs.mkdir(out, {recursive: true});
for (const dir of ['assets', 'styles', 'scripts']) await fs.cp(path.join(root, dir), path.join(out, dir), {recursive: true});
await fs.writeFile(path.join(out, 'index.html'), html);
await fs.copyFile(path.join(root, '_headers'), path.join(out, '_headers'));
await fs.writeFile(path.join(out, 'robots.txt'), c.seo.allowIndexing ? `User-agent: *\nAllow: /\nSitemap: ${new URL('sitemap.xml', canonical)}\n` : 'User-agent: *\nDisallow: /\n');
await fs.writeFile(path.join(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${escape(canonical)}</loc></url></urlset>\n`);
await fs.writeFile(path.join(out, '_routes.json'), JSON.stringify({version: 1, include: ['/api/*'], exclude: []}, null, 2));
// Verificar todos os arquivos que o HTML referencia, inclusive as variantes responsivas.
const refs = [...html.matchAll(/assets\/[a-z0-9/_.-]+\.(?:jpg|webp|svg)/gi)].map(m => m[0]);
for (const ref of new Set(refs)) await fs.access(path.join(out, ref));
console.log(`Build concluído: dist/index.html; ${c.gallery.items.length} imagens na galeria; formulário em prévia.`);
