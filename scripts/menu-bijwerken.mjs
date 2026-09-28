// Zet het menu (de <header>) op alle pagina's gelijk. Het menu staat hieronder op één plek:
// pas MENU aan en draai daarna in de hoofdmap van de site:
//
//   node scripts/menu-bijwerken.mjs
//
// Het script vervangt in elk .html-bestand in de hoofdmap alles tussen <header ...> en </header>
// en markeert per pagina zelf welk menu-item actief is (rood, en het juiste uitklapmenu open op
// mobiel). Een nieuwe pagina hoeft alleen een <header></header> te hebben; die wordt dan gevuld.
// Hoort een pagina bij een ander menu-item (zoals stand.html bij VVGSD), zet dat in HOORT_BIJ.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MENU = [
  { tekst: 'Activiteiten', href: 'activiteiten.html' },
  { tekst: 'Open avonden', href: 'open-avonden.html' },
  {
    tekst: 'Over ons',
    id: 'over-ons',
    groepen: [
      {
        kop: 'Wie we zijn',
        items: [
          { tekst: 'Geschiedenis', href: 'geschiedenis.html' },
          { tekst: 'Verbanden', href: 'verbanden.html' },
          { tekst: 'Besturen', href: 'besturen.html' },
        ],
      },
      {
        kop: 'Onderdelen van de vereniging',
        items: [
          { tekst: 'Disputen', href: 'disputen.html' },
          { tekst: 'Kasten (verenigingshuizen)', href: 'kasten.html' },
          { tekst: 'VVGSD (het voetbalteam)', href: 'vvgsd.html' },
        ],
      },
    ],
  },
  { tekst: 'Fotoalbum', href: 'fotoalbum.html' },
  {
    tekst: 'Contact',
    id: 'contact',
    items: [
      { tekst: 'Contact', href: 'index.html#contact' },
      { tekst: 'Wonen in Delft', href: 'wonen-in-delft.html' },
      { tekst: 'Langskomen', href: 'langskomen.html' },
    ],
  },
  { tekst: 'Veelgestelde vragen', href: 'veelgestelde-vragen.html' },
];

// Klein menu rechtsboven. "#" = nog geen pagina.
const EXTRA = [
  { tekst: 'Zakelijk', href: 'zakelijk.html' },
  { tekst: 'Log in', href: '#' },
];

const HOORT_BIJ = {
  'stand.html': 'vvgsd.html',
  'wedstrijdschema.html': 'vvgsd.html',
};

// Links naar de homepage zelf (index.html#contact) worden op de homepage alleen "#contact".
function link(href, pagina) {
  return pagina === 'index.html' && href.startsWith('index.html#') ? href.slice('index.html'.length) : href;
}

function huidig(item, actief) {
  return item.href === actief ? ' aria-current="page"' : '';
}

function alleItems(blok) {
  return blok.items || (blok.groepen || []).flatMap((g) => g.items);
}

function bevatActief(blok, actief) {
  return alleItems(blok).some((i) => i.href === actief);
}

const PANEEL = 'dropdown-panel absolute left-0 top-full mt-3 rounded-2xl bg-warm-50 border border-ink-900/5 shadow-[0_20px_45px_-16px_rgba(58,14,24,0.25)]';

function desktop(pagina, actief) {
  const r = [];
  for (const blok of MENU) {
    if (blok.href) {
      const a = blok.href === actief;
      r.push(`        <a href="${link(blok.href, pagina)}"${huidig(blok, actief)} class="nav-link${a ? ' text-brand-600' : ''}">${blok.tekst}</a>`);
      continue;
    }
    const open = bevatActief(blok, actief);
    r.push('        <div class="relative">');
    r.push(`          <button type="button" data-dropdown-trigger="${blok.id}-panel" aria-expanded="false" aria-controls="${blok.id}-panel" class="nav-link flex items-center gap-1${open ? ' text-brand-600' : ''}">`);
    r.push(`            ${blok.tekst}`);
    r.push('            <i class="ph ph-caret-down text-xs caret"></i>');
    r.push('          </button>');
    if (blok.groepen) {
      r.push(`          <div id="${blok.id}-panel" class="${PANEEL.replace('rounded-2xl', 'w-[30rem] rounded-2xl')} p-6 grid grid-cols-2 gap-6">`);
      for (const g of blok.groepen) {
        r.push('            <div>');
        r.push(`              <p class="text-xs font-semibold uppercase tracking-wide text-ink-500">${g.kop}</p>`);
        r.push('              <ul class="mt-3 space-y-1">');
        for (const i of g.items) {
          const k = i.href === actief ? 'bg-brand-50 text-brand-600 font-semibold' : 'text-ink-700 hover:bg-brand-50 hover:text-brand-600';
          r.push(`                <li><a href="${link(i.href, pagina)}"${huidig(i, actief)} class="block px-2 py-1.5 rounded-lg ${k}">${i.tekst}</a></li>`);
        }
        r.push('              </ul>');
        r.push('            </div>');
      }
    } else {
      r.push(`          <div id="${blok.id}-panel" class="${PANEEL.replace('rounded-2xl', 'w-56 rounded-2xl')} p-3">`);
      for (const i of blok.items) {
        const k = i.href === actief ? 'bg-brand-50 text-brand-600 font-semibold' : 'text-ink-700 hover:bg-brand-50 hover:text-brand-600';
        r.push(`            <a href="${link(i.href, pagina)}"${huidig(i, actief)} class="block px-3 py-2 rounded-lg ${k}">${i.tekst}</a>`);
      }
    }
    r.push('          </div>');
    r.push('        </div>');
  }
  return r.join('\n');
}

