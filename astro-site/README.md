# VGSD website — Astro front-end

Statisch gegenereerde (SSG) front-end voor de VGSD-website, gebouwd met
[Astro](https://astro.build), TypeScript en Tailwind CSS v4. Publieke content
(nieuws, pagina's) komt uit een headless WordPress-installatie via de
WordPress REST API. Het besloten ledenportaal draait apart, direct op die
WordPress-installatie op een subdomein (bv. `leden.vgsd.nl`) — deze site
linkt er alleen naartoe via de "Leden inlog"-knop.

## Architectuur in het kort

- **Front-end (dit project):** Astro, SSG, Tailwind CSS, zo min mogelijk
  client-side JavaScript. Bedoeld voor Cloudflare Pages of Vercel.
- **Back-end (nog niet gebouwd):** headless WordPress op een apart subdomein,
  puur voor content (nieuws, pagina's) via de standaard WP REST API. Geen
  page builder, geen plugins (ook geen ACF) — zie `../TODO.md` in de repo-root
  voor de volledige afspraak hierover.
- **Ledenportaal (nog niet gebouwd):** login, permissies en formulieren lopen
  volledig via WordPress zelf op het subdomein. Geen custom auth in deze
  Astro-site.

Er is nu nog geen WordPress-backend. Zolang `WORDPRESS_API_URL` niet is
ingesteld (zie hieronder), gebruikt de site automatisch mock-data uit
`src/lib/mock-data.ts`, zodat alles wel gewoon bouwt en draait. Zodra er een
echte backend is, hoeft alleen de env-variabele ingevuld te worden — de code
verandert niet.

## Projectstructuur

```text
/
├── src/
│   ├── components/
│   │   ├── Header.astro       # navigatie + "Leden inlog"-knop naar het subdomein
│   │   └── Footer.astro
│   ├── layouts/
│   │   └── Layout.astro       # basis-HTML, fonts, <slot />
│   ├── lib/
│   │   ├── wordpress.ts       # type-safe WP REST API-helper (met mock-fallback)
│   │   └── mock-data.ts       # voorbeelddata zolang er geen backend is
│   ├── pages/
│   │   ├── index.astro
│   │   ├── nieuws/
│   │   │   ├── index.astro    # overzicht van alle WP-berichten
│   │   │   └── [slug].astro   # één WP-bericht, via getStaticPaths()
│   │   ├── [slug].astro       # generieke WP-pagina, via getStaticPaths()
│   │   └── 404.astro
│   ├── styles/
│   │   └── global.css         # Tailwind + kleuren/fonts (zelfde palet als de huidige statische site)
│   └── env.d.ts                # typering van de env-variabelen
├── .env.example
└── astro.config.mjs
```

Geen aparte state-managers, geen page builder-achtige abstracties: gewoon
Astro-componenten en `getStaticPaths()`, zoals de standaard Astro-documentatie
het voorschrijft.

## Setup

```sh
npm install
cp .env.example .env   # vul WORDPRESS_API_URL / WORDPRESS_MEMBERS_URL in zodra bekend
npm run dev             # http://localhost:4321
```

| Commando          | Werkt                                              |
| :----------------- | :-------------------------------------------------- |
| `npm install`       | Installeert dependencies                            |
| `npm run dev`        | Start lokale dev-server op `localhost:4321`          |
| `npm run build`      | Bouwt de statische site naar `./dist/`               |
| `npm run preview`    | Bekijk de build lokaal, vóór deployen                |

## Content koppelen aan een echte WordPress-backend

1. Zet een WordPress-installatie live op een subdomein (bv. `api.vgsd.nl`),
   met de standaard REST API aan (staat by default aan, geen plugin nodig).
2. Zet in `.env`:
   ```
   WORDPRESS_API_URL=https://api.vgsd.nl/wp-json
   WORDPRESS_MEMBERS_URL=https://leden.vgsd.nl/wp-login.php
   ```
3. Draai `npm run build` opnieuw — de site haalt dan automatisch echte
   berichten/pagina's op in plaats van de mock-data. Geen codewijzigingen
   nodig.

## Deployen

Deze site is 100% statische output (`npm run build` → `./dist/`), dus elke
static host werkt. Aanbevolen: Cloudflare Pages of Vercel.

- **Cloudflare Pages:** build command `npm run build`, output directory
  `dist`. Zet `WORDPRESS_API_URL` en `WORDPRESS_MEMBERS_URL` als
  environment variables in het Pages-project, zodat ze ook tijdens de
  build-op-Cloudflare beschikbaar zijn.
- **Vercel:** framework preset "Astro" wordt automatisch gedetecteerd; zelfde
  environment variables instellen in de project-settings.

Omdat de site puur statisch is, moet elke keer dat er nieuwe content in
WordPress komt de site opnieuw gebouwd worden (bv. via een WordPress-webhook
die de deploy op Cloudflare/Vercel triggert) — dat is nog niet ingericht, zie
`../TODO.md`.
