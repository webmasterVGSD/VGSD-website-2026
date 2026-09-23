# Beheer van de VGSD-website

Voor de webmaster. Je hoeft hiervoor niet in de code te zoeken: alles wat regelmatig verandert
staat in formulieren op de beheerpagina.

**Beheerpagina:** `https://preview.vgsd.nl/admin/` (straks het echte domein + `/admin/`)

## Wat kun je daar aanpassen?

| Formulier | Waarvoor |
|---|---|
| **Activiteiten** | De tekst bovenaan `activiteiten.html`, en de activiteitenkaarten zelf: titel, icoon, foto, tekst, "Lees meer"-tekst, kleur (rood/wit) en volgorde |
| **Open avonden** | De kalender met open avonden (de eerstvolgende komt automatisch in de footer) |
| **Besturen** | Een nieuw bestuur toevoegen, of namen, foto, quote en bestuurstekst aanpassen |
| **Geschiedenis** | De tekst bovenaan `geschiedenis.html`, en de stappen in de tijdlijn (toevoegen, aanpassen, volgorde) |
| **VVGSD** | Groepsfoto, topscorers, wedstrijdverslagen, en (indien nodig) de handmatige invoer/instellingen voor de stand en het wedstrijdschema van het voetbalteam |
| **Instellingen** | WhatsApp-nummer, adres, e-mailadressen, telefoonnummer en Instagram-link |

Na het opslaan staat de wijziging na ongeveer 1 tot 2 minuten op de website.

## Inloggen

Er zijn twee manieren. Kies degene die past.

**1. Met een toegangstoken (aanbevolen, werkt overal)**

1. Log in op GitHub met het verenigingsaccount en ga naar
   *Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token*.
2. Naam: bijvoorbeeld "Website beheer". Vervaldatum: maximaal 1 jaar.
3. *Repository access*: kies **Only select repositories** en selecteer `VGSD-website-2026`.
4. *Permissions → Repository permissions*: zet **Contents** op **Read and write**. Verder niets.
5. Kopieer het token, ga naar de beheerpagina, klik op **Sign In Using Access Token** en plak het.

Het token blijft alleen in jouw browser bewaard. Tref je een nieuw apparaat, maak dan een nieuw token.
Bij overdracht aan een nieuwe webmaster: trek het oude token in (GitHub → dezelfde pagina → *Delete*).

**2. Lokaal (op de computer waar de projectmap staat)**

Start `site-bekijken.bat`, ga naar `http://localhost:8000/admin/`, klik op **Work with Local Repository**
en kies de projectmap. Wijzigingen worden dan in de bestanden opgeslagen; daarna moet je ze zelf
committen en pushen. De knop **Sign In with GitHub** werkt nog niet (daarvoor is een extra kleine
dienst nodig, zie `TODO.md`).

## Een nieuw bestuur toevoegen

1. Open **Besturen → Alle besturen** en klik bovenaan op de knop om een bestuur toe te voegen.
   Het nieuwe bestuur komt **bovenaan**; dat is het huidige bestuur en wordt op de website groot getoond.
2. Vul de naam in (de achternaam van de praeses, zonder "Bestuur"; bij een herhaling een Romeins cijfer,
   bv. "de Jong III"), en de namen bij de functies. Fiscus en assessor zijn optioneel.
3. Foto: klik op **Foto uploaden…** (of sleep een foto in het veld). De foto wordt automatisch
   verkleind (maximaal 1600 pixels) en als JPEG bewaard, dus je hoeft hem niet zelf aan te passen.
   Daarna verschijnt een kader dat laat zien hoe de foto op een kaartje komt te staan. **Sleep de foto
   in dat kader** (of gebruik de pijltjestoetsen) om te bepalen welk deel zichtbaar blijft; de twee
   kleine voorbeelden eronder laten het grote blok en de popup zien. Met *Uitlijning herstellen* ga je
   terug naar de standaard. Met *Bestaande foto kiezen…* gebruik je een foto die al op de site staat.
4. Vul optioneel een quote en bestuurstekst in.
5. Klik op **Save** (opslaan). Na 1 tot 2 minuten staat het op de website. Tot die tijd kan het
   voorbeeld in het foto-veld nog leeg zijn, omdat de foto dan nog niet online staat.

Wat je in het kader ziet is een beperkte weergave: dezelfde foto wordt op de website ook in andere
verhoudingen getoond. De foto zelf blijft dus altijd heel; alleen de uitlijning wordt opgeslagen
(`"foto": { "src": "...", "positie": "50% 30%" }` in `data/besturen.json`).

## Een activiteitenkaart toevoegen, aanpassen of verwijderen

