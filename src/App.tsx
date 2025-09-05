import './App.css';
import type { ChangeEvent } from 'react';

/** ===================== Typy ===================== */
type Lang = 'cs' | 'en' | 'pl';
type Screen = 'landing' | 'wizard';

type ModelId = 'nts-pico3' | 'nts-3000' | 'nts-4000' | 'nts-5000';
type DevBand = 'small' | 'medium' | 'large' | 'xl';
type AccuracyId = 'ntp_ms' | 'ptp_ent' | 'ptp_prtc' | 'eprtc';

type Config = {
  model: ModelId;
  devBand: DevBand;
  accuracy: AccuracyId;
  oscillator: 'TCXO' | 'OCXO' | 'Rb';
  gnss: string[];
  lan: number;
  sfp: number;
  power: 'Single' | 'Redundant';
  redundantGnss: boolean;
  ptpProfile: string;
  accessories: string[];
  ptpPortsNts5000: 1 | 2 | 3 | 4; // jen pro NTS-5000
  company: string;
  contact: string;
  notes: string;
};

type I18nBlock = Record<Lang, string>;

type ModelCard = {
  id: ModelId;
  name: string;
  img: string;
  datasheet?: string;
  tag: I18nBlock;
  desc: I18nBlock;
  defaults: {
    oscillator: 'TCXO' | 'OCXO' | 'Rb';
    lan: number;
    sfp: number;
    power: 'Single' | 'Redundant';
    redundantGnss: boolean;
  };
  note: I18nBlock;
};

const t = (b: I18nBlock, lang: Lang) => b[lang];