function mobiel(pagina, actief) {
  return MENU.map((blok) => {
    if (blok.href) {
      const k = blok.href === actief ? 'bg-brand-50 text-brand-600 font-semibold' : 'hover:bg-brand-50';
      return `      <a href="${link(blok.href, pagina)}"${huidig(blok, actief)} class="px-2 py-2.5 rounded-lg ${k}">${blok.tekst}</a>`;
    }
    const open = bevatActief(blok, actief);
    const r = [
      `      <button type="button" data-accordion-trigger="${blok.id}-accordion" aria-expanded="${open}" aria-controls="${blok.id}-accordion" class="px-2 py-2.5 rounded-lg hover:bg-brand-50 flex items-center justify-between">`,
      `        ${blok.tekst}`,
      '        <i class="ph ph-caret-down text-sm caret"></i>',
      '      </button>',
      `      <div id="${blok.id}-accordion" class="accordion-panel${open ? ' open' : ''} pl-4">`,
    ];
    for (const g of blok.groepen || [{ items: blok.items }]) {
      if (g.kop) r.push(`        <p class="px-2 pt-2 text-xs font-semibold uppercase tracking-wide text-ink-500">${g.kop}</p>`);
      for (const i of g.items) {
        const k = i.href === actief ? 'bg-brand-50 text-brand-600 font-semibold' : 'hover:bg-brand-50';
        r.push(`        <a href="${link(i.href, pagina)}"${huidig(i, actief)} class="block px-2 py-2 rounded-lg ${k}">${i.tekst}</a>`);
      }
    }
    r.push('      </div>');
    return r.join('\n');
  }).join('\n\n');
}

function extra(pagina, actief, knop) {
  return EXTRA.map((i) => {
    const a = i.href === actief;
    const k = a ? 'font-semibold text-brand-600' : 'hover:text-brand-600';
    return `<a href="${link(i.href, pagina)}"${huidig(i, actief)} class="${knop ? 'btn ' : ''}${k}">${i.tekst}</a>`;
  });
}

function header(pagina) {
  const actief = HOORT_BIJ[pagina] || pagina;
  const thuis = pagina === 'index.html' ? '' : 'index.html';
  const [d1, d2] = extra(pagina, actief, true);
  const [m1, m2] = extra(pagina, actief, false);
  return `<header class="sticky top-0 z-50 bg-warm-50/90 backdrop-blur-sm border-b border-ink-900/5">
  <!-- Menu: niet hier aanpassen maar in scripts/menu-bijwerken.mjs (zet het op alle pagina's gelijk). -->
  <div class="max-w-container mx-auto px-5 sm:px-8">
    <div class="h-[72px] flex items-center justify-between gap-4">
      <a href="${thuis}#top" class="flex items-center gap-2.5 shrink-0">
        <img src="images/logo/vgsd-logo.svg" alt="VGSD logo" class="h-9 w-9 object-contain">
        <span class="font-display font-bold text-lg tracking-tight text-ink-900">VGSD</span>
      </a>

      <nav class="hidden xl:flex items-center gap-6 font-medium text-[15px] text-ink-700">
${desktop(pagina, actief)}
      </nav>

      <div class="hidden xl:flex items-center gap-4 shrink-0">
        <div class="flex items-center gap-3 text-[13px] text-ink-500">
          ${d1}
          <span class="text-ink-900/10">|</span>
          ${d2}
        </div>
        <a href="${thuis}#word-lid" class="btn btn-primary inline-flex items-center rounded-full bg-brand-600 text-warm-50 px-5 py-2.5 text-sm font-semibold shadow-sm">
          Lid worden
        </a>
      </div>

      <button id="menu-toggle" aria-expanded="false" aria-controls="mobile-nav" class="xl:hidden grid h-10 w-10 place-items-center rounded-full text-ink-900 hover:bg-brand-50 transition-colors" aria-label="Menu openen">
        <i class="ph ph-list text-2xl"></i>
      </button>
    </div>
  </div>

  <div id="mobile-nav" class="mobile-menu xl:hidden border-t border-ink-900/5 bg-warm-50">
    <nav class="max-w-container mx-auto px-5 sm:px-8 py-4 flex flex-col gap-1 font-medium text-ink-700">
${mobiel(pagina, actief)}

      <div class="mt-2 pt-3 border-t border-ink-900/5 flex items-center gap-4 px-2 text-[13px] text-ink-500">
        ${m1}
        ${m2}
      </div>

      <a href="${thuis}#word-lid" class="btn btn-primary mt-2 inline-flex items-center justify-center rounded-full bg-brand-600 text-warm-50 px-5 py-2.5 text-sm font-semibold">
        Lid worden
      </a>
    </nav>
  </div>
</header>`;
}

const map = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const paginas = fs.readdirSync(map).filter((f) => f.endsWith('.html'));
for (const pagina of paginas) {
  const bestand = path.join(map, pagina);
  const oud = fs.readFileSync(bestand, 'utf8');
  const crlf = oud.includes('\r\n');
  const tekst = oud.replace(/\r\n/g, '\n');
  if (!/<header[\s>][\s\S]*?<\/header>/.test(tekst)) {
    console.log(`overgeslagen (geen <header>): ${pagina}`);
    continue;
  }
  let nieuw = tekst.replace(/<header[\s>][\s\S]*?<\/header>/, header(pagina));
  if (crlf) nieuw = nieuw.replace(/\n/g, '\r\n');
  if (nieuw !== oud) {
    fs.writeFileSync(bestand, nieuw);
    console.log(`bijgewerkt: ${pagina}`);
  }
}
