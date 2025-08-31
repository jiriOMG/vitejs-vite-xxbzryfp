import { useEffect, useMemo, useState } from 'react';
import './assets/App.css';

/* =========================================================
   Typy & data
   ======================================================= */

type Lang = 'cs' | 'en' | 'pl';
type Screen = 'landing' | 'wizard';
type DevBand = 'small' | 'medium' | 'large' | 'xl';
type AccuracyId = 'ntp' | 'ptp_ent' | 'ptp_prtc' | 'eprtc';
type ModelId = 'nts-pico3' | 'nts-3000' | 'nts-4000' | 'nts-5000';

type AccessoryId =
  | 'antenna'
  | 'irig'
  | 'fo'
  | '5071a'
  | 'dual_psu'
  | 'dual_psu_auto';

type ModelInfo = {
  id: ModelId;
  name: string;
  header: string;
  img: string;
  datasheet?: string;
  summary: Record<Lang, string>;
};

type I18N = {
  brand: string;
  subtitle: string;
  overview: string;
  unsure: string;
  start: string;
  datasheet: string;
  back: string;
  next: string;
  newConfig: string;
  steps: string[];
  deviceBands: { id: DevBand; label: string }[];
  accuracy: { id: AccuracyId; label: string; hint: string }[];
  accessoriesTitle: string;
  accessories: Record<AccessoryId, { name: string; help: string }>;
  modelAutoDual: string; // věta, že dual PSU je součástí
  modelOptionalDual: string; // věta, že dual PSU je volitelný
  ptpPortsLabel: string;
  ptpPortsHint: string;
};

type Config = {
  model: ModelId;
  devBand: DevBand;
  accuracy: AccuracyId;
  accessories: AccessoryId[];
  // pouze pro NTS-5000 – počet PTP portů (1–4)
  ptpPorts?: number;
};

/* ------------ i18n ------------ */