/** ===================== Texty ===================== */
const TXT = {
  brand: {
    cs: 'Elproma NTS konfigurátor časových serverů',
    en: 'Elproma NTS Time Servers Configurator',
    pl: 'Konfigurator serwerów czasu Elproma NTS',
  } as I18nBlock,
  langLabel: { cs: 'Jazyk', en: 'Language', pl: 'Język' } as I18nBlock,

  // Landing
  heading: {
    cs: 'Přehled časových serverů',
    en: 'Time Servers Overview',
    pl: 'Przegląd serwerów czasu',
  } as I18nBlock,
  unsure: { cs: 'Nejste si jistí?', en: 'Not sure?', pl: 'Nie jesteś pewien?' } as I18nBlock,
  start: { cs: 'Spustit konfigurátor', en: 'Start configurator', pl: 'Uruchom konfigurator' } as I18nBlock,
  datasheet: { cs: 'Datasheet', en: 'Datasheet', pl: 'Karta katalogowa' } as I18nBlock,

  // Wizard – kroky
  step1Title: {
    cs: '1) Kolik zařízení potřebujete synchronizovat?',
    en: '1) How many devices do you need to synchronize?',
    pl: '1) Ile urządzeń trzeba synchronizować?',
  } as I18nBlock,
  step2Title: {
    cs: '2) Požadovaná přesnost',
    en: '2) Required accuracy',
    pl: '2) Wymagana dokładność',
  } as I18nBlock,
  step3Title: {
    cs: '3) Volitelné doplňky',
    en: '3) Optional accessories',
    pl: '3) Akcesoria opcjonalne',
  } as I18nBlock,
  step4Title: {
    cs: '4) Kontakty & export',
    en: '4) Contacts & export',
    pl: '4) Kontakt i eksport',
  } as I18nBlock,

  // Dev bands
  bands: {
    small: { cs: 'do ~50 zařízení', en: 'up to ~50 devices', pl: 'do ~50 urządzeń' } as I18nBlock,
    medium: { cs: '~50–200 zařízení', en: '~50–200 devices', pl: '~50–200 urządzeń' } as I18nBlock,
    large: { cs: '~200–1000 zařízení', en: '~200–1000 devices', pl: '~200–1000 urządzeń' } as I18nBlock,
    xl: { cs: '>1000 zařízení', en: '>1000 devices', pl: '>1000 urządzeń' } as I18nBlock,
    guide: {
      cs: 'Desítky klientů → NTP/základní PTP; stovky/tisíce → výkonnější GM, SFP, redundance.',
      en: 'Dozens → NTP/basic PTP; hundreds/thousands → higher-capacity GM, SFP, redundancy.',
      pl: 'Dziesiątki → NTP/podstawowy PTP; setki/tysiące → wydajniejszy GM, SFP, redundancja.',
    } as I18nBlock,
  },

  // Accuracy
  acc: {
    ntp_ms: {
      label: { cs: 'NTP – milisekundy', en: 'NTP – milliseconds', pl: 'NTP – milisekundy' } as I18nBlock,
      help: {
        cs: 'běžná IT síť, logy, servery, CCTV',
        en: 'typical IT network, logs, servers, CCTV',
        pl: 'typowa sieć IT, logi, serwery, CCTV',
      } as I18nBlock,
    },
    ptp_ent: {
      label: { cs: 'PTP Enterprise – sub-ms až desítky µs', en: 'PTP Enterprise – sub-ms to tens of µs', pl: 'PTP Enterprise – poniżej ms do kilkudziesięciu µs' } as I18nBlock,
      help: {
        cs: 'datacentra, průmysl, trading edge',
        en: 'data centers, industry, trading edge',
        pl: 'centra danych, przemysł, trading edge',
      } as I18nBlock,
    },
    ptp_prtc: {
      label: { cs: 'PTP Telecom/PRTC-A – sub-µs', en: 'PTP Telecom/PRTC-A – sub-µs', pl: 'PTP Telecom/PRTC-A – poniżej µs' } as I18nBlock,
      help: {
        cs: 'telekom/utility, synchronizace sítí',
        en: 'telecom/utility, network synchronization',
        pl: 'telekom/utility, synchronizacja sieci',
      } as I18nBlock,
    },
    eprtc: {
      label: { cs: 'ePRTC / dlouhý holdover', en: 'ePRTC / long holdover', pl: 'ePRTC / długi holdover' } as I18nBlock,
      help: {
        cs: 'kritická infrastruktura, rubidium',
        en: 'critical infrastructure, rubidium',
        pl: 'krytyczna infrastruktura, rubid',
      } as I18nBlock,
    },
    explain: {
      cs: 'NTP: ms • PTP Ent: sub-ms/µs • PRTC-A: sub-µs • ePRTC: dlouhý holdover (Rb).',
      en: 'NTP: ms • PTP Ent: sub-ms/µs • PRTC-A: sub-µs • ePRTC: long holdover (Rb).',
      pl: 'NTP: ms • PTP Ent: poniżej ms/µs • PRTC-A: poniżej µs • ePRTC: długi holdover (Rb).',
    } as I18nBlock,
  },

  // Accessories
  accList: {
    antenna: {
      name: { cs: 'NTS-antenna – náhradní anténa (1 ks je již v balení)', en: 'NTS-antenna – spare antenna (1 pc already in the box)', pl: 'NTS-antenna – antena zapasowa (1 szt. w zestawie)' } as I18nBlock,
      help: { cs: 'Náhradní GNSS anténa navíc k dodané sadě.', en: 'Extra GNSS antenna in addition to the included one.', pl: 'Dodatkowa antena GNSS oprócz dołączonej.' } as I18nBlock,
    },
    irig: {
      name: { cs: 'IRIG-B IN/OUT modul s 1PPS', en: 'IRIG-B IN/OUT module w/ 1PPS', pl: 'Moduł IRIG-B IN/OUT z 1PPS' } as I18nBlock,
      help: { cs: 'IRIG-B rozhraní pro průmysl/utility; 1PPS pro synchronizační výstup.', en: 'IRIG-B interface for industry/utility; 1PPS output for sync.', pl: 'Interfejs IRIG-B dla przemysłu/utility; wyjście 1PPS.' } as I18nBlock,
    },
    fo: {
      name: { cs: 'Fibre Optic Antenna Set', en: 'Fibre Optic Antenna Set', pl: 'Zestaw światłowodowy do anteny' } as I18nBlock,
      help: { cs: 'Optický linkový set pro GNSS anténu/receiver (delší trasy, odrušení).', en: 'Optical link set for GNSS antenna/receiver (long runs, isolation).', pl: 'Zestaw światłowodowy dla anteny/odbiornika GNSS (długie odcinki, izolacja).' } as I18nBlock,
    },
    psu: {
      name: { cs: 'Dual Redundant Power Supply (jen NTS-3000)', en: 'Dual Redundant Power Supply (NTS-3000 only)', pl: 'Podwójny zasilacz redundantny (tylko NTS-3000)' } as I18nBlock,
      help: { cs: 'Dvojité napájení PSU – dostupné jako volitelná výbava pouze pro NTS-3000.', en: 'Dual PSU available as an option for NTS-3000 only.', pl: 'Podwójny PSU dostępny opcjonalnie wyłącznie dla NTS-3000.' } as I18nBlock,
    },
    psuAuto: {
      name: { cs: 'Dual Redundant Power Supply – automaticky součástí', en: 'Dual Redundant Power Supply – included by default', pl: 'Podwójny zasilacz – w zestawie' } as I18nBlock,
      help: { cs: 'U modelů NTS-4000 a NTS-5000 je dual PSU standardně zahrnuto.', en: 'On NTS-4000 and NTS-5000, dual PSU is included by default.', pl: 'W NTS-4000 i NTS-5000 podwójny PSU jest standardem.' } as I18nBlock,
    },
    fw5071a: {
      name: { cs: '5071A special support (firmware)', en: '5071A special support (firmware)', pl: '5071A specjalne wsparcie (firmware)' } as I18nBlock,
      help: { cs: 'Podpora pro specifické 5071A zdroje času (firmware).', en: 'Support for specific 5071A time sources (firmware).', pl: 'Wsparcie dla specyficznych źródeł czasu 5071A (firmware).' } as I18nBlock,
    },
    ptpPorts: {
      name: { cs: 'Počet PTP portů (NTS-5000)', en: 'Number of PTP ports (NTS-5000)', pl: 'Liczba portów PTP (NTS-5000)' } as I18nBlock,
    },
  },

  // Form labels
  company: { cs: 'Společnost', en: 'Company', pl: 'Firma' } as I18nBlock,
  contact: { cs: 'Kontakt', en: 'Contact', pl: 'Kontakt' } as I18nBlock,
  notes: { cs: 'Poznámky', en: 'Notes', pl: 'Notatki' } as I18nBlock,
  back: { cs: 'Zpět', en: 'Back', pl: 'Wstecz' } as I18nBlock,
  next: { cs: 'Pokračovat', en: 'Next', pl: 'Dalej' } as I18nBlock,
  newConfig: { cs: 'Nová konfigurace', en: 'New configuration', pl: 'Nowa konfiguracja' } as I18nBlock,
  copyLink: { cs: 'Zkopírovat odkaz', en: 'Copy link', pl: 'Kopiuj link' } as I18nBlock,
  downloadJson: { cs: 'Stáhnout JSON', en: 'Download JSON', pl: 'Pobierz JSON' } as I18nBlock,

  // Shrnutí
  summaryTitle: { cs: 'Shrnutí', en: 'Summary', pl: 'Podsumowanie' } as I18nBlock,
  permalink: { cs: 'Permalink', en: 'Permalink', pl: 'Permalink' } as I18nBlock,
} as const;

