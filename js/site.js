// Gedeeld script voor alle pagina's. Leest de gegevens uit de map data/ (data/instellingen/ en
// activiteiten.json) en vult daarmee overal het WhatsApp-nummer, de contactgegevens, de footer
// en de "volgende open avond" in de footer in. Zo staan die gegevens op één plek.
//
// Hoe een pagina dit gebruikt:
//   data-wa                    -> href wordt een WhatsApp-link (optioneel data-wa-tekst="voorgetypte tekst")
//   data-site-tekst="pad"      -> tekst uit data/instellingen/, bv. "contact.email" (= contact.json, veld email)
//   data-site-adres            -> adres uit contact.json, regels gescheiden door regeleinden
//   data-site-mailto="pad"     -> href wordt mailto:<waarde>
//   data-site-tel="pad"        -> href wordt tel:<waarde>
//   data-site-social="naam"    -> href wordt de social-link (bv. "instagram"), leeg = ongemoeid
(function () {
  'use strict';

  async function laad(naam) {
    const antwoord = await fetch(`data/${naam}.json`, { cache: 'no-cache' });
    if (!antwoord.ok) throw new Error(`data/${naam}.json kon niet worden geladen (${antwoord.status})`);
    return antwoord.json();
  }

  // Elk blok in de beheerpagina is een eigen bestand: data/<map>/<blok>.json. Deze functie laadt
  // de genoemde blokken en geeft ze terug als één object { blok: inhoud, ... }. Een ontbrekend
  // blok wordt een leeg object, zodat de rest van de pagina gewoon werkt.
  async function laadBlokken(map, blokken) {
    const inhoud = await Promise.all(blokken.map((blok) => laad(`${map}/${blok}`).catch((fout) => {
      console.error('VGSD:', fout.message);
      return {};
    })));
    return Object.fromEntries(blokken.map((blok, i) => [blok, inhoud[i]]));
  }

  const INSTELLINGEN_BLOKKEN = ['whatsapp', 'contact', 'social', 'cta', 'footer'];

  function waarde(obj, pad) {
    return pad.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
  }

  function telLink(nummer) {
    const cijfers = String(nummer).replace(/[^\d+]/g, '');
    return cijfers.startsWith('0') && !cijfers.startsWith('00') ? `+31${cijfers.slice(1)}` : cijfers;
  }

  function maakWaLink(site, tekst) {
    return `https://wa.me/${site.whatsapp.nummer}${tekst ? `?text=${encodeURIComponent(tekst)}` : ''}`;
  }

  function vulSiteGegevens(site) {
    document.querySelectorAll('[data-wa]').forEach((el) => {
      el.href = maakWaLink(site, el.dataset.waTekst);
      el.target = '_blank';
      el.rel = 'noopener';
    });
    document.querySelectorAll('[data-site-tekst]').forEach((el) => {
      const w = waarde(site, el.dataset.siteTekst);
      if (w != null) el.textContent = w;
    });
    document.querySelectorAll('[data-site-adres]').forEach((el) => {
      const regels = String(waarde(site, 'contact.adres') || '').split('\n');
      el.replaceChildren();
      regels.forEach((regel, i) => {
        if (i > 0) el.appendChild(document.createElement('br'));
        el.appendChild(document.createTextNode(regel));
      });
    });
    document.querySelectorAll('[data-site-mailto]').forEach((el) => {
      const w = waarde(site, el.dataset.siteMailto);
      if (w) el.href = `mailto:${w}`;
    });
    document.querySelectorAll('[data-site-tel]').forEach((el) => {
      const w = waarde(site, el.dataset.siteTel);
      if (w) el.href = `tel:${telLink(w)}`;
    });
    document.querySelectorAll('[data-site-social]').forEach((el) => {
      const w = waarde(site, `social.${el.dataset.siteSocial}`);
      if (w) {
        el.href = w;
        el.target = '_blank';
        el.rel = 'noopener';
      }
    });
  }

  // Kiest de eerstvolgende open avond die nog niet is geweest en toont die in de footer.
  function vulVolgendeOpenAvond(site, openAvonden) {
    const titelEl = document.getElementById('activiteit-titel');
    const datumEl = document.getElementById('activiteit-datum');
    const locatieEl = document.getElementById('activiteit-locatie');
    const omschrijvingEl = document.getElementById('activiteit-omschrijving');
    const ctaEl = document.getElementById('activiteit-cta');
    if (!titelEl || !datumEl || !omschrijvingEl) return;

    const nu = new Date();
    const aankomend = openAvonden
      .map((item) => ({ ...item, when: new Date(item.datum) }))
      .filter((item) => !Number.isNaN(item.when.getTime()) && item.when.getTime() > nu.getTime())
      .sort((a, b) => a.when - b.when)[0];

    if (!aankomend) {
      titelEl.textContent = 'Data volgen binnenkort';
      datumEl.textContent = '';
      if (locatieEl) locatieEl.textContent = '';
      omschrijvingEl.textContent = '';
      return;
    }

    const dagFormat = new Intl.DateTimeFormat('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' });
    const tijdFormat = new Intl.DateTimeFormat('nl-NL', { hour: '2-digit', minute: '2-digit' });
    const dagLabel = dagFormat.format(aankomend.when);

    titelEl.textContent = aankomend.titel;
    datumEl.textContent = `${dagLabel.charAt(0).toUpperCase() + dagLabel.slice(1)}, ${tijdFormat.format(aankomend.when)} uur`;
    if (locatieEl) {
      locatieEl.replaceChildren();
      const icoon = document.createElement('i');
      icoon.className = 'ph ph-map-pin';
      locatieEl.append(icoon, ` ${aankomend.locatie}`);
    }
    omschrijvingEl.textContent = aankomend.omschrijving;
    if (ctaEl) {
      const bericht = `Hallo, ik ben ... en ik zou me graag aanmelden voor de open avond van ${aankomend.titel} op ${dagLabel}, ${tijdFormat.format(aankomend.when)} uur.`;
      ctaEl.href = maakWaLink(site, bericht);
    }
  }

  // Scroll-animatie (.reveal). Mag vaker worden aangeroepen: alleen nieuwe elementen worden opgepakt.
  function initReveal() {
    const elementen = Array.from(document.querySelectorAll('.reveal:not([data-reveal-klaar])'));
    elementen.forEach((el) => el.setAttribute('data-reveal-klaar', ''));

    const minderBeweging = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (minderBeweging || !('IntersectionObserver' in window)) {
      elementen.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    elementen.forEach((el, i) => {
      if (!el.style.transitionDelay) el.style.transitionDelay = `${Math.min(i, 4) * 60}ms`;
      observer.observe(el);
    });

    // Vangnet: zorg dat elementen in beeld altijd zichtbaar worden, ook als de observer er een mist.
    window.setTimeout(() => {
      elementen.forEach((el) => {
        if (!el.classList.contains('is-visible') && el.getBoundingClientRect().top < window.innerHeight) {
          el.classList.add('is-visible');
        }
      });
    }, 700);
  }

  // --- Paginateksten uit de beheerpagina ------------------------------------------------------
  // Een pagina met <body data-pagina="paginas/home" data-blokken="hero overOns ..."> laadt
  // data/paginas/home/hero.json, .../overOns.json enz. (één bestand per blok in de beheerpagina)
  // en vult daarmee, met paden die beginnen met de bloknaam (bv. "hero.titel"):
  //   data-inhoud="pad"           -> tekst (bv. "hero.titel")
  //   data-inhoud-rijk="pad"      -> alinea's met opmaak (zie rijkeTekst), optioneel
  //                                  data-alinea-klasse="..." voor de class van elke <p>
  //   data-inhoud-foto="pad"      -> src van een <img>; de waarde mag een pad zijn of { src, positie }
  //   data-inhoud-alt="pad"       -> alt-tekst van een <img>
  //   data-inhoud-href="pad"      -> link
  //   data-inhoud-icoon="pad"     -> Phosphor-icoon op een <i> (naam zonder "ph-")
  //   data-inhoud-lijst="pad"     -> herhaalt de <template> in dit element voor elk item in de lijst;
  //                                  binnen de template gelden dezelfde attributen, met paden vanaf
  //                                  het item ("." is het item zelf). <template data-als="veld">
  //                                  wordt gebruikt voor items waarbij dat veld aan staat.
  //   data-inhoud-optioneel       -> (binnen een lijst) element weghalen als de waarde leeg is
  // Een lege waarde laat de bestaande tekst in de HTML staan, zodat een half ingevuld formulier
  // nooit een gat in de pagina slaat.
  function leeg(w) {
    return w == null || w === '' || (typeof w === 'object' && !Array.isArray(w) && !w.src && 'src' in w);
  }

  function pakWaarde(obj, pad) {
    return pad === '.' ? obj : waarde(obj, pad);
  }

  // Zet tekst uit de beheerpagina om in alinea's. Ondersteunt:
  //   lege regel = nieuwe alinea, enkele Enter = nieuwe regel,
  //   **vet**, ~~doorgestreept~~, [linktekst](adres),
  //   {email}, {emailPr}, {telefoon} = het adres/nummer uit Instellingen (als link).
  function rijkeTekst(tekst, site, alineaKlasse) {
    return String(tekst || '')
      .split(/\n\s*\n/)
      .map((a) => a.trim())
      .filter(Boolean)
      .map((alinea) => {
        const p = document.createElement('p');
        if (alineaKlasse) p.className = alineaKlasse;
        alinea.split('\n').forEach((regel, i) => {
          if (i > 0) p.appendChild(document.createElement('br'));
          voegInlineToe(p, regel, site);
        });
        return p;
      });
  }

  function voegInlineToe(ouder, regel, site) {
    const patroon = /\*\*(.+?)\*\*|~~(.+?)~~|\[([^\]]+)\]\(([^)\s]+)\)|\{(email|emailPr|telefoon)\}/g;
    let vanaf = 0;
    let m;
    while ((m = patroon.exec(regel))) {
      if (m.index > vanaf) ouder.appendChild(document.createTextNode(regel.slice(vanaf, m.index)));
      if (m[1] != null) {
        const b = document.createElement('strong');
        voegInlineToe(b, m[1], site);
        ouder.appendChild(b);
      } else if (m[2] != null) {
        const s = document.createElement('s');
        voegInlineToe(s, m[2], site);
        ouder.appendChild(s);
      } else if (m[3] != null) {
        const a = document.createElement('a');
        a.href = /^(https?:|mailto:|tel:|#|\/|[\w-]+\.html)/i.test(m[4]) ? m[4] : `https://${m[4]}`;
        if (/^https?:/i.test(a.getAttribute('href'))) {
          a.target = '_blank';
          a.rel = 'noopener';
        }
        a.textContent = m[3];
        ouder.appendChild(a);
      } else {
        const contact = (site && site.contact) || {};
        const w = contact[m[5]] || '';
        const a = document.createElement('a');
        a.href = m[5] === 'telefoon' ? `tel:${telLink(w)}` : `mailto:${w}`;
        a.textContent = w;
        ouder.appendChild(a);
      }
      vanaf = patroon.lastIndex;
    }
    if (vanaf < regel.length) ouder.appendChild(document.createTextNode(regel.slice(vanaf)));
  }

  function fotoSrc(w) {
    return typeof w === 'string' ? w : (w && w.src) || '';
  }

  // Vult alle data-inhoud-*-elementen binnen `wortel` met gegevens uit `data`.
  function vulInhoud(wortel, data, site, binnenLijst) {
    // Eerst de lijsten, van buiten naar binnen: geneste lijsten worden gevuld bij het klonen.
    Array.from(wortel.querySelectorAll('[data-inhoud-lijst]')).forEach((el) => {
      const items = pakWaarde(data, el.dataset.inhoudLijst);
      // Lege lijst: laat de bestaande HTML staan (bv. de lege Instagram-tegels), of haal een
      // optioneel element binnen een lijst weg (bv. de plaatsnamen onder een verband).
      if (!Array.isArray(items) || !items.length) {
        if (binnenLijst && el.hasAttribute('data-inhoud-optioneel')) el.remove();
        return;
      }
      const templates = Array.from(el.querySelectorAll(':scope > template'));
      const standaard = templates.find((t) => !t.dataset.als) || templates[0];
      if (!standaard) return;
      el.querySelectorAll(':scope > :not(template)').forEach((kind) => kind.remove());
      items.forEach((item) => {
        const t = templates.find((tpl) => tpl.dataset.als && item && item[tpl.dataset.als]) || standaard;
        const kloon = t.content.cloneNode(true);
        vulInhoud(kloon, item, site, true);
        el.appendChild(kloon);
      });
      el.removeAttribute('data-inhoud-lijst');
    });

    const vul = (attr, fn) => {
      wortel.querySelectorAll(`[data-${attr}]`).forEach((el) => {
        const naam = attr.replace(/-(\w)/g, (_, c) => c.toUpperCase());
        const w = pakWaarde(data, el.dataset[naam]);
        el.removeAttribute(`data-${attr}`);
        if (leeg(w) || (Array.isArray(w) && !w.length)) {
          if (binnenLijst && el.hasAttribute('data-inhoud-optioneel')) el.remove();
          return;
        }
        fn(el, w);
      });
    };

    vul('inhoud', (el, w) => { el.textContent = w; });
    vul('inhoud-rijk', (el, w) => { el.replaceChildren(...rijkeTekst(w, site, el.dataset.alineaKlasse)); });
    vul('inhoud-foto', (el, w) => {
      el.src = fotoSrc(w);
      if (w && w.positie) el.style.objectPosition = w.positie;
    });
    vul('inhoud-alt', (el, w) => { el.alt = w; });
    vul('inhoud-href', (el, w) => { el.href = w; });
    vul('inhoud-icoon', (el, w) => {
      el.className = el.className.replace(/\bph-(?!fill\b)[\w-]+/g, '').trim();
      el.classList.add(`ph-${w}`);
    });
  }

  const ready = Promise.all([laadBlokken('instellingen', INSTELLINGEN_BLOKKEN), laad('activiteiten')]).then(([site, activiteiten]) => {
    vulSiteGegevens(site);
    vulVolgendeOpenAvond(site, activiteiten.openAvonden);
    return { site, openAvonden: activiteiten.openAvonden };
  });
  ready.catch((fout) => console.error('VGSD: gegevens laden mislukt.', fout));

  // Paginateksten: klaar als de pagina gevuld is. Pagina's met eigen scripts wachten hierop
  // (VGSD.inhoud.then(({ pagina, site }) => ...)). Zonder data-pagina is `pagina` leeg.
  const paginaMap = document.body && document.body.dataset.pagina;
  const paginaBlokken = ((document.body && document.body.dataset.blokken) || '').split(/\s+/).filter(Boolean);
  const inhoud = Promise.all([
    ready.catch(() => ({ site: {} })),
    paginaMap ? laadBlokken(paginaMap, paginaBlokken) : Promise.resolve({}),
  ]).then(([{ site }, pagina]) => {
    vulInhoud(document, pagina, site, false);
    initReveal();
    return { pagina, site };
  });
  inhoud.catch((fout) => console.error('VGSD: paginateksten laden mislukt.', fout));

  // VVGSD (voetbalteam): stand en wedstrijdschema komen automatisch van Playpass
  // (data/vvgsd-stand-auto.json en data/vvgsd-schema-auto.json, bijgewerkt door
  // scripts/vvgsd-scraper.mjs via een GitHub Action). Staat in de beheerpagina "handmatig
  // invoeren" aan, dan gebruiken we in plaats daarvan de lijst die daar is ingevuld. Zo hoeft
  // vvgsd.html, wedstrijdschema.html en stand.html niet te weten welke van de twee het is.
  async function laadVvgsd() {
    const instellingen = await laadBlokken('paginas/vvgsd', ['groepsfoto', 'statistieken', 'wedstrijdverslagen', 'standEnSchema']);
    const standEnSchema = instellingen.standEnSchema || {};

    let standTeams = standEnSchema.standTeams || [];
    let standBijgewerkt = null;
    if (!standEnSchema.standHandmatig) {
      const auto = await laad('vvgsd-stand-auto').catch(() => ({ teams: [], bijgewerkt: null }));
      standTeams = auto.teams || [];
      standBijgewerkt = auto.bijgewerkt || null;
    }

    let wedstrijden = standEnSchema.schemaWedstrijden || [];
    let schemaBijgewerkt = null;
    if (!standEnSchema.schemaHandmatig) {
      const auto = await laad('vvgsd-schema-auto').catch(() => ({ wedstrijden: [], bijgewerkt: null }));
      wedstrijden = auto.wedstrijden || [];
      schemaBijgewerkt = auto.bijgewerkt || null;
    }

    return {
      teamNaam: standEnSchema.teamNaam || 'VVGSD',
      groepsfoto: (instellingen.groepsfoto && instellingen.groepsfoto.foto) || null,
      topscorers: (instellingen.statistieken && instellingen.statistieken.topscorers) || [],
      verslagen: (instellingen.wedstrijdverslagen && instellingen.wedstrijdverslagen.verslagen) || [],
      stand: standTeams.slice().sort((a, b) => (a.positie || 0) - (b.positie || 0)),
      standBijgewerkt,
      wedstrijden: wedstrijden
        .slice()
        .sort((a, b) => `${a.datum}T${a.tijd || ''}`.localeCompare(`${b.datum}T${b.tijd || ''}`)),
      schemaBijgewerkt,
    };
  }

  window.VGSD = { ready, inhoud, laad, laadBlokken, laadVvgsd, waLink: maakWaLink, vulSiteGegevens, initReveal, rijkeTekst };
})();