const I18N: Record<Lang, I18N> = {
  cs: {
    brand: 'Westercom',
    subtitle:
      'Interaktivní průvodce, který pomůže vybrat správný časový server pro vaši infrastrukturu.',
    overview: 'Přehled časových serverů',
    unsure: 'Nejste si jisti?',
    start: 'Spustit konfigurátor',
    datasheet: 'Datasheet',
    back: 'Zpět',
    next: 'Pokračovat',
    newConfig: 'Nová konfigurace',
    steps: ['Zařízení', 'Přesnost', 'Doplňky', 'Export'],
    deviceBands: [
      { id: 'small', label: 'do ~50 zařízení' },
      { id: 'medium', label: '~50–200 zařízení' },
      { id: 'large', label: '~200–1000 zařízení' },
      { id: 'xl', label: '>1000 zařízení' },
    ],
    accuracy: [
      { id: 'ntp', label: 'NTP – milisekundy', hint: 'běžná IT síť, logy, CCTV' },
      {
        id: 'ptp_ent',
        label: 'PTP Enterprise – sub-ms až desítky µs',
        hint: 'datacentra, průmysl, trading edge',
      },
      {
        id: 'ptp_prtc',
        label: 'PTP Telecom/PRTC-A – sub-µs',
        hint: 'telekom/utility, HW timestamping',
      },
      {
        id: 'eprtc',
        label: 'ePRTC / dlouhý holdover',
        hint: 'kritická infrastruktura, rubidium',
      },
    ],
    accessoriesTitle: 'Volitelné doplňky',
    accessories: {
      antenna: {
        name: 'NTS-antenna – náhradní anténa',
        help: '1 ks je již v balení. Náhradní anténa pro GNSS přijímač.',
      },
      irig: {
        name: 'IRIG-B IN/OUT module w/ 1PPS output',
        help: 'Rozhraní IRIG-B pro vstup/výstup, včetně 1PPS signálu.',
      },
      fo: {
        name: 'Fibre Optic Antenna Set',
        help: 'Optická souprava pro připojení GNSS antény na delší vzdálenost.',
      },
      '5071a': {
        name: '5071A special support (firmware)',
        help: 'Firmwarová podpora pro 5071A cesiové etalony.',
      },
      dual_psu: {
        name: 'Dual Redundant Power Supply (jen NTS-3000)',
        help: 'Volitelný redundantní zdroj napájení – pouze pro NTS-3000.',
      },
      dual_psu_auto: {
        name: 'Dual Redundant Power Supply – automaticky součástí',
        help: 'U modelů NTS-4000/5000 je duální napájení součástí standardu.',
      },
    },
    modelAutoDual: 'Duální napájení je součástí (automaticky).',
    modelOptionalDual: 'Duální napájení je volitelné.',
    ptpPortsLabel: 'Počet PTP portů',
    ptpPortsHint: 'Pouze pro NTS-5000 (1 až 4 porty).',
  },
  en: {
    brand: 'Westercom',
    subtitle:
      'An interactive wizard that helps you choose the right time server for your infrastructure.',
    overview: 'Time Servers Overview',
    unsure: 'Not sure?',
    start: 'Start configurator',
    datasheet: 'Datasheet',
    back: 'Back',
    next: 'Next',
    newConfig: 'New configuration',
    steps: ['Devices', 'Accuracy', 'Add-ons', 'Export'],
    deviceBands: [
      { id: 'small', label: 'up to ~50 devices' },
      { id: 'medium', label: '~50–200 devices' },
      { id: 'large', label: '~200–1000 devices' },
      { id: 'xl', label: '>1000 devices' },
    ],
    accuracy: [
      { id: 'ntp', label: 'NTP – milliseconds', hint: 'IT networks, logs, CCTV' },
      {
        id: 'ptp_ent',
        label: 'PTP Enterprise – sub-ms to tens of µs',
        hint: 'datacenters, industry, trading edge',
      },
      {
        id: 'ptp_prtc',
        label: 'PTP Telecom/PRTC-A – sub-µs',
        hint: 'telecom/utility, HW timestamping',
      },
      {
        id: 'eprtc',
        label: 'ePRTC / long holdover',
        hint: 'critical infrastructure, rubidium',
      },
    ],
    accessoriesTitle: 'Optional accessories',
    accessories: {
      antenna: {
        name: 'NTS-antenna – spare antenna',
        help: '1 pc is already included. Spare GNSS antenna.',
      },
      irig: {
        name: 'IRIG-B IN/OUT module w/ 1PPS output',
        help: 'IRIG-B interface for input/output with 1PPS signal.',
      },
      fo: {
        name: 'Fibre Optic Antenna Set',
        help: 'Optical kit for long-distance GNSS antenna connection.',
      },
      '5071a': {
        name: '5071A special support (firmware)',
        help: 'Firmware support for 5071A cesium standards.',
      },
      dual_psu: {
        name: 'Dual Redundant Power Supply (NTS-3000 only)',
        help: 'Optional redundant power supply – only for NTS-3000.',
      },
      dual_psu_auto: {
        name: 'Dual Redundant Power Supply – included',
        help: 'For NTS-4000/5000 dual PSU is included by default.',
      },
    },
    modelAutoDual: 'Dual PSU is included (automatically).',
    modelOptionalDual: 'Dual PSU is optional.',
    ptpPortsLabel: 'Number of PTP ports',
    ptpPortsHint: 'NTS-5000 only (1 to 4 ports).',
  },
  pl: {
    brand: 'Westercom',
    subtitle:
      'Interaktywny kreator, który pomaga wybrać odpowiedni serwer czasu dla Twojej infrastruktury.',
    overview: 'Przegląd serwerów czasu',
    unsure: 'Niepewny?',
    start: 'Uruchom kreator',
    datasheet: 'Karta katalogowa',
    back: 'Wstecz',
    next: 'Dalej',
    newConfig: 'Nowa konfiguracja',
    steps: ['Urządzenia', 'Dokładność', 'Dodatki', 'Eksport'],
    deviceBands: [
      { id: 'small', label: 'do ~50 urządzeń' },
      { id: 'medium', label: '~50–200 urządzeń' },
      { id: 'large', label: '~200–1000 urządzeń' },
      { id: 'xl', label: '>1000 urządzeń' },
    ],
    accuracy: [
      { id: 'ntp', label: 'NTP – milisekundy', hint: 'sieci IT, logi, CCTV' },
      {
        id: 'ptp_ent',
        label: 'PTP Enterprise – sub-ms do dziesiątek µs',
        hint: 'centra danych, przemysł, trading',
      },
      {
        id: 'ptp_prtc',
        label: 'PTP Telecom/PRTC-A – sub-µs',
        hint: 'telekom/utility, HW timestamping',
      },
      {
        id: 'eprtc',
        label: 'ePRTC / długi holdover',
        hint: 'krytyczna infrastruktura, rubid',
      },
    ],
    accessoriesTitle: 'Opcjonalne akcesoria',
    accessories: {
      antenna: {
        name: 'NTS-antenna – antena zapasowa',
        help: '1 szt. już w zestawie. Zapasowa antena GNSS.',
      },
      irig: {
        name: 'IRIG-B IN/OUT module z wyjściem 1PPS',
        help: 'Interfejs IRIG-B dla wejścia/wyjścia z sygnałem 1PPS.',
      },
      fo: {
        name: 'Zestaw światłowodowy anteny',
        help: 'Zestaw optyczny do podłączenia anteny GNSS na większą odległość.',
      },
      '5071a': {
        name: 'Wsparcie 5071A (firmware)',
        help: 'Wsparcie firmware dla standardów cezowych 5071A.',
      },
      dual_psu: {
        name: 'Podwójne zasilanie (tylko NTS-3000)',
        help: 'Opcjonalne redundantne zasilanie – tylko dla NTS-3000.',
      },
      dual_psu_auto: {
        name: 'Podwójne zasilanie – w zestawie',
        help: 'Dla NTS-4000/5000 podwójne zasilanie jest standardem.',
      },
    },
    modelAutoDual: 'Podwójne zasilanie w zestawie (automatycznie).',
    modelOptionalDual: 'Podwójne zasilanie opcjonalne.',
    ptpPortsLabel: 'Liczba portów PTP',
    ptpPortsHint: 'Tylko NTS-5000 (1–4 porty).',
  },
};