/** ===================== Modely ===================== */
const MODELS: ModelCard[] = [
  {
    id: 'nts-pico3',
    name: 'NTS-PICO3',
    img: '/img/nts-pico3.jpg',
    // PICO3 datasheet nebyl dodán → tlačítko na landing zůstane disabled (viditelné)
    tag: {
      cs: 'Kompaktní | NTP/PTP (edge)',
      en: 'Compact | NTP/PTP (edge)',
      pl: 'Kompaktowy | NTP/PTP (edge)',
    },
    desc: {
      cs: 'Pro malé sítě (desítky klientů), přesnost ms (NTP) / základní PTP.',
      en: 'For small networks (dozens of clients), ms accuracy (NTP) / basic PTP.',
      pl: 'Dla małych sieci (dziesiątki klientów), dokładność ms (NTP) / podstawowy PTP.',
    },
    defaults: { oscillator: 'TCXO', lan: 1, sfp: 0, power: 'Single', redundantGnss: false },
    note: {
      cs: 'Základní přesnost a kapacita, ideální na okraj sítě.',
      en: 'Basic accuracy and capacity, ideal for network edge.',
      pl: 'Podstawowa dokładność i pojemność, idealne na brzegu sieci.',
    },
  },
  {
    id: 'nts-3000',
    name: 'NTS-3000',
    img: '/img/nts-3000.jpg',
    datasheet:
      'https://www.elpromaelectronics.com/wp-content/uploads/woocommerce_uploads/2023/05/TimeSystems_NTS_3000_120525-tamqzn.pdf',
    tag: {
      cs: 'PTP Grandmaster | NTP Stratum-1',
      en: 'PTP Grandmaster | NTP Stratum-1',
      pl: 'PTP Grandmaster | NTP Stratum-1',
    },
    desc: {
      cs: 'Pro stovky klientů, enterprise PTP (sub-ms až desítky µs). Dual PSU volitelně.',
      en: 'For hundreds of clients, enterprise PTP (sub-ms to tens of µs). Dual PSU optional.',
      pl: 'Dla setek klientów, enterprise PTP (poniżej ms do kilkudziesięciu µs). Podwójny PSU opcjonalny.',
    },
    defaults: { oscillator: 'OCXO', lan: 2, sfp: 0, power: 'Single', redundantGnss: false },
    note: {
      cs: 'Výborný poměr výkon/cena; možnost redundantního PSU.',
      en: 'Great price/performance; optional redundant PSU.',
      pl: 'Świetna relacja cena/wydajność; opcjonalny redundantny PSU.',
    },
  },
  {
    id: 'nts-4000',
    name: 'NTS-4000',
    img: '/img/nts-4000.jpg',
    datasheet:
      'https://www.elpromaelectronics.com/wp-content/uploads/woocommerce_uploads/2023/05/TimeSystems_NTS_4000_120525-t2ham9.pdf',
    tag: {
      cs: 'PTP/PRTC-A | vyšší kapacita',
      en: 'PTP/PRTC-A | higher capacity',
      pl: 'PTP/PRTC-A | większa pojemność',
    },
    desc: {
      cs: 'Pro stovky až tisíce klientů, SFP, redundance, sub-µs. Dual PSU automaticky.',
      en: 'For hundreds to thousands, SFP, redundancy, sub-µs. Dual PSU included.',
      pl: 'Dla setek do tysięcy, SFP, redundancja, poniżej µs. Podwójny PSU w zestawie.',
    },
    defaults: { oscillator: 'OCXO', lan: 4, sfp: 2, power: 'Redundant', redundantGnss: true },
    note: {
      cs: 'Telekom/utility scénáře; vysoká kapacita a spolehlivost.',
      en: 'Telecom/utility scenarios; high capacity and reliability.',
      pl: 'Scenariusze telekom/utility; wysoka pojemność i niezawodność.',
    },
  },
  {
    id: 'nts-5000',
    name: 'NTS-5000',
    img: '/img/nts-5000.jpg',
    datasheet:
      'https://www.elpromaelectronics.com/wp-content/uploads/woocommerce_uploads/2023/05/TimeSystems_NTS_5000_120525-eozbhw.pdf',
    tag: {
      cs: 'ePRTC / PRTC A/B | rubidium',
      en: 'ePRTC / PRTC A/B | rubidium',
      pl: 'ePRTC / PRTC A/B | rubid',
    },
    desc: {
      cs: 'Pro velké/kritické instalace, ePRTC, dlouhý holdover, tisíce klientů. Dual PSU automaticky.',
      en: 'For large/critical installs, ePRTC, long holdover, thousands of clients. Dual PSU included.',
      pl: 'Dla dużych/krytycznych instalacji, ePRTC, długi holdover, tysiące klientów. Podwójny PSU w zestawie.',
    },
    defaults: { oscillator: 'Rb', lan: 6, sfp: 2, power: 'Redundant', redundantGnss: true },
    note: {
      cs: 'Maximální holdover a odolnost; rubidiový oscilátor.',
      en: 'Maximum holdover and resilience; rubidium oscillator.',
      pl: 'Maksymalny holdover i odporność; oscylator rubidowy.',
    },
  },
];

