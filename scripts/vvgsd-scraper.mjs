// Haalt automatisch de stand en het wedstrijdschema van het VGSD-voetbalteam (VVGSD) op van
// Playpass en schrijft ze naar data/vvgsd-stand-auto.json en data/vvgsd-schema-auto.json.
//
// Draait periodiek via .github/workflows/vvgsd-scraper.yml (GitHub Action). Kan ook lokaal
// getest worden met: node scripts/vvgsd-scraper.mjs
//
// De koppeling van "onze veldnaam" (bv. "punten") naar "de koptekst op Playpass" (bv. "Points")
// staat niet hier in de code, maar in data/vvgsd-instellingen.json (standKolommen), bewerkbaar
// via de beheerpagina (collectie "VVGSD"). Verandert Playpass een koptekst, dan pas je alleen
// dat veldje aan — geen code-wijziging nodig. Dit script raakt de bestaande gegevens niet aan
// als het te weinig/rare data binnenkrijgt (bv. de pagina is onbereikbaar of van opzet
// veranderd), zodat een storing bij Playpass nooit goede gegevens overschrijft met niets.
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const DATA_MAP = path.join(HIER, '..', 'data');
const INSTELLINGEN_PAD = path.join(DATA_MAP, 'vvgsd-instellingen.json');
const STAND_PAD = path.join(DATA_MAP, 'vvgsd-stand-auto.json');
const SCHEMA_PAD = path.join(DATA_MAP, 'vvgsd-schema-auto.json');

const VERZOEK_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; VGSD-website-scraper/1.0; +https://preview.vgsd.nl)',
};

async function haalOp(url, extraHeaders) {
  const antwoord = await fetch(url, { headers: { ...VERZOEK_HEADERS, ...extraHeaders } });
  if (!antwoord.ok) throw new Error(`${url} gaf status ${antwoord.status}`);
  return antwoord.text();
}

function leesJson(bestand, standaard) {
  return readFile(bestand, 'utf-8').then(JSON.parse).catch(() => standaard);
}

// --- Stand -----------------------------------------------------------------------------------

function parseStandings(html, standKolommen) {
  const theadMatch = html.match(/<thead>([\s\S]*?)<\/thead>/);
  if (!theadMatch) throw new Error('Geen tabelkop (thead) gevonden in de standen-pagina.');

  // Elke kolomkop: het zichtbare "title"-attribuut (bv. "Points") op dezelfde positie als de
  // bijbehorende waarde verderop in elke rij.
  const kopTitels = [];
  const thRegex = /<th[^>]*>([\s\S]*?)<\/th>/g;
  let th;
  while ((th = thRegex.exec(theadMatch[1]))) {
    const titleAttr = /title="([^"]*)"/.exec(th[0]);
    kopTitels.push(titleAttr ? titleAttr[1].trim() : null);
  }

  // Voor elk ingesteld veld (bv. "punten" -> "Points"): op welke kolomindex staat die titel?
  const kolomIndex = {};
  for (const [veld, titel] of Object.entries(standKolommen || {})) {
    const idx = kopTitels.findIndex((t) => t && t.toLowerCase() === String(titel).toLowerCase());
    if (idx === -1) {
      throw new Error(
        `Kolom "${titel}" (voor het veld "${veld}") niet gevonden op de standenpagina. ` +
        `Beschikbare kolomtitels: ${kopTitels.filter(Boolean).join(', ')}`
      );
    }
    kolomIndex[veld] = idx;
  }

  const teams = [];
  const rijRegex = /<tr[^>]*>\s*<td class="pl-0 tabular-nums">(\d+)<\/td>([\s\S]*?)<\/tr>/g;
  let rij;
  while ((rij = rijRegex.exec(html))) {
    const positie = Number(rij[1]);
    const rest = rij[2];
    const naamMatch = /standings-team-name[^>]*>[\s\S]*?<span[^>]*>([^<]+)<\/span>/.exec(rest);
    if (!naamMatch) continue;
    const naam = naamMatch[1].trim();

    // Alle overige <td>-waarden van deze rij, in volgorde (index 0 = de kolom na de teamnaam
    // in de kop-array, dus we tellen de kop-array vanaf kolomindex 2 t/m het einde).
    const tdWaarden = [];
    const tdRegex = /<td[^>]*>\s*([\s\S]*?)\s*<\/td>/g;
    let td;
    while ((td = tdRegex.exec(rest))) tdWaarden.push(td[1].replace(/<[^>]+>/g, '').trim());

    const team = { positie, naam };
    for (const [veld, idx] of Object.entries(kolomIndex)) {
      // idx telt vanaf de eerste kolomkop (Positie, kolomkop-index 0); tdWaarden begint pas ná
      // de losse positie-kolom (die de rijRegex al apart heeft afgesplitst), dus trek er 1 vanaf.
      const waarde = tdWaarden[idx - 1];
      const getal = Number(waarde);
      team[veld] = Number.isFinite(getal) ? getal : waarde ?? null;
    }
    teams.push(team);
  }

  if (teams.length < 2) throw new Error(`Te weinig teams gevonden op de standenpagina (${teams.length}).`);
  return teams;
}

