import { useEffect, useMemo, useState } from 'react';
import './App.css';

/* =========================================================
   Typy & i18n
========================================================= */

type Lang = 'cs' | 'en' | 'pl';
type Screen = 'landing' | 'wizard';

type DevBand = 'small' | 'medium' | 'large' | 'xl';
type AccuracyId = 'ntp_ms' | 'ptp_ent' | 'ptp_prtc' | 'eprtc';
type ModelId = 'nts-pico3' | 'nts-3000' | 'nts-4000' | 'nts-5000';

type AccessoryId = 'antenna' | 'irig' | 'fo' | '5071a' | 'dual_psu_auto' | 'dual_psu_3000';
type Accessory = {
  id: AccessoryId;
  label: Record<Lang, string>;
  hint?: Record<Lang, string>;
  disabledFor?: ModelId[];       // kde se nemá ukazovat
  forceFor?: ModelId[];          // kde je automaticky součástí (jen zobrazit popisek)
  onlyFor?: ModelId[];           // kde je jedině možné (dual PSU jen pro 3000)
};

type ModelCard = {
  id: ModelId;
  name: string;
  subtitle: Record<Lang, string>;
  img: string;
  datasheet: string;
  blurb: Record<Lang, string>;
  dualPsuAuto: boolean; // 4000, 5000
};

type Config = {
  model: ModelId;
  devBand: DevBand;
  accuracy: AccuracyId;
  accessories: AccessoryId[];
  ptpPorts5000: 1 | 2 | 3 | 4; // pro NTS-5000
  company: string;
  contact: string;
  notes: string;
  ptpProfile: string;
};

/* =========================================================
   Data
========================================================= */

const i18n: Record<
  Lang,
  {
    brandTitle: string;
    language: string;
    overview: string;
    unsure: string;
    startConfigurator: string;
    datasheet: string;
    // steps
    stepDevices: string;
    stepAccuracy: string;
    stepAccessories: string;
    stepExport: string;
    continue: string;
    back: string;
    newConfig: string;
    guideBox1: string;
    guideBox2: string;
    // devices
    bands: { id: DevBand; label: string }[];
    accuracies: { id: AccuracyId; label: string; help: string }[];
    // accessories section texts
    recommended: string;
    // export
    company: string;
    contact: string;
    notes: string;
    copyLink: string;
    downloadJson: string;
    permalink: string;
    // labels
    ptpPorts: string;
    autoIncluded: string;
  }