/** ===================== Pomocné ===================== */
function recommendModel(devBand: DevBand, acc: AccuracyId): ModelId {
  if (acc === 'eprtc') return 'nts-5000';
  if (acc === 'ptp_prtc') return devBand === 'xl' ? 'nts-5000' : 'nts-4000';
  if (acc === 'ptp_ent') return devBand === 'large' || devBand === 'xl' ? 'nts-4000' : 'nts-3000';
  // ntp_ms
  if (devBand === 'small') return 'nts-pico3';
  if (devBand === 'medium') return 'nts-3000';
  return 'nts-4000';
}

function encodeConfig(cfg: unknown): string {
  const json = JSON.stringify(cfg);
  // čisto browserové kódování – žádný Node Buffer
  return typeof window !== 'undefined'
    ? window.btoa(unescape(encodeURIComponent(json)))
    : btoa(unescape(encodeURIComponent(json)));
}
function decodeConfig(s: string): any | null {
  try {
    return JSON.parse(decodeURIComponent(escape(atob(s))));
  } catch {
    return null;
  }
}

/** ===================== UI stavebnice ===================== */
function Header({
  lang,
  setLang,
  goHome,
}: {
  lang: Lang;
  setLang: (l: Lang) => void;
  goHome: () => void;
}) {
  return (
    <header className="app-header">
      <button className="brand" onClick={goHome} aria-label="Home">
        <img
          src="https://www.westercom.eu/img/logo-1634110785.jpg"
          alt="Westercom"
          className="brand__logo"
        />
        <span className="brand__title">{t(TXT.brand, lang)}</span>
      </button>

      <label className="lang">
        <span>{t(TXT.langLabel, lang)}:</span>
        <select value={lang} onChange={(e) => setLang(e.target.value as Lang)}>
          <option value="cs">Čeština</option>
          <option value="en">English</option>
          <option value="pl">Polski</option>
        </select>
      </label>
    </header>
  );
}

