// Gedeeld script voor alle pagina's. Leest de gegevens uit de map data/ (site.json en
// activiteiten.json) en vult daarmee overal het WhatsApp-nummer, de contactgegevens en
// de "volgende open avond" in de footer in. Zo staan die gegevens op één plek.
//
// Hoe een pagina dit gebruikt:
//   data-wa                    -> href wordt een WhatsApp-link (optioneel data-wa-tekst="voorgetypte tekst")
//   data-site-tekst="pad"      -> tekst wordt de waarde uit site.json, bv. "contact.email"
//   data-site-adres            -> adres uit site.json, regels gescheiden door regeleinden
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

  function waarde(obj, pad) {
    return pad.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
  }

  function telLink(nummer) {
    const cijfers = String(nummer).replace(/[^\d+]/g, '');
    return cijfers.startsWith('0') && !cijfers.startsWith('00') ? `+31${cijfers.slice(1)}` : cijfers;
  }

  function maakWaLink(site, tekst) {
    return `https://wa.me/${site.whatsapp}${tekst ? `?text=${encodeURIComponent(tekst)}` : ''}`;
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

  const ready = Promise.all([laad('site'), laad('activiteiten')]).then(([site, activiteiten]) => {
    vulSiteGegevens(site);
    vulVolgendeOpenAvond(site, activiteiten.openAvonden);
    return { site, openAvonden: activiteiten.openAvonden };
  });
  ready.catch((fout) => console.error('VGSD: gegevens laden mislukt.', fout));

  // VVGSD (voetbalteam): stand en wedstrijdschema komen automatisch van Playpass
  // (data/vvgsd-stand-auto.json en data/vvgsd-schema-auto.json, bijgewerkt door
  // scripts/vvgsd-scraper.mjs via een GitHub Action). Staat in de beheerpagina "handmatig
  // invoeren" aan, dan gebruiken we in plaats daarvan de lijst die daar is ingevuld. Zo hoeft
  // vvgsd.html, wedstrijdschema.html en stand.html niet te weten welke van de twee het is.
  async function laadVvgsd() {
    const instellingen = await laad('vvgsd-instellingen');

    let standTeams = instellingen.standTeams || [];
    let standBijgewerkt = null;
    if (!instellingen.standHandmatig) {
      const auto = await laad('vvgsd-stand-auto').catch(() => ({ teams: [], bijgewerkt: null }));
      standTeams = auto.teams || [];
      standBijgewerkt = auto.bijgewerkt || null;
    }

    let wedstrijden = instellingen.schemaWedstrijden || [];
    let schemaBijgewerkt = null;
    if (!instellingen.schemaHandmatig) {
      const auto = await laad('vvgsd-schema-auto').catch(() => ({ wedstrijden: [], bijgewerkt: null }));
      wedstrijden = auto.wedstrijden || [];
      schemaBijgewerkt = auto.bijgewerkt || null;
    }

    return {
      teamNaam: instellingen.teamNaam || 'VVGSD',
      groepsfoto: instellingen.groepsfoto || null,
      topscorers: instellingen.topscorers || [],
      verslagen: instellingen.verslagen || [],
      stand: standTeams.slice().sort((a, b) => (a.positie || 0) - (b.positie || 0)),
      standBijgewerkt,
      wedstrijden: wedstrijden
        .slice()
        .sort((a, b) => `${a.datum}T${a.tijd || ''}`.localeCompare(`${b.datum}T${b.tijd || ''}`)),
      schemaBijgewerkt,
    };
  }

  window.VGSD = { ready, laad, laadVvgsd, waLink: maakWaLink, vulSiteGegevens, initReveal };
})();