/* ------------ Modely ------------ */

const MODELS: ModelInfo[] = [
  {
    id: 'nts-pico3',
    name: 'NTS-PICO3',
    header: 'Kompaktní | NTP/PTP (edge)',
    img: '/img/nts-pico3.jpg',
    // Pokud máš PDF, přidej odkaz; jinak # (ponechá anchor, nic nerozbije)
    datasheet: '#',
    summary: {
      cs: 'Pro malé sítě (desítky klientů), přesnost ms (NTP) / základní PTP.',
      en: 'For small networks (dozens of clients), ms accuracy (NTP) / basic PTP.',
      pl: 'Dla małych sieci (dziesiątki klientów), dokładność ms (NTP) / podstawowy PTP.',
    },
  },
  {
    id: 'nts-3000',
    name: 'NTS-3000',
    header: 'PTP Grandmaster | NTP Stratum-1',
    img: '/img/nts-3000.jpg',
    datasheet:
      'https://www.elpromaelectronics.com/wp-content/uploads/woocommerce_uploads/2023/05/TimeSystems_NTS_3000_120525-tamqzn.pdf',
    summary: {
      cs: 'Pro stovky klientů, enterprise PTP (sub-ms až desítky µs). Duál PSU je volitelný.',
      en: 'For hundreds of clients, enterprise PTP (sub-ms to tens of µs). Dual PSU is optional.',
      pl: 'Dla setek klientów, enterprise PTP (sub-ms do dziesiątek µs). Podwójne zasilanie opcjonalne.',
    },
  },
  {
    id: 'nts-4000',
    name: 'NTS-4000',
    header: 'PTP/PRTC-A | vyšší kapacita',
    img: '/img/nts-4000.jpg',
    datasheet:
      'https://www.elpromaelectronics.com/wp-content/uploads/woocommerce_uploads/2023/05/TimeSystems_NTS_4000_120525-t2ham9.pdf',
    summary: {
      cs: 'Pro stovky až tisíce klientů, SFP, redundance, sub-µs (telekom/utility). Duální napájení je součástí.',
      en: 'For hundreds to thousands of clients, SFP, redundancy, sub-µs (telecom/utility). Dual PSU included.',
      pl: 'Dla setek do tysięcy klientów, SFP, redundancja, sub-µs (telekom/utility). Podwójne zasilanie w zestawie.',
    },
  },
  {
    id: 'nts-5000',
    name: 'NTS-5000',
    header: 'ePRTC / PRTC A/B | rubidium',
    img: '/img/nts-5000.jpg',
    datasheet:
      'https://www.elpromaelectronics.com/wp-content/uploads/woocommerce_uploads/2023/05/TimeSystems_NTS_5000_120525-eozbhw.pdf',
    summary: {
      cs: 'Pro velké/kritické instalace, ePRTC, dlouhý holdover, tisíce klientů. Duální napájení je součástí.',
      en: 'For large/critical deployments, ePRTC, long holdover, thousands of clients. Dual PSU included.',
      pl: 'Dla dużych/krytycznych instalacji, ePRTC, długi holdover, tysiące klientów. Podwójne zasilanie w zestawie.',
    },
  },
];