1. Open **Activiteiten → Activiteitenpagina**.
2. Bovenaan het formulier staat de tekst die boven de kaarten op de pagina staat (titel en twee
   alinea's); die kun je los aanpassen.
3. Daaronder staat de lijst **Activiteitenkaarten**. Nieuwe kaart: knop **Add Activiteit** (komt
   bovenaan de lijst). Verwijderen: menu **⋮** op de kaart zelf. Volgorde wijzigen: sleep de kaart
   aan het handvat (**≡**) links op de kaartbalk naar de gewenste plek.
4. Per kaart vul je een titel, een icoonnaam (zoek deze op [phosphoricons.com](https://phosphoricons.com),
   bijvoorbeeld "book-open-text"), en een korte omschrijving in (die staat altijd op de kaart).
   "Uitgebreide tekst" is optioneel: laat die leeg als de kaart geen "Lees meer"-knop moet krijgen.
5. Foto (optioneel): zelfde bijsnij-werking als bij Besturen — uploaden of slepen, dan het kader
   verslepen om te bepalen welk deel zichtbaar blijft. Zonder foto toont de kaart alleen het icoon.
6. **Rood uitgelicht**: zet dit aan voor de belangrijkste of meest kenmerkende activiteiten (op de
   site krijgt de kaart dan een rode in plaats van een witte achtergrond). Zet dit niet bij te veel
   kaarten na elkaar in de volgorde — verspreid ze liever over de lijst voor een rustiger geheel.

## Een stap aan de geschiedenis-tijdlijn toevoegen

Open **Geschiedenis → Geschiedenispagina**. Bovenaan staat de tekst boven de tijdlijn; daaronder de
lijst **Tijdlijn** (periode, titel, tekst — van oud naar nieuw, van boven naar onder). Toevoegen,
verwijderen en de volgorde wijzigen werkt hetzelfde als bij de activiteitenkaarten hierboven. Zet
"Dit is de huidige/laatste stap" alleen aan bij de laatste stap in de lijst (die krijgt een iets
groter bolletje op de tijdlijn).

## VVGSD: stand en wedstrijdschema (automatisch, met handmatige noodrem)

De pagina's `vvgsd.html`, `wedstrijdschema.html` en `stand.html` horen bij het voetbalteam. De
**stand en het wedstrijdschema komen automatisch binnen**: een schema (GitHub Action) haalt die
elke 3 uur op van Playpass (de plek waar de TU Delft-studentencompetitie het bijhoudt) en zet ze
in `data/vvgsd-stand-auto.json` / `data/vvgsd-schema-auto.json`. Daar hoef je normaal niets voor
te doen. Open **VVGSD** in de beheerpagina voor de rest:

- **Groepsfoto, Topscorers, Wedstrijdverslagen**: gewoon invullen zoals bij de andere formulieren
  (foto uploaden; topscorers en verslagen zijn lijstjes met een knop om er één toe te voegen).
- **Bron op Playpass**: de link naar de poule van VVGSD. Verandert die (nieuw seizoen), pas 'm hier aan.
- **Koppeling kolomkoppen (standKolommen)**: als de automatische stand ineens leeg of fout is, is de
  kans groot dat Playpass een koptekst heeft hernoemd (bijvoorbeeld "Points" werd iets anders). Ga
  naar de standenpagina op Playpass, houd de muis boven de kolomkop om de volledige naam te zien, en
  zet die naam bij het juiste veld hier. Geen code-wijziging nodig.
- **"Stand handmatig invoeren" / "Wedstrijdschema handmatig invoeren"**: laatste redmiddel, voor als
  de automatische ophaling om wat voor reden dan ook niet meer werkt (bijvoorbeeld Playpass is
  helemaal van opzet veranderd). Zet de schakelaar aan en vul de tabel/lijst daaronder zelf in — de
  site gebruikt dan die gegevens in plaats van de automatische. Zet 'm weer uit zodra het probleem
  verholpen is (of de code is aangepast) om weer automatisch bij te werken.

## Waar staan de gegevens echt?

In de map `data/` (`besturen.json`, `site.json`, `activiteiten.json`, `activiteiten-overzicht.json`,
`geschiedenis.json`, `vvgsd-instellingen.json`, en de twee automatisch gegenereerde bestanden
`vvgsd-stand-auto.json`/`vvgsd-schema-auto.json` die je niet met de hand hoeft te bewerken). De
formulieren staan beschreven in `admin/config.yml`. `js/site.js`, `activiteiten.html`,
`geschiedenis.html`, `vvgsd.html`, `wedstrijdschema.html` en `stand.html` lezen die gegevens en
bouwen daarmee de pagina op. De VVGSD-scraper zelf staat in `scripts/vvgsd-scraper.mjs`, en draait
volgens het schema in `.github/workflows/vvgsd-scraper.yml`. Bewerk je de bestanden liever met de
hand, dan kan dat ook; let op de haakjes en komma's.

## Sveltia CMS bijwerken

De beheeromgeving (Sveltia CMS) staat bewust op een vaste versie met een controlesom in `admin/index.html`.
Wil je bijwerken: zoek het nieuwste versienummer op npmjs.com (`@sveltia/cms`), pas het nummer in de link aan
en bereken de nieuwe controlesom met:

```
curl -sL https://cdn.jsdelivr.net/npm/@sveltia/cms@NIEUW/dist/sveltia-cms.js | openssl dgst -sha384 -binary | openssl base64 -A
```

Zet het resultaat achter `sha384-` bij `integrity`.