> = {
  cs: {
    brandTitle: 'Elproma NTS konfigurátor časových serverů',
    language: 'Jazyk',
    overview: 'Přehled časových serverů',
    unsure: 'Nejste si jisti?',
    startConfigurator: 'Spustit konfigurátor',
    datasheet: 'Datasheet',
    stepDevices: '1) Kolik zařízení potřebujete?',
    stepAccuracy: '2) Požadovaná přesnost',
    stepAccessories: '3) Volitelné doplňky',
    stepExport: '4) Kontakty & export',
    continue: 'Pokračovat',
    back: 'Zpět',
    newConfig: 'Nová konfigurace',
    guideBox1: 'Desítky klientů → NTP / základní PTP (PICO3 / NTS-3000).',
    guideBox2:
      'Stovky až tisíce → výkonnější GM, SFP, redundance (NTS-4000/5000).',
    bands: [
      { id: 'small', label: 'do ~50 zařízení' },
      { id: 'medium', label: '~50–200 zařízení' },
      { id: 'large', label: '~200–1000 zařízení' },
      { id: 'xl', label: '>1000 zařízení' },
    ],
    accuracies: [
      { id: 'ntp_ms', label: 'NTP – milisekundy', help: 'běžná IT síť, logy, servery, CCTV' },
      { id: 'ptp_ent', label: 'PTP Enterprise – sub-ms až desítky µs', help: 'datacentra, průmysl, trading edge' },
      { id: 'ptp_prtc', label: 'PTP Telecom/PRTC-A – sub-µs', help: 'telekom/utility, synchronizace sítí' },
      { id: 'eprtc', label: 'ePRTC / dlouhý holdover', help: 'kritická infrastruktura, rubidium' },
    ],
    recommended: 'Doporučený model',
    company: 'Společnost',
    contact: 'Kontakt',
    notes: 'Poznámky',
    copyLink: 'Zkopírovat odkaz',
    downloadJson: 'Stáhnout JSON',
    permalink: 'Permalink',
    ptpPorts: 'PTP porty (NTS-5000)',
    autoIncluded: 'automaticky součástí',
  },
  en: {
    brandTitle: 'Elproma NTS Time Servers Configurator',
    language: 'Language',
    overview: 'Time Servers Overview',
    unsure: 'Not sure?',
    startConfigurator: 'Start configurator',
    datasheet: 'Datasheet',
    stepDevices: '1) How many devices?',
    stepAccuracy: '2) Required accuracy',
    stepAccessories: '3) Optional accessories',
    stepExport: '4) Contacts & export',
    continue: 'Continue',
    back: 'Back',
    newConfig: 'New configuration',
    guideBox1: 'Dozens → NTP / basic PTP (PICO3 / NTS-3000).',
    guideBox2:
      'Hundreds to thousands → stronger GM, SFP, redundancy (NTS-4000/5000).',
    bands: [
      { id: 'small', label: 'up to ~50 devices' },
      { id: 'medium', label: '~50–200 devices' },
      { id: 'large', label: '~200–1000 devices' },
      { id: 'xl', label: '>1000 devices' },
    ],
    accuracies: [
      { id: 'ntp_ms', label: 'NTP – milliseconds', help: 'typical IT, logs, servers, CCTV' },
      { id: 'ptp_ent', label: 'PTP Enterprise – sub-ms to tens of µs', help: 'datacentres, industry, trading edge' },
      { id: 'ptp_prtc', label: 'PTP Telecom/PRTC-A – sub-µs', help: 'telecom/utility network sync' },
      { id: 'eprtc', label: 'ePRTC / long holdover', help: 'critical infra, rubidium' },
    ],
    recommended: 'Recommended model',
    company: 'Company',
    contact: 'Contact',
    notes: 'Notes',
    copyLink: 'Copy link',
    downloadJson: 'Download JSON',
    permalink: 'Permalink',
    ptpPorts: 'PTP ports (NTS-5000)',
    autoIncluded: 'included automatically',
  },
  pl: {
    brandTitle: 'Konfigurator serwerów czasu Elproma NTS',
    language: 'Język',
    overview: 'Przegląd serwerów czasu',
    unsure: 'Nie pewien?',
    startConfigurator: 'Uruchom konfigurator',
    datasheet: 'Karta katalogowa',
    stepDevices: '1) Ile urządzeń?',
    stepAccuracy: '2) Wymagana dokładność',
    stepAccessories: '3) Akcesoria opcjonalne',
    stepExport: '4) Kontakty i export',
    continue: 'Dalej',
    back: 'Wstecz',
    newConfig: 'Nowa konfiguracja',
    guideBox1: 'Dziesiątki → NTP / podstawowy PTP (PICO3 / NTS-3000).',
    guideBox2:
      'Setki i tysiące → mocniejszy GM, SFP, redundancja (NTS-4000/5000).',
    bands: [
      { id: 'small', label: 'do ~50 urządzeń' },
      { id: 'medium', label: '~50–200 urządzeń' },
      { id: 'large', label: '~200–1000 urządzeń' },
      { id: 'xl', label: '>1000 urządzeń' },
    ],
    accuracies: [
      { id: 'ntp_ms', label: 'NTP – milisekundy', help: 'typowy IT, logi, serwery, CCTV' },
      { id: 'ptp_ent', label: 'PTP Enterprise – sub-ms do dziesiątek µs', help: 'centra danych, przemysł' },
      { id: 'ptp_prtc', label: 'PTP Telecom/PRTC-A – sub-µs', help: 'telekom / utility' },
      { id: 'eprtc', label: 'ePRTC / długi holdover', help: 'krytyczna infrastruktura, rubid' },
    ],
    recommended: 'Model rekomendowany',
    company: 'Firma',
    contact: 'Kontakt',
    notes: 'Uwagi',
    copyLink: 'Kopiuj link',
    downloadJson: 'Pobierz JSON',
    permalink: 'Permalink',
    ptpPorts: 'Porty PTP (NTS-5000)',
    autoIncluded: 'w zestawie automatycznie',
  },
};

