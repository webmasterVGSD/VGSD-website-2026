// Eigen invoerveld voor de beheeromgeving: foto uploaden en met slepen bijsnijden, voor de
// activiteitenkaarten op activiteiten.html. Zelfde werking als admin/vgsd-foto.js (besturen),
// maar met één (bredere) kader-verhouding, passend bij de foto's op een activiteitenkaart, en
// zonder de extra "groot uitgelicht blok"/"popup"-voorbeelden die alleen voor besturen gelden.
//
// Opgeslagen waarde in data/paginas/activiteiten/kaarten.json (en data/paginas/kasten/kasten.json):
//   "foto": { "src": "/images/...jpg", "positie": "50% 30%" }  ("positie" is een CSS object-position)
// activiteiten.html leest dat via dezelfde soort fotoVan()-functie als besturen.html.
//
// Registratie: CMS.registerFieldType('vgsd-foto-activiteiten', ...), gebruikt in admin/config.yml.
(function () {
  'use strict';

  if (!window.CMS || !window.createClass || !window.h) {
    console.error('vgsd-foto-activiteiten: Sveltia CMS is niet geladen, het foto-veld is niet beschikbaar.');
    return;
  }

  var h = window.h;
  var MAX_ZIJDE = 1600;
  var JPEG_KWALITEIT = 0.86;
  var STANDAARD = { x: 50, y: 50 };
  // Verhouding (breedte : hoogte) van een activiteitenkaart: vaste fotohoogte (10rem) op een
  // kaart van gemiddeld ~390px breed in het overzicht op een breed scherm. Een benadering, net
  // als bij de besturenkaarten — de precieze breedte verschilt licht per schermgrootte.
  var KAART_VERHOUDING = 2.4;

  function begrens(n) {
    return Math.max(0, Math.min(100, n));
  }

  function leesPositie(tekst) {
    var m = /(-?\d+(?:\.\d+)?)%\s+(-?\d+(?:\.\d+)?)%/.exec(tekst || '');
    if (m) return { x: begrens(parseFloat(m[1])), y: begrens(parseFloat(m[2])) };
    return { x: STANDAARD.x, y: STANDAARD.y };
  }

  function schrijfPositie(p) {
    return Math.round(p.x) + '% ' + Math.round(p.y) + '%';
  }

  // De waarde mag een object zijn, of (bij oude gegevens) alleen een pad als tekst.
  function leesWaarde(value) {
    if (!value) return { src: '', positie: { x: STANDAARD.x, y: STANDAARD.y } };
    if (typeof value === 'string') return { src: value, positie: { x: STANDAARD.x, y: STANDAARD.y } };
    return { src: value.src || '', positie: leesPositie(value.positie) };
  }

  function maakSlug(bestandsnaam) {
    var basis = String(bestandsnaam || 'foto').replace(/\.[^.]+$/, '');
    var slug = basis.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return (slug || 'foto') + '.jpg';
  }

  function verkleinNaarJpeg(bestand) {
    return createImageBitmap(bestand, { imageOrientation: 'from-image' }).then(function (bitmap) {
      var schaal = Math.min(1, MAX_ZIJDE / Math.max(bitmap.width, bitmap.height));
      var breedte = Math.max(1, Math.round(bitmap.width * schaal));
      var hoogte = Math.max(1, Math.round(bitmap.height * schaal));
      var canvas = document.createElement('canvas');
      canvas.width = breedte;
      canvas.height = hoogte;
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff'; // PNG's met transparantie krijgen een witte achtergrond
      ctx.fillRect(0, 0, breedte, hoogte);
      ctx.drawImage(bitmap, 0, 0, breedte, hoogte);
      if (bitmap.close) bitmap.close();
      return new Promise(function (resolve, reject) {
        canvas.toBlob(function (blob) {
          if (blob) resolve({ blob: blob, breedte: breedte, hoogte: hoogte });
          else reject(new Error('Kon de foto niet omzetten.'));
        }, 'image/jpeg', JPEG_KWALITEIT);
      });
    });
  }

  function formatGrootte(bytes) {
    return bytes > 1024 * 1024 ? (bytes / 1024 / 1024).toFixed(1) + ' MB' : Math.round(bytes / 1024) + ' KB';
  }

  var knopStijl = {
    padding: '6px 12px',
    border: '1px solid rgba(127,127,127,0.55)',
    borderRadius: '6px',
    background: 'transparent',
    color: 'inherit',
    font: 'inherit',
    cursor: 'pointer',
  };

  var Control = window.createClass({
    getInitialState: function () {
      return { bezig: false, fout: '', info: '', sleepPositie: null, bestandSleept: false, laadFout: false };
    },

    // Afmetingen van de foto, nodig om te weten hoeveel er buiten het kader valt.
    natuurlijk: null,

    componentWillUnmount: function () {
      this.stopSlepen();
    },

    huidig: function () {
      return leesWaarde(this.props.value);
    },

    zetWaarde: function (src, positie) {
      this.props.onChange({ src: src, positie: schrijfPositie(positie) });
    },

    verwerkBestand: function (bestand) {
      var self = this;
      if (!bestand) return;
      if (!/^image\//.test(bestand.type)) {
        self.setState({ fout: 'Dit is geen afbeelding. Kies een JPG- of PNG-bestand.', info: '' });
        return;
      }
      self.setState({ bezig: true, fout: '', info: '' });
      verkleinNaarJpeg(bestand)
        .then(function (res) {
          return self.props.addFile(res.blob, { name: maakSlug(bestand.name) }).then(function (url) {
            self.natuurlijk = null;
            self.setState({
              bezig: false,
              laadFout: false,
              info: 'Foto verkleind naar ' + res.breedte + '×' + res.hoogte + ' pixels (' + formatGrootte(res.blob.size) + ').',
            });
            self.zetWaarde(url, { x: STANDAARD.x, y: STANDAARD.y });
          });
        })
        .catch(function (fout) {
          console.error('vgsd-foto-activiteiten:', fout);
          self.setState({
            bezig: false,
            fout: 'Deze foto kon niet worden gelezen. Gebruik een JPG- of PNG-bestand (geen HEIC).',
          });
        });
    },

    opBestandGekozen: function (event) {
      var bestand = event.target.files && event.target.files[0];
      event.target.value = '';
      this.verwerkBestand(bestand);
    },

    kiesBestaande: function () {
      var self = this;
      self.props.pickFile({ kind: 'image', accept: 'image/*', allowURL: false }).then(function (gekozen) {
        if (!gekozen || !gekozen.value) return;
        self.natuurlijk = null;
        self.setState({ fout: '', info: '', laadFout: false });
        self.zetWaarde(gekozen.value, { x: STANDAARD.x, y: STANDAARD.y });
      });
    },

    verwijder: function () {
      this.natuurlijk = null;
      this.setState({ fout: '', info: '', laadFout: false, sleepPositie: null });
      this.props.onChange('');
    },

    herstelPositie: function () {
      var w = this.huidig();
      this.zetWaarde(w.src, { x: STANDAARD.x, y: STANDAARD.y });
    },

    opFotoGeladen: function (event) {
      this.natuurlijk = { b: event.target.naturalWidth, h: event.target.naturalHeight };
      if (this.state.laadFout) this.setState({ laadFout: false });
    },

    opFotoFout: function () {
      this.setState({ laadFout: true });
    },

    // --- slepen -------------------------------------------------------------------------
    startSlepen: function (event) {
      if (event.button !== undefined && event.button !== 0) return;
      var nat = this.natuurlijk;
      if (!nat) return;
      var kader = event.currentTarget.getBoundingClientRect();
      var w = this.huidig();
      var schaal = Math.max(kader.width / nat.b, kader.height / nat.h);
      this.sleep = {
        beginX: event.clientX,
        beginY: event.clientY,
        positie: { x: w.positie.x, y: w.positie.y },
        overloopX: nat.b * schaal - kader.width,
        overloopY: nat.h * schaal - kader.height,
        src: w.src,
      };
      event.preventDefault();
      var self = this;
      this.opBeweeg = function (e) { self.beweeg(e); };
      this.opLoslaten = function () { self.laatLos(); };
      window.addEventListener('pointermove', this.opBeweeg);
      window.addEventListener('pointerup', this.opLoslaten);
      window.addEventListener('pointercancel', this.opLoslaten);
    },

    beweeg: function (event) {
      var s = this.sleep;
      if (!s) return;
      var x = s.positie.x;
      var y = s.positie.y;
      // Sleep je de foto naar rechts/beneden, dan schuift het zichtbare deel naar links/boven.
      if (s.overloopX > 0.5) x = begrens(s.positie.x - ((event.clientX - s.beginX) / s.overloopX) * 100);
      if (s.overloopY > 0.5) y = begrens(s.positie.y - ((event.clientY - s.beginY) / s.overloopY) * 100);
      this.setState({ sleepPositie: { x: x, y: y } });
    },

    laatLos: function () {
      var s = this.sleep;
      var p = this.state.sleepPositie;
      this.stopSlepen();
      this.setState({ sleepPositie: null });
      if (s && p) this.zetWaarde(s.src, p);
    },

    stopSlepen: function () {
      this.sleep = null;
      if (this.opBeweeg) window.removeEventListener('pointermove', this.opBeweeg);
      if (this.opLoslaten) {
        window.removeEventListener('pointerup', this.opLoslaten);
        window.removeEventListener('pointercancel', this.opLoslaten);
      }
      this.opBeweeg = null;
      this.opLoslaten = null;
    },

    opToets: function (event) {
      var stap = event.shiftKey ? 10 : 2;
      var dx = 0;
      var dy = 0;
      if (event.key === 'ArrowLeft') dx = -stap;
      else if (event.key === 'ArrowRight') dx = stap;
      else if (event.key === 'ArrowUp') dy = -stap;
      else if (event.key === 'ArrowDown') dy = stap;
      else return;
      event.preventDefault();
      var w = this.huidig();
      this.zetWaarde(w.src, { x: begrens(w.positie.x + dx), y: begrens(w.positie.y + dy) });
    },

    // --- slepen van een bestand naar het veld -------------------------------------------
    opBestandOverVeld: function (event) {
      if (!event.dataTransfer || Array.prototype.indexOf.call(event.dataTransfer.types || [], 'Files') === -1) return;
      event.preventDefault();
      if (!this.state.bestandSleept) this.setState({ bestandSleept: true });
    },
    opBestandVerlaatVeld: function () {
      if (this.state.bestandSleept) this.setState({ bestandSleept: false });
    },
    opBestandGelaten: function (event) {
      if (!event.dataTransfer || !event.dataTransfer.files || !event.dataTransfer.files.length) return;
      event.preventDefault();
      this.setState({ bestandSleept: false });
      this.verwerkBestand(event.dataTransfer.files[0]);
    },

    // --- weergave -----------------------------------------------------------------------
    kader: function (positie, opties) {
      var w = this.huidig();
      opties = opties || {};
      var stijl = {
        position: 'relative',
        overflow: 'hidden',
        aspectRatio: String(KAART_VERHOUDING) + ' / 1',
        borderRadius: '8px',
        background: 'rgba(127,127,127,0.2)',
        width: '100%',
      };
      var foto = h('img', {
        src: w.src,
        alt: '',
        draggable: false,
        onLoad: opties.sleepbaar ? this.opFotoGeladen : undefined,
        onError: opties.sleepbaar ? this.opFotoFout : undefined,
        style: {
          display: 'block',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: positie.x + '% ' + positie.y + '%',
          userSelect: 'none',
          pointerEvents: 'none',
        },
      });
      if (!opties.sleepbaar) return h('div', { style: stijl }, foto);
      stijl.cursor = this.state.sleepPositie ? 'grabbing' : 'grab';
      stijl.touchAction = 'none';
      stijl.outlineOffset = '2px';
      return h('div', {
        style: stijl,
        tabIndex: 0,
        role: 'slider',
        'aria-label': 'Uitlijning van de foto. Sleep de foto, of gebruik de pijltjestoetsen.',
        onPointerDown: this.startSlepen,
        onKeyDown: this.opToets,
      }, foto);
    },

    render: function () {
      var self = this;
      var w = this.huidig();
      var positie = this.state.sleepPositie || w.positie;
      var heeftFoto = Boolean(w.src);

      var bestandsKnop = function (tekst) {
        return h('label', { style: Object.assign({}, knopStijl, { display: 'inline-block' }) },
          tekst,
          h('input', { type: 'file', accept: 'image/*', style: { display: 'none' }, onChange: self.opBestandGekozen })
        );
      };

      var rand = this.state.bestandSleept ? '2px dashed currentColor' : '1px dashed rgba(127,127,127,0.55)';

      var inhoud;
      if (this.state.bezig) {
        inhoud = h('p', { style: { margin: 0 } }, 'Foto wordt verkleind…');
      } else if (!heeftFoto) {
        inhoud = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-start' } },
          h('p', { style: { margin: 0 } }, 'Sleep hier een foto naartoe, of kies een bestand.'),
          h('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap' } },
            bestandsKnop('Foto uploaden…'),
            h('button', { type: 'button', style: knopStijl, onClick: this.kiesBestaande }, 'Bestaande foto kiezen…')
          ),
          h('p', { style: { margin: 0, opacity: 0.7, fontSize: '0.9em' } },
            'De foto wordt automatisch verkleind (maximaal 1600 pixels), dus je hoeft dat niet zelf te doen. ' +
            'Zonder foto toont de kaart alleen het icoon en de tekst.')
        );
      } else {
        inhoud = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px' } },
          this.state.laadFout
            ? h('p', { style: { margin: 0 } },
                'Het voorbeeld kan nog niet getoond worden (de foto staat nog niet online). Zodra de site is bijgewerkt, kun je de uitlijning hier instellen.')
            : h('div', null,
                this.kader(positie, { sleepbaar: true }),
                h('p', { style: { margin: '6px 0 0', opacity: 0.75, fontSize: '0.9em' } },
                  'Sleep de foto in het kader (of gebruik de pijltjestoetsen) om te bepalen welk deel zichtbaar blijft. ' +
                  'Dit kader laat zien hoe het bovenaan de activiteitenkaart komt te staan.')
              ),
          h('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap' } },
            bestandsKnop('Andere foto uploaden…'),
            h('button', { type: 'button', style: knopStijl, onClick: this.kiesBestaande }, 'Bestaande foto kiezen…'),
            h('button', { type: 'button', style: knopStijl, onClick: this.herstelPositie }, 'Uitlijning herstellen'),
            h('button', { type: 'button', style: knopStijl, onClick: this.verwijder }, 'Foto verwijderen')
          )
        );
      }

      return h('div', {
        id: this.props.forID,
        className: this.props.classNameWrapper,
        onDragOver: this.opBestandOverVeld,
        onDragLeave: this.opBestandVerlaatVeld,
        onDrop: this.opBestandGelaten,
        style: { border: rand, borderRadius: '8px', padding: '12px' },
      },
        inhoud,
        this.state.fout ? h('p', { role: 'alert', style: { margin: '10px 0 0', color: '#c0392b' } }, this.state.fout) : null,
        this.state.info ? h('p', { style: { margin: '10px 0 0', opacity: 0.75, fontSize: '0.9em' } }, this.state.info) : null
      );
    },
  });

  // Voorbeeldpaneel rechts in het beheerscherm: de foto zoals hij bovenaan de kaart komt te staan.
  var Voorbeeld = window.createClass({
    render: function () {
      var w = leesWaarde(this.props.value);
      if (!w.src) return null;
      return h('div', {
        style: { aspectRatio: String(KAART_VERHOUDING) + ' / 1', overflow: 'hidden', borderRadius: '8px', maxWidth: '420px' },
      }, h('img', {
        src: w.src,
        alt: '',
        style: {
          display: 'block',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: w.positie.x + '% ' + w.positie.y + '%',
        },
      }));
    },
  });

  window.CMS.registerFieldType('vgsd-foto-activiteiten', Control, Voorbeeld);
})();
