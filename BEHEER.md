# Beheer van de VGSD-website

Voor de webmaster. Je hoeft hiervoor niet in de code te zoeken: alles wat regelmatig verandert
staat in formulieren op de beheerpagina.

**Beheerpagina:** `https://preview.vgsd.nl/admin/` (straks het echte domein + `/admin/`)

## Wat kun je daar aanpassen?

| Formulier | Waarvoor |
|---|---|
| **Besturen** | Een nieuw bestuur toevoegen, of namen, foto, quote en bestuurstekst aanpassen |
| **Instellingen** | WhatsApp-nummer, adres, e-mailadressen, telefoonnummer en Instagram-link |
| **Open avonden** | De kalender met open avonden (de eerstvolgende komt automatisch in de footer) |

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
3. Upload eventueel een foto (liggend, maximaal 1600 pixels breed) en vul optioneel een quote en
   bestuurstekst in.
4. Klik op **Opslaan / Publiceren**.

## Waar staan de gegevens echt?

In de map `data/` (`besturen.json`, `site.json`, `activiteiten.json`). De formulieren staan beschreven in
`admin/config.yml`. `js/site.js` leest de gegevens op elke pagina. Bewerk je de bestanden liever met de hand,
dan kan dat ook; let op de haakjes en komma's.

## Sveltia CMS bijwerken

De beheeromgeving (Sveltia CMS) staat bewust op een vaste versie met een controlesom in `admin/index.html`.
Wil je bijwerken: zoek het nieuwste versienummer op npmjs.com (`@sveltia/cms`), pas het nummer in de link aan
en bereken de nieuwe controlesom met:

```
curl -sL https://cdn.jsdelivr.net/npm/@sveltia/cms@NIEUW/dist/sveltia-cms.js | openssl dgst -sha384 -binary | openssl base64 -A
```

Zet het resultaat achter `sha384-` bij `integrity`.