const MODELS: ModelCard[] = [
  {
    id: 'nts-pico3',
    name: 'NTS-PICO3',
    subtitle: {
      cs: 'Kompaktní | NTP/PTP (edge)',
      en: 'Compact | NTP/PTP (edge)',
      pl: 'Kompaktowy | NTP/PTP (edge)',
    },
    img: '/img/nts-pico3.jpg',
    datasheet: 'NTS-PICO3', // dle požadavku (placeholder/název)
    blurb: {
      cs: 'Pro malé sítě (desítky klientů), přesnost ms (NTP) / základní PTP.',
      en: 'For small networks (dozens of clients), ms accuracy (NTP) / basic PTP.',
      pl: 'Dla małych sieci (dziesiątki klientów), ms (NTP) / podstawowy PTP.',
    },
    dualPsuAuto: false,
  },
  {
    id: 'nts-3000',
    name: 'NTS-3000',
    subtitle: {
      cs: 'PTP Grandmaster | NTP Stratum-1',
      en: 'PTP Grandmaster | NTP Stratum-1',
      pl: 'PTP Grandmaster | NTP Stratum-1',
    },
    img: '/img/nts-3000.jpg',
    datasheet:
      'https://www.elpromaelectronics.com/wp-content/uploads/woocommerce_uploads/2023/05/TimeSystems_NTS_3000_120525-tamqzn.pdf',
    blurb: {
      cs: 'Pro stovky klientů, enterprise PTP (sub-ms až desítky µs). Dual PSU je volitelný.',
      en: 'For hundreds of clients, enterprise PTP (sub-ms to tens of µs). Dual PSU is optional.',
      pl: 'Dla setek klientów, enterprise PTP (sub-ms do dziesiątek µs). Dual PSU opcjonalnie.',
    },
    dualPsuAuto: false,
  },
  {
    id: 'nts-4000',
    name: 'NTS-4000',
    subtitle: {
      cs: 'PTP/PRTC-A | vyšší kapacita',
      en: 'PTP/PRTC-A | higher capacity',
      pl: 'PTP/PRTC-A | większa wydajność',
    },
    img: '/img/nts-4000.jpg',
    datasheet:
      'https://www.elpromaelectronics.com/wp-content/uploads/woocommerce_uploads/2023/05/TimeSystems_NTS_4000_120525-t2ham9.pdf',
    blurb: {
      cs: 'Pro stovky až tisíce klientů, SFP, redundance, sub-µs (telekom/utility). Dual PSU je součástí (automaticky).',
      en: 'For hundreds to thousands, SFP, redundancy, sub-µs (telecom/utility). Dual PSU included (automatic).',
      pl: 'Dla setek i tysięcy, SFP, redundancja, sub-µs (telekom/utility). Dual PSU w zestawie (auto).',
    },
    dualPsuAuto: true,
  },
  {
    id: 'nts-5000',
    name: 'NTS-5000',
    subtitle: {
      cs: 'ePRTC / PRTC A/B | rubidium',
      en: 'ePRTC / PRTC A/B | rubidium',
      pl: 'ePRTC / PRTC A/B | rubid',
    },
    img: '/img/nts-5000.jpg',
    datasheet:
      'https://www.elpromaelectronics.com/wp-content/uploads/woocommerce_uploads/2023/05/TimeSystems_NTS_5000_120525-eozbhw.pdf',
    blurb: {
      cs: 'Pro velké/kritické instalace, ePRTC, dlouhý holdover, tisíce klientů. Dual PSU je součástí (automaticky).',
      en: 'For large/critical installs, ePRTC, long holdover, thousands of clients. Dual PSU included (automatic).',
      pl: 'Dla dużych/krytycznych instalacji, ePRTC, długi holdover, tysiące klientów. Dual PSU w zestawie (auto).',
    },
    dualPsuAuto: true,
  },
];