/* =========================================================
   Pomocné komponenty
   ======================================================= */

function Logo2x2() {
  return (
    <div className="brand">
      <div className="wgrid">
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="brand-txt">Westercom</div>
    </div>
  );
}

function Stepper({ active }: { active: number }) {
  return (
    <div className="progress">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className={`bar ${i <= active ? 'on' : ''}`} />
      ))}
    </div>
  );
}

/* ------------ pravidla doporučení ------------ */
function recommendModel(dev: DevBand, acc: AccuracyId): ModelId {
  if (acc === 'eprtc') return 'nts-5000';
  if (acc === 'ptp_prtc') return dev === 'xl' ? 'nts-5000' : 'nts-4000';
  if (acc === 'ptp_ent') return dev === 'large' || dev === 'xl' ? 'nts-4000' : 'nts-3000';
  // ntp
  if (dev === 'small') return 'nts-pico3';
  if (dev === 'medium') return 'nts-3000';
  return 'nts-4000';
}

/* ------------ bezpečné btoa/atob ------------ */
function enc(obj: unknown): string {
  const json = JSON.stringify(obj);
  return typeof window !== 'undefined'
    ? window.btoa(unescape(encodeURIComponent(json)))
    : Buffer.from(json, 'utf8').toString('base64'); // Node fallback – v prohlížeči se nepoužije
}
function dec<T>(s: string | null): T | null {
  if (!s) return null;
  try {
    const str =
      typeof window !== 'undefined'
        ? decodeURIComponent(escape(window.atob(s)))
        : Buffer.from(s, 'base64').toString('utf8');
    return JSON.parse(str) as T;
  } catch {
    return null;
  }
}

/* =========================================================
   Aplikace
   ======================================================= */