function Landing({
  lang,
  onStart,
}: {
  lang: Lang;
  onStart: () => void;
}) {
  return (
    <main className="container">
      <div className="heading-row">
        <h1>{t(TXT.heading, lang)}</h1>
        <div className="hint">
          <span>{t(TXT.unsure, lang)}&nbsp;</span>
          <button className="btn-link" onClick={onStart}>
            {t(TXT.start, lang)}
          </button>
        </div>
      </div>

      <section className="grid">
        {MODELS.map((m) => (
          <article key={m.id} className="card">
            <div className="card__media">
              <img src={m.img} alt={m.name} />
            </div>
            <div className="card__body">
              <h3 className="card__title">{m.name}</h3>
              <div className="card__subtitle">{m.tag[lang]}</div>
              <p className="card__text">{m.desc[lang]}</p>
              <div className="card__note">{m.note[lang]}</div>
            </div>
            <div className="card__footer">
              {m.datasheet ? (
                <a className="btn" href={m.datasheet} target="_blank" rel="noreferrer">
                  {t(TXT.datasheet, lang)}
                </a>
              ) : (
                <button className="btn" disabled title="Datasheet bude doplněn">
                  {t(TXT.datasheet, lang)}
                </button>
              )}
            </div>
          </article>
        ))}
      </section>

      <div className="cta-row">
        <button className="btn btn--primary" onClick={onStart}>
          {t(TXT.start, lang)}
        </button>
      </div>
    </main>
  );
}