const ACCESSORIES: Accessory[] = [
  {
    id: 'antenna',
    label: {
      cs: 'NTS-antenna – náhradní anténa (1 ks je již v balení)',
      en: 'NTS-antenna – spare antenna (1 piece already in the box)',
      pl: 'NTS-antenna – antena zapasowa (1 szt. w zestawie)',
    },
    hint: {
      cs: 'Vhodné jako záloha nebo pro delší trasy s FO setem.',
      en: 'Useful as a spare or with long runs (FO set).',
      pl: 'Przydatna jako zapas lub z długimi trasami (FO set).',
    },
  },
  {
    id: 'irig',
    label: {
      cs: 'IRIG-B IN/OUT module s 1PPS výstupem',
      en: 'IRIG-B IN/OUT module with 1PPS output',
      pl: 'IRIG-B IN/OUT z 1PPS',
    },
    hint: {
      cs: 'Pro časové signály IRIG-B, integrace se staršími systémy.',
      en: 'IRIG-B timing, integration with legacy systems.',
      pl: 'IRIG-B timing, integracja ze starszymi systemami.',
    },
  },
  {
    id: 'fo',
    label: {
      cs: 'Fibre Optic Antenna Set',
      en: 'Fibre Optic Antenna Set',
      pl: 'Fibre Optic Antenna Set',
    },
    hint: {
      cs: 'Optické řešení pro vzdálené/rušené lokality GNSS antény.',
      en: 'Optical solution for remote/noisy GNSS antenna locations.',
      pl: 'Rozwiązanie optyczne do odległych/zakłóconych lokalizacji anten GNSS.',
    },
  },
  {
    id: '5071a',
    label: {
      cs: '5071A special support (firmware)',
      en: '5071A special support (firmware)',
      pl: '5071A special support (firmware)',
    },
    hint: {
      cs: 'Speciální FW podpora (např. integrace s 5071A).',
      en: 'Special FW feature set (e.g. integration with 5071A).',
      pl: 'Specjalne wsparcie FW (np. integracja z 5071A).',
    },
  },
  {
    id: 'dual_psu_auto',
    label: {
      cs: 'Dual Redundant Power Supply — automaticky součástí',
      en: 'Dual Redundant Power Supply — included automatically',
      pl: 'Dual Redundant Power Supply — w zestawie automatycznie',
    },
    forceFor: ['nts-4000', 'nts-5000'],
  },
  {
    id: 'dual_psu_3000',
    label: {
      cs: 'Dual Redundant Power Supply (jen NTS-3000)',
      en: 'Dual Redundant Power Supply (only NTS-3000)',
      pl: 'Dual Redundant Power Supply (tylko NTS-3000)',
    },
    onlyFor: ['nts-3000'],
  },
];

/* =========================================================
   Pomocné funkce (bez Buffer)
========================================================= */

function enc(obj: unknown): string {
  const json = JSON.stringify(obj);
  return (globalThis as any).btoa(unescape(encodeURIComponent(json)));
}

function dec<T>(s: string | null): T | null {
  if (!s) return null;
  try {
    const str = decodeURIComponent(escape((globalThis as any).atob(s)));
    return JSON.parse(str) as T;
  } catch {
    return null;
  }
}

function recommendModel(devBand: DevBand, acc: AccuracyId): ModelId {
  if (acc === 'eprtc') return 'nts-5000';
  if (acc === 'ptp_prtc') return devBand === 'xl' ? 'nts-5000' : 'nts-4000';
  if (acc === 'ptp_ent')
    return devBand === 'large' || devBand === 'xl' ? 'nts-4000' : 'nts-3000';
  if (devBand === 'small') return 'nts-pico3';
  if (devBand === 'medium') return 'nts-3000';
  return 'nts-4000';
}

/* =========================================================
   App
========================================================= */