export default function App() {
  const [lang, setLang] = useState<Lang>('cs');
  const T = I18N[lang];

  const [screen, setScreen] = useState<Screen>('landing');
  const [step, setStep] = useState<number>(0);

  const [config, setConfig] = useState<Config>({
    model: 'nts-3000',
    devBand: 'medium',
    accuracy: 'ptp_ent',
    accessories: [],
  });

  // načtení z URL (sdílený odkaz)
  useEffect(() => {
    const c = dec<Config>(new URLSearchParams(window.location.search).get('c'));
    if (c) {
      setConfig(c);
      setScreen('wizard');
    }
  }, []);

  // doporučení modelu + defaulty
  const recommendedId = useMemo(
    () => recommendModel(config.devBand, config.accuracy),
    [config.devBand, config.accuracy]
  );
  const recommendedModel = useMemo(
    () => MODELS.find((m) => m.id === recommendedId)!,
    [recommendedId]
  );

  // pokud je auto dual PSU (4000/5000), zamkni volbu a nastav auto flag
  useEffect(() => {
    setConfig((prev) => {
      const next = { ...prev };
      if (recommendedId === 'nts-4000' || recommendedId === 'nts-5000') {
        // zajisti „dual_psu_auto“ a vyhoď případný „dual_psu“
        next.accessories = [
          ...new Set<AccessoryId>(
            [...prev.accessories.filter((a) => a !== 'dual_psu'), 'dual_psu_auto'] as AccessoryId[]
          ),
        ];
      } else {
        // 3000/pico – auto flag pryč
        next.accessories = prev.accessories.filter((a) => a !== 'dual_psu_auto');
      }
      // NTS-5000 – udrž rozumný ptpPorts
      if (recommendedId !== 'nts-5000') {
        delete next.ptpPorts;
      } else {
        if (!next.ptpPorts) next.ptpPorts = 1;
      }
      next.model = recommendedId;
      return next;
    });
  }, [recommendedId]);

  const shareUrl = useMemo(() => {
    const base = window.location.origin + window.location.pathname;
    return `${base}?c=${enc(config)}`;
  }, [config]);

  /* ---------------- LANDING ---------------- */

  if (screen === 'landing') {
    return (
      <div className="app">
        <header className="top">
          <Logo2x2 />
          <div className="title">
            <div className="name">Elproma NTS konfigurátor časových serverů</div>
            <div className="sub">{T.subtitle}</div>
          </div>
          <div className="lang">
            <label>Jazyk:</label>
            <select value={lang} onChange={(e) => setLang(e.target.value as Lang)}>
              <option value="cs">Čeština</option>
              <option value="en">English</option>
              <option value="pl">Polski</option>
            </select>
          </div>
        </header>

        <main className="container">
          <h2>{T.overview}</h2>
          <p className="muted">
            {T.unsure} <button className="link" onClick={() => setScreen('wizard')}>{T.start}</button>.
          </p>

          <div className="ovgrid">
            {MODELS.map((m) => (
              <section key={m.id} className="card">
                <div className="imgbox">
                  <img src={m.img} alt={m.name} />
                </div>
                <div className="cardbody">
                  <div className="h">{m.name}</div>
                  <div className="muted">{m.header}</div>
                  <p className="desc">{m.summary[lang]}</p>
                  <div className="actions">
                    {m.datasheet && (
                      <a className="btn ghost" href={m.datasheet} target="_blank" rel="noreferrer">
                        {T.datasheet}
                      </a>
                    )}
                  </div>
                </div>
              </section>
            ))}
          </div>

          <div className="center mt24">
            <button className="btn primary" onClick={() => setScreen('wizard')}>
              {T.start}
            </button>
          </div>
        </main>
      </div>
    );
  }

  /* ---------------- WIZARD ---------------- */

  const setDevBand = (id: DevBand) => setConfig((p) => ({ ...p, devBand: id }));
  const setAccuracy = (id: AccuracyId) => setConfig((p) => ({ ...p, accuracy: id }));

  const toggleAccessory = (id: AccessoryId) =>
    setConfig((p) => {
      const s = new Set<AccessoryId>(p.accessories);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return { ...p, accessories: Array.from(s) };
    });

  const A = I18N[lang].accessories;

  return (
    <div className="app">
      <header className="top">
        <Logo2x2 />
        <div className="title">
          <div className="name">Elproma NTS konfigurátor časových serverů</div>
          <div className="sub">{T.subtitle}</div>
        </div>
        <div className="lang">
          <label>Jazyk:</label>
          <select value={lang} onChange={(e) => setLang(e.target.value as Lang)}>
            <option value="cs">Čeština</option>
            <option value="en">English</option>
            <option value="pl">Polski</option>
          </select>
        </div>
      </header>

      <main className="container">
        <Stepper active={step} />

        {/* 1) Devices */}
        {step === 0 && (
          <section className="card">
            <div className="cardhead">
              <b>{T.steps[0]}</b>
            </div>
            <div className="pad grid2">
              <div>
                {T.deviceBands.map((b) => (
                  <label key={b.id} className="opt">
                    <input
                      type="radio"
                      checked={config.devBand === b.id}
                      onChange={() => setDevBand(b.id)}
                    />
                    <span>{b.label}</span>
                  </label>
                ))}
              </div>
              <div className="hint">
                <div className="b">Tip</div>
                <ul>
                  <li>Desítky klientů → NTP / základní PTP (PICO3 / NTS-3000).</li>
                  <li>Stovky až tisíce → výkonnější GM, SFP, redundance (NTS-4000/5000).</li>
                </ul>
              </div>
            </div>
            <div className="footer">
              <button className="btn primary" onClick={() => setStep(1)}>{T.next}</button>
            </div>
          </section>
        )}

        {/* 2) Accuracy */}
        {step === 1 && (
          <section className="card">
            <div className="cardhead">
              <b>{T.steps[1]}</b>
            </div>
            <div className="pad grid2">
              <div>
                {T.accuracy.map((a) => (
                  <label key={a.id} className="opt">
                    <input
                      type="radio"
                      checked={config.accuracy === a.id}
                      onChange={() => setAccuracy(a.id)}
                    />
                    <span>
                      <div className="b">{a.label}</div>
                      <div className="muted small">{a.hint}</div>
                    </span>
                  </label>
                ))}
              </div>
              <div className="box">
                <div className="b">{recommendedModel.name}</div>
                <div className="muted">{recommendedModel.header}</div>
                <p className="muted small">{recommendedModel.summary[lang]}</p>
                <p className="muted small">
                  {recommendedId === 'nts-4000' || recommendedId === 'nts-5000'
                    ? T.modelAutoDual
                    : T.modelOptionalDual}
                </p>
              </div>
            </div>
            <div className="footer">
              <button className="btn ghost" onClick={() => setStep(0)}>{T.back}</button>
              <button className="btn primary" onClick={() => setStep(2)}>{T.next}</button>
            </div>
          </section>
        )}

        {/* 3) Accessories */}
        {step === 2 && (
          <section className="card">
            <div className="cardhead">
              <b>{T.accessoriesTitle}</b>
            </div>

            <div className="pad grid2">
              <div className="vstack">
                {/* Antenna */}
                <label className="opt">
                  <input
                    type="checkbox"
                    checked={config.accessories.includes('antenna')}
                    onChange={() => toggleAccessory('antenna')}
                  />
                  <span>
                    <div className="b">{A.antenna.name}</div>
                    <div className="muted small">{A.antenna.help}</div>
                  </span>
                </label>

                {/* IRIG */}
                <label className="opt">
                  <input
                    type="checkbox"
                    checked={config.accessories.includes('irig')}
                    onChange={() => toggleAccessory('irig')}
                  />
                  <span>
                    <div className="b">{A.irig.name}</div>
                    <div className="muted small">{A.irig.help}</div>
                  </span>
                </label>

                {/* Fibre Optic set */}
                <label className="opt">
                  <input
                    type="checkbox"
                    checked={config.accessories.includes('fo')}
                    onChange={() => toggleAccessory('fo')}
                  />
                  <span>
                    <div className="b">{A.fo.name}</div>
                    <div className="muted small">{A.fo.help}</div>
                  </span>
                </label>

                {/* 5071A */}
                <label className="opt">
                  <input
                    type="checkbox"
                    checked={config.accessories.includes('5071a')}
                    onChange={() => toggleAccessory('5071a')}
                  />
                  <span>
                    <div className="b">{A['5071a'].name}</div>
                    <div className="muted small">{A['5071a'].help}</div>
                  </span>
                </label>

                {/* Dual PSU – optional only for NTS-3000 */}
                <label className={`opt ${recommendedId !== 'nts-3000' ? 'disabled' : ''}`}>
                  <input
                    type="checkbox"
                    disabled={recommendedId !== 'nts-3000'}
                    checked={config.accessories.includes('dual_psu')}
                    onChange={() => toggleAccessory('dual_psu')}
                  />
                  <span>
                    <div className="b">{A.dual_psu.name}</div>
                    <div className="muted small">{A.dual_psu.help}</div>
                  </span>
                </label>

                {/* Dual PSU auto – always ON for 4000/5000 */}
                {(recommendedId === 'nts-4000' || recommendedId === 'nts-5000') && (
                  <label className="opt disabled">
                    <input type="checkbox" checked readOnly />
                    <span>
                      <div className="b">{A.dual_psu_auto.name}</div>
                      <div className="muted small">{A.dual_psu_auto.help}</div>
                    </span>
                  </label>
                )}

                {/* NTS-5000 – PTP ports 1–4 */}
                {recommendedId === 'nts-5000' && (
                  <div className="opt">
                    <span>
                      <div className="b">{T.ptpPortsLabel}</div>
                      <div className="muted small">{T.ptpPortsHint}</div>
                      <div className="mt8">
                        <select
                          value={config.ptpPorts ?? 1}
                          onChange={(e) =>
                            setConfig((p) => ({ ...p, ptpPorts: Number(e.target.value) }))
                          }
                        >
                          {[1, 2, 3, 4].map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                      </div>
                    </span>
                  </div>
                )}
              </div>

              <div className="box">
                <div className="b">{recommendedModel.name}</div>
                <div className="muted">{recommendedModel.header}</div>
                <p className="muted small">{recommendedModel.summary[lang]}</p>
              </div>
            </div>

            <div className="footer">
              <button className="btn ghost" onClick={() => setStep(1)}>{T.back}</button>
              <button className="btn primary" onClick={() => setStep(3)}>{T.next}</button>
            </div>
          </section>
        )}

        {/* 4) Export */}
        {step === 3 && (
          <section className="card">
            <div className="cardhead">
              <b>{T.steps[3]}</b>
            </div>
            <div className="pad grid2">
              <div className="box">
                <div className="b">Permalink</div>
                <textarea className="permalink" readOnly value={shareUrl} />
                <div className="mt8">
                  <button
                    className="btn primary"
                    onClick={() => navigator.clipboard.writeText(shareUrl)}
                  >
                    Kopírovat odkaz
                  </button>
                </div>
              </div>
              <div className="box">
                <div className="b">Shrnutí</div>
                <pre className="sum">
{JSON.stringify(
  {
    decision: { devBand: config.devBand, accuracy: config.accuracy },
    model: recommendedModel.name,
    accessories: config.accessories,
    ptpPorts: config.ptpPorts,
  },
  null,
  2
)}
                </pre>
                <div className="mt8">
                  <button
                    className="btn ghost"
                    onClick={() => {
                      const blob = new Blob(
                        [
                          JSON.stringify(
                            {
                              decision: { devBand: config.devBand, accuracy: config.accuracy },
                              ...config,
                            },
                            null,
                            2
                          ),
                        ],
                        { type: 'application/json' }
                      );
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${recommendedModel.id}-config.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    Stáhnout JSON
                  </button>
                </div>
              </div>
            </div>

            <div className="footer">
              <button className="btn ghost" onClick={() => setStep(2)}>{T.back}</button>
              <button
                className="btn"
                onClick={() => {
                  setStep(0);
                  setScreen('landing');
                  setConfig({
                    model: 'nts-3000',
                    devBand: 'medium',
                    accuracy: 'ptp_ent',
                    accessories: [],
                  });
                }}
              >
                {T.newConfig}
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