// --- Wedstrijdschema ---------------------------------------------------------------------------

function tijdNaar24u(tekst) {
  const m = /(\d{1,2}):(\d{2})\s*(AM|PM)/i.exec(tekst || '');
  if (!m) return null;
  let uur = Number(m[1]) % 12;
  if (/pm/i.test(m[3])) uur += 12;
  return `${String(uur).padStart(2, '0')}:${m[2]}`;
}

function parseWedstrijdenUitPagina(html) {
  const wedstrijden = [];
  const datumRegex = /<details[^>]*id="date-(\d{8})"[^>]*>([\s\S]*?)<\/details>/g;
  let datumSectie;
  while ((datumSectie = datumRegex.exec(html))) {
    const ruweDatum = datumSectie[1];
    const datum = `${ruweDatum.slice(0, 4)}-${ruweDatum.slice(4, 6)}-${ruweDatum.slice(6, 8)}`;
    const sectieHtml = datumSectie[2];

    const spelRegex = /<turbo-frame frame_id="robin_game_\d+"[^>]*>([\s\S]*?)<\/turbo-frame>/g;
    let spel;
    while ((spel = spelRegex.exec(sectieHtml))) {
      const blok = spel[1];
      const teamNamen = [...blok.matchAll(/game-team-name[^"]*"[^>]*>([^<]+)</g)].map((m) => m[1].trim());
      if (teamNamen.length < 2) continue;
      const scores = [...blok.matchAll(/score played[^"]*">\s*(\d+)\s*</g)].map((m) => Number(m[1]));
      const tijdMatch = /<time[^>]*title="([^"]+)"/.exec(blok);
      const veldMatch = /\?sc=\d+"[^>]*>([^<]+)</.exec(blok);
      const nummerMatch = /<p>\s*Match (\d+)\s*<\/p>/.exec(blok);

      wedstrijden.push({
        datum,
        tijd: tijdMatch ? tijdNaar24u(tijdMatch[1]) : null,
        thuis: teamNamen[0],
        uit: teamNamen[1],
        gespeeld: scores.length === 2,
        thuisScore: scores.length === 2 ? scores[0] : null,
        uitScore: scores.length === 2 ? scores[1] : null,
        veld: veldMatch ? veldMatch[1].trim() : null,
        wedstrijdnummer: nummerMatch ? Number(nummerMatch[1]) : null,
      });
    }
  }
  return wedstrijden;
}

async function haalWedstrijdenOp(robinPad) {
  const alleWedstrijden = [];
  for (let pagina = 1; pagina <= 50; pagina += 1) {
    const html = await haalOp(`https://playpass.com${robinPad}/robin_games?page=${pagina}`, {
      'Turbo-Frame': `robin_games_${pagina}`,
      Accept: 'text/html',
    });
    const wedstrijdenOpPagina = parseWedstrijdenUitPagina(html);
    if (wedstrijdenOpPagina.length === 0) break;
    alleWedstrijden.push(...wedstrijdenOpPagina);
  }
  if (alleWedstrijden.length < 1) throw new Error('Geen wedstrijden gevonden in het schema.');
  return alleWedstrijden;
}

// --- Hoofdprogramma ----------------------------------------------------------------------------

async function main() {
  const instellingen = await leesJson(INSTELLINGEN_PAD, null);
  if (!instellingen || !instellingen.bronUrl) {
    throw new Error('data/vvgsd-instellingen.json ontbreekt of heeft geen "bronUrl".');
  }

  const hoofdHtml = await haalOp(instellingen.bronUrl, {});
  const standingsFrameSrc = /id="standings"[^>]*src="([^"]+)"/.exec(hoofdHtml);
  if (!standingsFrameSrc) throw new Error('Kon de link naar de standenpagina niet vinden op de bronpagina.');
  const robinPad = standingsFrameSrc[1].replace(/\/standings$/, '');

  const standHtml = await haalOp(`https://playpass.com${standingsFrameSrc[1]}`, {
    'Turbo-Frame': 'standings',
    Accept: 'text/html',
  });
  const teams = parseStandings(standHtml, instellingen.standKolommen);
  const wedstrijden = await haalWedstrijdenOp(robinPad);

  const nu = new Date().toISOString();
  await writeFile(STAND_PAD, JSON.stringify({ bijgewerkt: nu, teams }, null, 2) + '\n', 'utf-8');
  await writeFile(SCHEMA_PAD, JSON.stringify({ bijgewerkt: nu, wedstrijden }, null, 2) + '\n', 'utf-8');

  console.log(`VVGSD-scraper klaar: ${teams.length} teams, ${wedstrijden.length} wedstrijden.`);
}

main().catch((fout) => {
  console.error('VVGSD-scraper mislukt, bestaande gegevens blijven ongewijzigd:', fout.message);
  process.exitCode = 1;
});