export default function App() {
  const [lang, setLang] = useState<Lang>('cs');
  const t = i18n[lang];

  const [screen, setScreen] = useState<Screen>('landing');

  const [devBand, setDevBand] = useState<DevBand>('medium');
  const [accuracy, setAccuracy] = useState<AccuracyId>('ptp_ent');

  const [config, setConfig] = useState<Config>({
    model: 'nts-3000',
    devBand: 'medium',
    accuracy: 'ptp_ent',
    accessories: [],
    ptpPorts5000: 2,
    company: '',
    contact: '',
    notes: '',
    ptpProfile: 'Default',
  });

  // načti z URL
  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get('c');
    const decC = dec<Config>(c);
    if (decC) {
      setConfig(decC);
      setScreen('wizard');
    }
  }, []);

  // kdykoli změníš devBand/accuracy → doporuč model + auto PSU
  const recommendedId = useMemo(
    () => recommendModel(devBand, accuracy),
    [devBand, accuracy]
  );

  useEffect(() => {
    const m = MODELS.find((x) => x.id === recommendedId);
    if (!m) return;
    setConfig((prev) => {
      const next: Config = {
        ...prev,
        model: m.id,
        devBand,
        accuracy,
      };
      // držme pravidla pro PSU:
      if (m.dualPsuAuto) {
        // 4000/5000 – jen zobrazit info, nic nepřidávat do výběru
        next.accessories = prev.accessories.filter((a) => a !== 'dual_psu_3000');
      } else {
        // u 3000 může být volitelně
        next.accessories = prev.accessories.filter((a) => a !== 'dual_psu_auto');
      }
      return next;
    });
  }, [recommendedId, devBand, accuracy]);

  const onToggleAcc = (id: AccessoryId, checked: boolean) => {
    setConfig((prev) => {
      const set = new Set(prev.accessories);
      if (checked) set.add(id);
      else set.delete(id);
      return { ...prev, accessories: Array.from(set) };
    });
  };

  const shareUrl = useMemo(() => {
    const base = window.location.origin + window.location.pathname;
    const c = enc(config);
    return `${base}?c=${c}`;
  }, [config]);

  // landing cards
  const cards = useMemo(() => {
    return MODELS.map((m) => ({
      ...m,
      subtitleText: m.subtitle[lang],
      blurbText: m.blurb[lang],
    }));
  }, [lang]);

  const accList = useMemo(() => {
    return ACCESSORIES.filter((a) => {
      if (a.disabledFor?.includes(config.model)) return false;
      if (a.onlyFor && !a.onlyFor.includes(config.model)) return false;
      return true;
    });
  }, [config.model]);

  const dualAutoForModel = MODELS.find((x) => x.id === config.model)?.dualPsuAuto ?? false;

  /* ---------------- rendering helpers ---------------- */

  const LangSelect = () => (
    <select
      className="lang"
      value={lang}
      onChange={(e) => setLang(e.target.value as Lang)}
    >
      <option value="cs">Čeština</option>
      <option value="en">English</option>
      <option value="pl">Polski</option>
    </select>
  );

  const Header = () => (
    <header className="hdr">
      <a className="brand" onClick={() => setScreen('landing')} href="#">
        <span className="brand-tiles" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </span>
        <span className="brand-title">{t.brandTitle}</span>
      </a>
      <div className="hdr-right">
        <label className="lang-label">
          {t.language}:{' '}
          <LangSelect />
        </label>
      </div>
    </header>
  );

  const Landing = () => (
    <div className="container">
      <Header />
      <div className="lead">
        <div className="lead-row">
          <div className="lead-title">{t.overview}</div>
          <div className="lead-actions">
            {t.unsure}{' '}
            <a href="#" onClick={() => setScreen('wizard')}>{t.startConfigurator}</a>.
          </div>
        </div>
      </div>

      <div className="grid">
        {cards.map((m) => (
          <article key={m.id} className="card">
            <div className="card-img">
              <img src={m.img} alt={m.name} />
            </div>
            <div className="card-body">
              <div className="card-title">{m.name}</div>
              <div className="card-sub">{m.subtitleText}</div>
              <p className="card-blurb">{m.blurbText}</p>
            </div>
            <div className="card-actions">
              <a className="btn ghost" href={m.datasheet} target="_blank" rel="noreferrer">
                {t.datasheet}
              </a>
            </div>
          </article>
        ))}
      </div>

      <div className="center">
        <button className="btn primary" onClick={() => setScreen('wizard')}>
          {t.startConfigurator}
        </button>
      </div>
    </div>
  );

  const Wizard = () => (
    <div className="container">
      <Header />

      {/* 1) Devices */}
      <section className="section">
        <div className="section-h">{t.stepDevices}</div>
        <div className="two">
          <div className="col">
            {t.bands.map((b) => (
              <label key={b.id} className="opt">
                <input
                  type="radio"
                  name="devBand"
                  checked={devBand === b.id}
                  onChange={() => setDevBand(b.id)}
                />
                <span>{b.label}</span>
              </label>
            ))}
          </div>
          <div className="col note">
            <div className="note-title">Tip</div>
            <ul>
              <li>{t.guideBox1}</li>
              <li>{t.guideBox2}</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 2) Accuracy */}
      <section className="section">
        <div className="section-h">{t.stepAccuracy}</div>
        <div className="two">
          <div className="col">
            {t.accuracies.map((a) => (
              <label key={a.id} className="opt opt-top">
                <input
                  type="radio"
                  name="acc"
                  checked={accuracy === a.id}
                  onChange={() => setAccuracy(a.id)}
                />
                <span>
                  <div className="opt-title">{a.label}</div>
                  <div className="opt-hint">{a.help}</div>
                </span>
              </label>
            ))}
          </div>
          <div className="col note">
            <div className="note-title">{t.recommended}</div>
            <div className="rec">
              <div className="rec-name">
                {MODELS.find((m) => m.id === recommendedId)?.name}
              </div>
              <div className="rec-sub">
                {MODELS.find((m) => m.id === recommendedId)?.subtitle[lang]}
              </div>
              <p className="rec-txt">
                {
                  MODELS.find((m) => m.id === recommendedId)?.blurb[
                    lang
                  ]
                }
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3) Accessories */}
      <section className="section">
        <div className="section-h">{t.stepAccessories}</div>

        {/* PSU auto info (4000/5000) */}
        {dualAutoForModel && (
          <div className="alert">
            <strong>Dual PSU</strong> — {t.autoIncluded}.
          </div>
        )}

        <div className="two">
          <div className="col">
            {accList.map((a) => {
              const only3000 = a.onlyFor?.includes('nts-3000') ?? false;
              const isAuto = a.forceFor?.includes(config.model) ?? false;
              const checked = config.accessories.includes(a.id);

              // pro dual_psu_auto nikdy neukazovat jako checkbox
              if (a.id === 'dual_psu_auto') return null;

              // pro dual_psu_3000 zobrazit jen u NTS-3000
              if (a.id === 'dual_psu_3000' && config.model !== 'nts-3000')
                return null;

              return (
                <label key={a.id} className="opt opt-top">
                  {!isAuto && (
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => onToggleAcc(a.id, e.target.checked)}
                    />
                  )}
                  <span>
                    <div className="opt-title">
                      {a.label[lang]}
                      {only3000 && ' • NTS-3000'}
                      {isAuto && ` • ${t.autoIncluded}`}
                    </div>
                    {a.hint && <div className="opt-hint">{a.hint[lang]}</div>}
                  </span>
                </label>
              );
            })}
          </div>

          <div className="col">
            {/* PTP ports for NTS-5000 */}
            {config.model === 'nts-5000' && (
              <div className="box">
                <div className="box-h">{t.ptpPorts}</div>
                <div className="row">
                  {[1, 2, 3, 4].map((n) => (
                    <label key={n} className="opt-inline">
                      <input
                        type="radio"
                        name="ptp5000"
                        checked={config.ptpPorts5000 === (n as 1 | 2 | 3 | 4)}
                        onChange={() =>
                          setConfig((prev) => ({
                            ...prev,
                            ptpPorts5000: n as 1 | 2 | 3 | 4,
                          }))
                        }
                      />
                      <span>{n}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="box">
              <div className="box-h">{t.recommended}</div>
              <div className="rec">
                <div className="rec-name">
                  {MODELS.find((m) => m.id === config.model)?.name}
                </div>
                <div className="rec-sub">
                  {MODELS.find((m) => m.id === config.model)?.subtitle[lang]}
                </div>
                <p className="rec-txt">
                  {MODELS.find((m) => m.id === config.model)?.blurb[lang]}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4) Export */}
      <section className="section">
        <div className="section-h">{t.stepExport}</div>

        <div className="two">
          <div className="col">
            <div className="field">
              <label>{t.company}</label>
              <input
                value={config.company}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, company: e.target.value }))
                }
              />
            </div>
            <div className="field">
              <label>{t.contact}</label>
              <input
                value={config.contact}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, contact: e.target.value }))
                }
              />
            </div>
            <div className="field">
              <label>{t.notes}</label>
              <textarea
                rows={4}
                value={config.notes}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, notes: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="col">
            <div className="summary">
              <div className="box-h">Shrnutí</div>
              <pre className="pre">
{`Model: ${config.model}
Zařízení: ${devBand}
Přesnost: ${accuracy}
PTP profil: ${config.ptpProfile}
Doplňky: ${config.accessories.join(', ') || '—'}
${config.model === 'nts-5000' ? `PTP ports: ${config.ptpPorts5000}` : ''}`}
              </pre>
            </div>

            <div className="row g8">
              <button
                className="btn primary"
                onClick={() => navigator.clipboard.writeText(shareUrl)}
              >
                {t.copyLink}
              </button>
              <button
                className="btn ghost"
                onClick={() => {
                  const blob = new Blob([JSON.stringify(config, null, 2)], {
                    type: 'application/json',
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${config.model}-config.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                {t.downloadJson}
              </button>
            </div>

            <div className="permalink">
              <div className="box-h">{t.permalink}</div>
              <div className="link-ellipsis" title={shareUrl}>
                {shareUrl}
              </div>
            </div>

            <div className="row end">
              <button
                className="btn ghost"
                onClick={() => {
                  setDevBand('medium');
                  setAccuracy('ptp_ent');
                  setConfig({
                    model: 'nts-3000',
                    devBand: 'medium',
                    accuracy: 'ptp_ent',
                    accessories: [],
                    ptpPorts5000: 2,
                    company: '',
                    contact: '',
                    notes: '',
                    ptpProfile: 'Default',
                  });
                  setScreen('landing');
                }}
              >
                {t.newConfig}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );

  return screen === 'landing' ? <Landing /> : <Wizard />;
}