/** ============ Wizard (4 kroky + logika doplňků) ============ */
function Wizard({
  lang,
  cfg,
  setCfg,
  shareUrl,
  recommended,
  goHome,
}: {
  lang: Lang;
  cfg: Config;
  setCfg: (updater: (prev: Config) => Config) => void;
  shareUrl: string;
  recommended: ModelCard;
  goHome: () => void;
}) {
  const [step, setStep] = useStateSafe(0);

  const summaryText =
    [
      `${recommended.name} — ${recommended.tag[lang]}`,
      `${t(TXT.bands[cfg.devBand], lang)}`,
      `${t(TXT.acc[cfg.accuracy].label, lang)}`,
      `LAN ${cfg.lan} • SFP ${cfg.sfp} • ${cfg.power}${cfg.redundantGnss ? ' • GNSS redundant' : ''}`,
      `PTP: ${cfg.ptpProfile}`,
      cfg.model === 'nts-5000' ? `${t(TXT.accList.ptpPorts.name, lang)}: ${cfg.ptpPortsNts5000}` : '',
      `${cfg.accessories.length ? cfg.accessories.join(', ') : ''}`,
    ]
      .filter(Boolean)
      .join('\n');

  /** Volby pro step 1 */
  const bandOptions: { id: DevBand; label: string }[] = [
    { id: 'small', label: t(TXT.bands.small, lang) },
    { id: 'medium', label: t(TXT.bands.medium, lang) },
    { id: 'large', label: t(TXT.bands.large, lang) },
    { id: 'xl', label: t(TXT.bands.xl, lang) },
  ];

  /** Volby pro step 2 */
  const accOptions: { id: AccuracyId; label: string; help: string }[] = [
    { id: 'ntp_ms', label: t(TXT.acc.ntp_ms.label, lang), help: t(TXT.acc.ntp_ms.help, lang) },
    { id: 'ptp_ent', label: t(TXT.acc.ptp_ent.label, lang), help: t(TXT.acc.ptp_ent.help, lang) },
    { id: 'ptp_prtc', label: t(TXT.acc.ptp_prtc.label, lang), help: t(TXT.acc.ptp_prtc.help, lang) },
    { id: 'eprtc', label: t(TXT.acc.eprtc.label, lang), help: t(TXT.acc.eprtc.help, lang) },
  ];

  /** Doplňky podle modelu & texty */
  const accList = (() => {
    const items: { key: string; name: string; help: string; type: 'check' | 'info' }[] = [];
    // Náhradní anténa
    items.push({
      key: 'NTS-antenna – spare',
      name: t(TXT.accList.antenna.name, lang),
      help: t(TXT.accList.antenna.help, lang),
      type: 'check',
    });
    // IRIG-B
    items.push({
      key: 'IRIG-B IN/OUT module w/ 1PPS',
      name: t(TXT.accList.irig.name, lang),
      help: t(TXT.accList.irig.help, lang),
      type: 'check',
    });
    // Fibre Optic Antenna Set
    items.push({
      key: 'Fibre Optic Antenna Set',
      name: t(TXT.accList.fo.name, lang),
      help: t(TXT.accList.fo.help, lang),
      type: 'check',
    });
    // Dual PSU: jen NTS-3000 jako volitelný; u 4000/5000 info-řádek
    if (cfg.model === 'nts-3000') {
      items.push({
        key: 'Dual Redundant Power Supply',
        name: t(TXT.accList.psu.name, lang),
        help: t(TXT.accList.psu.help, lang),
        type: 'check',
      });
    } else if (cfg.model === 'nts-4000' || cfg.model === 'nts-5000') {
      items.push({
        key: 'Dual PSU included',
        name: t(TXT.accList.psuAuto.name, lang),
        help: t(TXT.accList.psuAuto.help, lang),
        type: 'info',
      });
    }
    // 5071A
    items.push({
      key: '5071A special support (firmware)',
      name: t(TXT.accList.fw5071a.name, lang),
      help: t(TXT.accList.fw5071a.help, lang),
      type: 'check',
    });
    return items;
  })();

  return (
    <main className="container">
      <div className="heading-row">
        <h1>Wizard</h1>
        <div className="hint">
          <button className="btn-link" onClick={goHome}>
            ← {t(TXT.heading, lang)}
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="progress">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={'progress__bar' + (i <= step ? ' is-active' : '')} />
        ))}
      </div>

      {/* Step 1 */}
      {step === 0 && (
        <section className="panel">
          <div className="panel__head">{t(TXT.step1Title, lang)}</div>
          <div className="panel__body two-cols">
            <div>
              {bandOptions.map((b) => (
                <label key={b.id} className="choice">
                  <input
                    type="radio"
                    name="devBand"
                    checked={cfg.devBand === b.id}
                    onChange={() =>
                      setCfg((p) => ({ ...p, devBand: b.id, model: recommendModel(b.id, p.accuracy) }))
                    }
                  />
                  <span>{b.label}</span>
                </label>
              ))}
            </div>
            <div className="help">
              <strong>Info</strong>
              <p>{t(TXT.bands.guide, lang)}</p>
            </div>
          </div>
          <div className="panel__foot">
            <button className="btn btn--primary" onClick={() => setStep(1)}>
              {t(TXT.next, lang)}
            </button>
          </div>
        </section>
      )}

      {/* Step 2 */}
      {step === 1 && (
        <section className="panel">
          <div className="panel__head">{t(TXT.step2Title, lang)}</div>
          <div className="panel__body two-cols">
            <div>
              {accOptions.map((a) => (
                <label key={a.id} className="choice choice--start">
                  <input
                    type="radio"
                    name="acc"
                    checked={cfg.accuracy === a.id}
                    onChange={() =>
                      setCfg((p) => ({ ...p, accuracy: a.id, model: recommendModel(p.devBand, a.id) }))
                    }
                  />
                  <span>
                    <div className="choice__title">{a.label}</div>
                    <div className="choice__help">{a.help}</div>
                  </span>
                </label>
              ))}
            </div>
            <div className="help">
              <strong>Info</strong>
              <p>{t(TXT.acc.explain, lang)}</p>
            </div>
          </div>
          <div className="panel__foot">
            <button className="btn" onClick={() => setStep(0)}>
              {t(TXT.back, lang)}
            </button>
            <button className="btn btn--primary" onClick={() => setStep(2)}>
              {t(TXT.next, lang)}
            </button>
          </div>
        </section>
      )}

      {/* Step 3 */}
      {step === 2 && (
        <section className="panel">
          <div className="panel__head">{t(TXT.step3Title, lang)}</div>
          <div className="panel__body two-cols">
            <div>
              {accList.map((a) =>
                a.type === 'info' ? (
                  <div key={a.key} className="badge">
                    <div className="badge__title">{a.name}</div>
                    <div className="badge__help">{a.help}</div>
                  </div>
                ) : (
                  <label key={a.key} className="choice">
                    <input
                      type="checkbox"
                      checked={cfg.accessories.includes(a.name)}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        setCfg((p) => {
                          const set = new Set(p.accessories);
                          e.target.checked ? set.add(a.name) : set.delete(a.name);
                          // Pokud si uživatel vybere Dual PSU (jen NTS-3000), přepni power na Redundant
                          const power =
                            a.key === 'Dual Redundant Power Supply' && e.target.checked
                              ? 'Redundant'
                              : p.power;
                          return { ...p, accessories: Array.from(set), power };
                        });
                      }}
                    />
                    <span>
                      <div className="choice__title">{a.name}</div>
                      <div className="choice__help">{a.help}</div>
                    </span>
                  </label>
                )
              )}

              {/* PTP ports pro NTS-5000 */}
              {cfg.model === 'nts-5000' && (
                <div className="select-row">
                  <label className="select-row__label">{t(TXT.accList.ptpPorts.name, lang)}</label>
                  <select
                    value={cfg.ptpPortsNts5000}
                    onChange={(e) =>
                      setCfg((p) => ({ ...p, ptpPortsNts5000: Number(e.target.value) as 1 | 2 | 3 | 4 }))
                    }
                  >
                    {[1, 2, 3, 4].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="rec">
              <div className="rec__title">Doporučený model</div>
              <div className="rec__name">{recommended.name}</div>
              <div className="rec__tag">{recommended.tag[lang]}</div>
              <p className="rec__note">{recommended.desc[lang]}</p>
            </div>
          </div>

          <div className="panel__foot">
            <button className="btn" onClick={() => setStep(1)}>
              {t(TXT.back, lang)}
            </button>
            <button className="btn btn--primary" onClick={() => setStep(3)}>
              {t(TXT.next, lang)}
            </button>
          </div>
        </section>
      )}

      {/* Step 4 */}
      {step === 3 && (
        <section className="panel">
          <div className="panel__head">{t(TXT.step4Title, lang)}</div>
          <div className="panel__body two-cols">
            <div>
              <div className="field">
                <label>{t(TXT.company, lang)}</label>
                <input
                  value={cfg.company}
                  onChange={(e) => setCfg((p) => ({ ...p, company: e.target.value }))}
                  placeholder={t(TXT.company, lang)}
                />
              </div>
              <div className="field">
                <label>{t(TXT.contact, lang)}</label>
                <input
                  value={cfg.contact}
                  onChange={(e) => setCfg((p) => ({ ...p, contact: e.target.value }))}
                  placeholder="e-mail / phone"
                />
              </div>
              <div className="field">
                <label>{t(TXT.notes, lang)}</label>
                <textarea
                  rows={4}
                  value={cfg.notes}
                  onChange={(e) => setCfg((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Požadavky, normy, prostředí…"
                />
              </div>
            </div>

            <div>
              <div className="summary">
                <div className="summary__title">{t(TXT.summaryTitle, lang)}</div>
                <pre className="summary__pre">{summaryText}</pre>
              </div>

              <div className="actions">
                <button
                  className="btn btn--primary"
                  onClick={() => navigator.clipboard.writeText(shareUrl)}
                >
                  {t(TXT.copyLink, lang)}
                </button>

                <button
                  className="btn"
                  onClick={() => {
                    const payload = JSON.stringify({ decision: { devBand: cfg.devBand, accuracy: cfg.accuracy }, ...cfg }, null, 2);
                    const blob = new Blob([payload], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${cfg.model}-konfigurace.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  {t(TXT.downloadJson, lang)}
                </button>
              </div>

              <div className="permalink">
                <div className="permalink__title">{t(TXT.permalink, lang)}</div>
                <textarea readOnly value={shareUrl} />
              </div>
            </div>
          </div>

          <div className="panel__foot">
            <button className="btn" onClick={() => setStep(2)}>
              {t(TXT.back, lang)}
            </button>
            <button
              className="btn"
              onClick={() => {
                setStep(0);
                setCfg((p) => ({
                  ...p,
                  accessories: [],
                  company: '',
                  contact: '',
                  notes: '',
                }));
                window.scrollTo(0, 0);
              }}
            >
              {t(TXT.newConfig, lang)}
            </button>
          </div>
        </section>
      )}
    </main>
  );
}

/** ============ Root App ============ */
import { useEffect, useMemo, useState } from 'react';
export default function App() {
  const [lang, setLang] = useState<Lang>('cs');
  const [screen, setScreen] = useState<Screen>('landing');

  // načti z URL, pokud je ?c=
  const [cfg, setCfg] = useState<Config>(() => {
    const c = typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('c')
      : null;
    const dec = c ? decodeConfig(c) : null;
    if (dec) return dec as Config;
    // default
    return {
      model: 'nts-3000',
      devBand: 'medium',
      accuracy: 'ptp_ent',
      oscillator: 'OCXO',
      gnss: ['GNSS'],
      lan: 2,
      sfp: 0,
      power: 'Single',
      redundantGnss: false,
      ptpProfile: 'Default',
      accessories: [],
      ptpPortsNts5000: 1,
      company: '',
      contact: '',
      notes: '',
    };
  });

  // doporučený model & aplikace defaultů při změně výběru
  const recommendedId = useMemo(() => recommendModel(cfg.devBand, cfg.accuracy), [cfg.devBand, cfg.accuracy]);
  const recommended = useMemo(() => MODELS.find((m) => m.id === recommendedId)!, [recommendedId]);

  useEffect(() => {
    const m = MODELS.find((x) => x.id === recommendedId);
    if (!m) return;
    setCfg((p) => ({
      ...p,
      model: m.id,
      oscillator: m.defaults.oscillator,
      lan: m.defaults.lan,
      sfp: m.defaults.sfp,
      power: m.defaults.power,
      redundantGnss: m.defaults.redundantGnss,
      // výchozí PTP porty pro NTS-5000
      ptpPortsNts5000: p.model === 'nts-5000' ? p.ptpPortsNts5000 : 1,
    }));
  }, [recommendedId]);

  // permalink
  const shareUrl = useMemo(() => {
    const base =
      typeof window !== 'undefined'
        ? window.location.origin + window.location.pathname
        : '';
    return `${base}?c=${encodeConfig(cfg)}`;
  }, [cfg]);

  return (
    <div className="app">
      <Header lang={lang} setLang={setLang} goHome={() => setScreen('landing')} />

      {screen === 'landing' ? (
        <Landing lang={lang} onStart={() => setScreen('wizard')} />
      ) : (
        <Wizard
          lang={lang}
          cfg={cfg}
          setCfg={setCfg}
          shareUrl={shareUrl}
          recommended={recommended}
          goHome={() => setScreen('landing')}
        />
      )}

      <footer className="footer">© {new Date().getFullYear()} Westercom • Elproma</footer>
    </div>
  );
}

/** ============ drobný safe useState wrapper pro setStep ============ */
function useStateSafe<T>(initial: T) {
  return useState<T>(initial);
}
