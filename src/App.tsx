import { useEffect, useMemo, useState } from 'react';
import './App.css';

/* ===== Typy ===== */
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
  | 'dual_psu_opt'   // volitelné jen pro NTS-3000
  ;

type Config = {
  model: ModelId;
  devBand: DevBand;
  accuracy: AccuracyId;
  oscillator: 'TCXO' | 'OCXO' | 'Rb';
  lan: number;
  sfp: number;
  power: 'Single' | 'Redundant';
  ptpPorts?: number; // pro NTS-5000 1–4
  accessories: AccessoryId[];
  company: string;
  contact: string;
  notes: string;
  ptpProfile: string;
};

/* ===== Překlady ===== */
const i18n: Record<Lang, Record<string, string>> = {
  cs: {
    appTitle: 'Elproma NTS konfigurátor časových serverů',
    language: 'Jazyk:',
    overview: 'Přehled časových serverů',
    unsure: 'Nejste si jistí?',
    start: 'Spustit konfigurátor',
    datasheet: 'Datasheet',
    step1: '1) Kolik zařízení potřebujete synchronizovat?',
    step2: '2) Požadovaná přesnost',
    step3: '3) Volitelné doplňky',
    step4: '4) Kontakty & export',
    continue: 'Pokračovat',
    back: 'Zpět',
    newCfg: 'Nová konfigurace',
    copyLink: 'Zkopírovat odkaz',
    downloadJson: 'Stáhnout JSON',
    company: 'Společnost',
    contact: 'Kontakt (e-mail / telefon)',
    notes: 'Poznámky',
    permalink: 'Permalink',
    guide: 'Průvodce výběrem',
    // bands
    bSmall: 'do ~50 zařízení',
    bMed: '~50–200 zařízení',
    bLarge: '~200–1000 zařízení',
    bXl: '>1000 zařízení',
    // accuracy
    aNtp: 'NTP – milisekundy',
    aEnt: 'PTP Enterprise – sub-ms až desítky µs',
    aPrtc: 'PTP Telecom/PRTC-A – sub-µs',
    aEprtc: 'ePRTC / dlouhý holdover',
    // accessories
    accAntenna: 'NTS-antenna – náhradní anténa (1 ks je již v balení)',
    accIRIG: 'IRIG-B IN/OUT modul s 1PPS výstupem',
    accFO: 'Fibre Optic Antenna Set',
    acc5071: '5071A special support (firmware)',
    accDualOpt: 'Dual Redundant Power Supply (volitelně, jen NTS-3000)',
    accDualAuto: 'Dual Redundant Power Supply – součástí (automaticky)',
    ptpPorts: 'Počet PTP portů (NTS-5000)',
    // summary
    summary: 'Shrnutí',
  },
  en: {
    appTitle: 'Elproma NTS Time Servers Configurator',
    language: 'Language:',
    overview: 'Time Servers Overview',
    unsure: 'Not sure?',
    start: 'Start configurator',
    datasheet: 'Datasheet',
    step1: '1) How many devices do you need to sync?',
    step2: '2) Required accuracy',
    step3: '3) Optional accessories',
    step4: '4) Contacts & export',
    continue: 'Continue',
    back: 'Back',
    newCfg: 'New configuration',
    copyLink: 'Copy link',
    downloadJson: 'Download JSON',
    company: 'Company',
    contact: 'Contact (e-mail / phone)',
    notes: 'Notes',
    permalink: 'Permalink',
    guide: 'Selection guide',
    bSmall: 'up to ~50 devices',
    bMed: '~50–200 devices',
    bLarge: '~200–1000 devices',
    bXl: '>1000 devices',
    aNtp: 'NTP – milliseconds',
    aEnt: 'PTP Enterprise – sub-ms to tens of µs',
    aPrtc: 'PTP Telecom/PRTC-A – sub-µs',
    aEprtc: 'ePRTC / long holdover',
    accAntenna: 'NTS-antenna – spare antenna (1 pc included)',
    accIRIG: 'IRIG-B IN/OUT module with 1PPS output',
    accFO: 'Fibre Optic Antenna Set',
    acc5071: '5071A special support (firmware)',
    accDualOpt: 'Dual Redundant Power Supply (optional, NTS-3000 only)',
    accDualAuto: 'Dual Redundant Power Supply – included (automatic)',
    ptpPorts: 'Number of PTP ports (NTS-5000)',
    summary: 'Summary',
  },
  pl: {
    appTitle: 'Konfigurator serwerów czasu Elproma NTS',
    language: 'Język:',
    overview: 'Przegląd serwerów czasu',
    unsure: 'Niepewny?',
    start: 'Uruchom konfigurator',
    datasheet: 'Karta katalogowa',
    step1: '1) Ile urządzeń należy synchronizować?',
    step2: '2) Wymagana dokładność',
    step3: '3) Opcjonalne akcesoria',
    step4: '4) Kontakt i eksport',
    continue: 'Dalej',
    back: 'Wstecz',
    newCfg: 'Nowa konfiguracja',
    copyLink: 'Kopiuj link',
    downloadJson: 'Pobierz JSON',
    company: 'Firma',
    contact: 'Kontakt (e-mail / telefon)',
    notes: 'Uwagi',
    permalink: 'Permalink',
    guide: 'Wskazówki wyboru',
    bSmall: 'do ~50 urządzeń',
    bMed: '~50–200 urządzeń',
    bLarge: '~200–1000 urządzeń',
    bXl: '>1000 urządzeń',
    aNtp: 'NTP – milisekundy',
    aEnt: 'PTP Enterprise – sub-ms do dziesiątek µs',
    aPrtc: 'PTP Telecom/PRTC-A – sub-µs',
    aEprtc: 'ePRTC / długi holdover',
    accAntenna: 'NTS-antenna – zapasowa antena (1 szt. w zestawie)',
    accIRIG: 'IRIG-B IN/OUT z wyjściem 1PPS',
    accFO: 'Fibre Optic Antenna Set',
    acc5071: 'Obsługa 5071A (firmware)',
    accDualOpt: 'Podwójne zasilanie (opcjonalne, tylko NTS-3000)',
    accDualAuto: 'Podwójne zasilanie – w zestawie (automatycznie)',
    ptpPorts: 'Liczba portów PTP (NTS-5000)',
    summary: 'Podsumowanie',
  },
};
const useT = (lang: Lang) => (k: string) => i18n[lang][k] ?? k;

/* ===== Data ===== */
const MODELS: {
  id: ModelId;
  name: string;
  segment: string;
  img: string;  // z public/img
  datasheet?: string;
}[] = [
  {
    id: 'nts-pico3',
    name: 'NTS-PICO3',
    segment: 'Kompaktní | NTP/PTP (edge)',
    img: '/img/nts-pico3.jpg',
    // datasheet neuveden – ponecháme bez odkazu
  },
  {
    id: 'nts-3000',
    name: 'NTS-3000',
    segment: 'PTP Grandmaster | NTP Stratum-1',
    img: '/img/nts-3000.jpg',
    datasheet:
      'https://www.elpromaelectronics.com/wp-content/uploads/woocommerce_uploads/2023/05/TimeSystems_NTS_3000_120525-tamqzn.pdf',
  },
  {
    id: 'nts-4000',
    name: 'NTS-4000',
    segment: 'PTP/PRTC-A | vyšší kapacita',
    img: '/img/nts-4000.jpg',
    datasheet:
      'https://www.elpromaelectronics.com/wp-content/uploads/woocommerce_uploads/2023/05/TimeSystems_NTS_4000_120525-t2ham9.pdf',
  },
  {
    id: 'nts-5000',
    name: 'NTS-5000',
    segment: 'ePRTC / PRTC A/B | rubidium',
    img: '/img/nts-5000.jpg',
    datasheet:
      'https://www.elpromaelectronics.com/wp-content/uploads/woocommerce_uploads/2023/05/TimeSystems_NTS_5000_120525-eozbhw.pdf',
  },
];

/* ===== Bezpečné btoa/atob pro prohlížeč ===== */
function encodeConfig(obj: unknown): string {
  try {
    const json = JSON.stringify(obj);
    if (typeof window === 'undefined') return '';
    // btoa s unicode ochranou
    return window.btoa(unescape(encodeURIComponent(json)));
  } catch {
    return '';
  }
}
function decodeConfig<T = unknown>(s: string | null): T | null {
  if (!s || typeof window === 'undefined') return null;
  try {
    const str = decodeURIComponent(escape(window.atob(s)));
    return JSON.parse(str) as T;
  } catch {
    return null;
  }
}

/* ===== Pravidla doporučení ===== */
function recommendModel(dev: DevBand, acc: AccuracyId): ModelId {
  if (acc === 'eprtc') return 'nts-5000';
  if (acc === 'ptp_prtc') return dev === 'xl' ? 'nts-5000' : 'nts-4000';
  if (acc === 'ptp_ent') return dev === 'large' || dev === 'xl' ? 'nts-4000' : 'nts-3000';
  // ntp
  if (dev === 'small') return 'nts-pico3';
  if (dev === 'medium') return 'nts-3000';
  return 'nts-4000';
}

/* ===== UI ===== */
export default function App() {
  const [lang, setLang] = useState<Lang>('cs');
  const t = useT(lang);

  const [screen, setScreen] = useState<Screen>('landing');

  // výchozí konfigurace
  const [cfg, setCfg] = useState<Config>({
    model: 'nts-3000',
    devBand: 'medium',
    accuracy: 'ptp_ent',
    oscillator: 'OCXO',
    lan: 2,
    sfp: 0,
    power: 'Single',
    ptpPorts: 2,
    accessories: [],
    company: '',
    contact: '',
    notes: '',
    ptpProfile: 'Default',
  });

  // načtení z URL
  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get('c');
    const j = decodeConfig<Config>(c);
    if (j) {
      setCfg(j);
      setScreen('wizard');
    }
  }, []);

  const shareUrl = useMemo(() => {
    const base = window.location.origin + window.location.pathname;
    return `${base}?c=${encodeConfig(cfg)}`;
  }, [cfg]);

  // Model vybraný/doporučený
  const recommendedId = useMemo(
    () => recommendModel(cfg.devBand, cfg.accuracy),
    [cfg.devBand, cfg.accuracy]
  );
  const recommended = MODELS.find((m) => m.id === recommendedId)!;

  // Při změně doporučení natlačíme defaulty modelu
  useEffect(() => {
    const m = recommendedId;
    if (m === 'nts-pico3') {
      setCfg((p) => ({
        ...p,
        model: m,
        oscillator: 'TCXO',
        lan: 1,
        sfp: 0,
        power: 'Single',
      }));
    } else if (m === 'nts-3000') {
      setCfg((p) => ({
        ...p,
        model: m,
        oscillator: 'OCXO',
        lan: 2,
        sfp: 0,
        power: p.accessories.includes('dual_psu_opt') ? 'Redundant' : 'Single',
      }));
    } else if (m === 'nts-4000') {
      setCfg((p) => ({ ...p, model: m, oscillator: 'OCXO', lan: 4, sfp: 2, power: 'Redundant' }));
    } else {
      setCfg((p) => ({
        ...p,
        model: m,
        oscillator: 'Rb',
        lan: 6,
        sfp: 2,
        power: 'Redundant',
        ptpPorts: Math.min(Math.max(p.ptpPorts ?? 2, 1), 4),
      }));
    }
  }, [recommendedId]);

  const summaryText = useMemo(() => {
    const lines = [
      `${recommended.name} – ${recommended.segment}`,
      `Zařízení: ${bandLabel(cfg.devBand, lang)}`,
      `Přesnost: ${accuracyLabel(cfg.accuracy, lang)}`,
      `Síť: ${cfg.lan}× LAN, ${cfg.sfp}× SFP`,
      `Napájení: ${cfg.power}${cfg.model !== 'nts-3000' ? ' (duální PSU automaticky)' : ''}`,
      ...(cfg.model === 'nts-5000' ? [`PTP porty: ${cfg.ptpPorts}`] : []),
      `PTP profil: ${cfg.ptpProfile}`,
      `Doplňky: ${
        cfg.accessories.length
          ? cfg.accessories.map((a) => accessoryLabel(a, lang)).join(', ')
          : '—'
      }`,
    ];
    return lines.join('\n');
  }, [cfg, recommended, lang]);

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <a
          href="#"
          className="brand"
          onClick={(e) => {
            e.preventDefault();
            setScreen('landing');
            window.scrollTo(0, 0);
          }}
          title="Westercom"
        >
          <img
            className="brand__logo"
            src="https://www.westercom.eu/img/logo-1634110785.jpg"
            alt="Westercom"
            loading="eager"
            decoding="async"
          />
          <span className="brand__title">{t('appTitle')}</span>
        </a>

        <div className="lang">
          <label>{t('language')}</label>
          <select value={lang} onChange={(e) => setLang(e.target.value as Lang)}>
            <option value="cs">Čeština</option>
            <option value="en">English</option>
            <option value="pl">Polski</option>
          </select>
        </div>
      </header>

      <main className="container">
        {screen === 'landing' ? (
          <Landing t={t} onStart={() => setScreen('wizard')} />
        ) : (
       <Wizard
  t={t}
  cfg={cfg}
  setCfg={setCfg}
  recommended={recommended}
  shareUrl={shareUrl}
  summaryText={summaryText}
  onBackToLanding={() => {
    setScreen('landing');
    window.scrollTo(0, 0);
  }}
/>
        )}
      </main>
    </div>
  );
}

/* ===== Komponenty ===== */

function Landing({
  t,
  onStart,
}: {
  t: (k: string) => string;
  onStart: () => void;
}) {
  return (
    <>
      <h2 className="page-title">{t('overview')}</h2>
      <p className="muted">
        {t('unsure')} <button className="btn-link" onClick={onStart}>{t('start')}</button>.
      </p>

      <div className="landing-grid">{MODELS.map((m) => <Card key={m.id} t={t} m={m} />)}</div>
    </>
  );
}

function Card({
  t,
  m,
}: {
  t: (k: string) => string;
  m: (typeof MODELS)[number];
}) {
  return (
    <section className="card">
      <div className="card__img">
        <img src={m.img} alt={m.name} />
      </div>
      <div className="card__body">
        <div className="card__title">{m.name}</div>
        <div className="card__sub">{m.segment}</div>
        {m.datasheet && (
          <a className="btn" href={m.datasheet} target="_blank" rel="noreferrer">
            {t('datasheet')}
          </a>
        )}
      </div>
    </section>
  );
}

function Wizard({
  t,
  cfg,
  setCfg,
  recommended,
  shareUrl,
  summaryText,
  onBackToLanding,
}: {
  t: (k: string) => string;
  cfg: Config;
  setCfg: (u: (p: Config) => Config) => void;
  recommended: (typeof MODELS)[number];
  shareUrl: string;
  summaryText: string;
  onBackToLanding: () => void;
}) {
  const [step, setStep] = useState(0);

  return (
    <>
      {/* Progress */}
      <div className="progress">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`progress__bar ${i <= step ? 'is-active' : ''}`} />
        ))}
      </div>

      {/* Step 1 – bands */}
      {step === 0 && (
        <section className="panel">
          <div className="panel__head"><b>{t('step1')}</b></div>
          <div className="panel__body two-cols">
            <div>
              {(['small','medium','large','xl'] as DevBand[]).map(b => (
                <label key={b} className="option">
                  <input
                    type="radio"
                    name="band"
                    checked={cfg.devBand === b}
                    onChange={() => setCfg((p) => ({ ...p, devBand: b }))}
                  />
                  <span>{bandLabel(b,'cs')}</span>
                </label>
              ))}
            </div>
            <aside className="hint">
              <div className="hint__title">{t('guide')}</div>
              <ul>
                <li>Desítky klientů → NTP / základní PTP (PICO3 / NTS-3000).</li>
                <li>Stovky až tisíce → výkonnější GM, SFP, redundance (NTS-4000/5000).</li>
              </ul>
            </aside>
          </div>
          <div className="panel__foot">
            <button className="btn btn-primary" onClick={() => setStep(1)}>
              {t('continue')}
            </button>
          </div>
        </section>
      )}

      {/* Step 2 – accuracy */}
      {step === 1 && (
        <section className="panel">
          <div className="panel__head"><b>{t('step2')}</b></div>
          <div className="panel__body two-cols">
            <div>
              {(['ntp','ptp_ent','ptp_prtc','eprtc'] as AccuracyId[]).map(a => (
                <label key={a} className="option">
                  <input
                    type="radio"
                    name="acc"
                    checked={cfg.accuracy === a}
                    onChange={() => setCfg((p) => ({ ...p, accuracy: a }))}
                  />
                  <span>{accuracyLabel(a,'cs')}</span>
                </label>
              ))}
            </div>
            <aside className="hint">
              <p><b>NTP</b>: typicky ms – pro běžné IT a logování.</p>
              <p><b>PTP Enterprise</b>: sub-ms až desítky µs (záleží na síti/HW).</p>
              <p><b>PTP Telecom/PRTC-A</b>: sub-µs v dobře navržené síti.</p>
              <p><b>ePRTC</b>: rubidium, velmi dlouhý holdover.</p>
            </aside>
          </div>
          <div className="panel__foot">
            <button className="btn" onClick={() => setStep(0)}>{t('back')}</button>
            <button className="btn btn-primary" onClick={() => setStep(2)}>
              {t('continue')}
            </button>
          </div>
        </section>
      )}

      {/* Step 3 – accessories */}
      {step === 2 && (
        <section className="panel">
          <div className="panel__head"><b>{t('step3')}</b></div>
          <div className="panel__body two-cols">
            <div className="stack">
              {/* volby doplňků */}
              {(['antenna','irig','fo','5071a'] as AccessoryId[]).map(id => (
                <label key={id} className="option">
                  <input
                    type="checkbox"
                    checked={cfg.accessories.includes(id)}
                    onChange={(e) =>
                      setCfg((p) => {
                        const set = new Set(p.accessories);
                        e.target.checked ? set.add(id) : set.delete(id);
                        return { ...p, accessories: Array.from(set) };
                      })
                    }
                  />
                  <span>{accessoryLabel(id, 'cs')}</span>
                </label>
              ))}

              {/* Dual PSU – volitelné jen pro NTS-3000 */}
              <label className={`option ${cfg.model !== 'nts-3000' ? 'is-disabled' : ''}`}>
                <input
                  type="checkbox"
                  disabled={cfg.model !== 'nts-3000'}
                  checked={cfg.model === 'nts-3000' && cfg.accessories.includes('dual_psu_opt')}
                  onChange={(e) =>
                    setCfg((p) => {
                      if (p.model !== 'nts-3000') return p;
                      const set = new Set(p.accessories);
                      e.target.checked ? set.add('dual_psu_opt') : set.delete('dual_psu_opt');
                      return { ...p, power: e.target.checked ? 'Redundant' : 'Single', accessories: Array.from(set) };
                    })
                  }
                />
                <span>
                  {cfg.model === 'nts-3000' ? i18n.cs.accDualOpt : i18n.cs.accDualAuto}
                </span>
              </label>

              {/* NTS-5000 – počet PTP portů */}
              {cfg.model === 'nts-5000' && (
                <label className="option">
                  <span style={{marginRight:12}}>{i18n.cs.ptpPorts}:</span>
                  <select
                    value={cfg.ptpPorts}
                    onChange={(e) => setCfg((p) => ({ ...p, ptpPorts: Number(e.target.value) }))}
                  >
                    {[1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </label>
              )}
            </div>

            <aside className="hint">
              <div className="hint__title">Doporučený model</div>
              <div className="rec">{recommended.name}</div>
              <div className="muted">{recommended.segment}</div>
              <p className="muted" style={{marginTop:8}}>
                {recommended.id === 'nts-4000' || recommended.id === 'nts-5000'
                  ? 'Duální napájení je součástí (automaticky).'
                  : 'U NTS-3000 je duální PSU volitelné.'}
              </p>
            </aside>
          </div>
          <div className="panel__foot">
            <button className="btn" onClick={() => setStep(1)}>{t('back')}</button>
            <button className="btn btn-primary" onClick={() => setStep(3)}>
              {t('continue')}
            </button>
          </div>
        </section>
      )}

      {/* Step 4 – contacts & export */}
      {step === 3 && (
        <section className="panel">
          <div className="panel__head"><b>{t('step4')}</b></div>
          <div className="panel__body two-cols">
            <div className="stack">
              <label className="field">
                <span>{t('company')}</span>
                <input
                  value={cfg.company}
                  onChange={(e) => setCfg((p) => ({ ...p, company: e.target.value }))}
                  placeholder="Název společnosti"
                />
              </label>
              <label className="field">
                <span>{t('contact')}</span>
                <input
                  value={cfg.contact}
                  onChange={(e) => setCfg((p) => ({ ...p, contact: e.target.value }))}
                  placeholder="E-mail / telefon"
                />
              </label>
              <label className="field">
                <span>{t('notes')}</span>
                <textarea
                  rows={4}
                  value={cfg.notes}
                  onChange={(e) => setCfg((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Požadavky, normy, prostředí…"
                />
              </label>
            </div>

            <aside className="hint">
              <div className="hint__title">{t('summary')}</div>
              <pre className="summary">{summaryText}</pre>

              <div className="row">
                <button
                  className="btn btn-primary"
                  onClick={() => navigator.clipboard.writeText(shareUrl)}
                >
                  {t('copyLink')}
                </button>
                <button
                  className="btn"
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(cfg, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${cfg.model}-konfigurace.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  {t('downloadJson')}
                </button>
              </div>

              <div className="field" style={{marginTop:8}}>
                <span>{t('permalink')}</span>
                <textarea className="permalink" readOnly value={shareUrl} rows={3} />
              </div>
            </aside>
          </div>
          <div className="panel__foot">
            <button className="btn" onClick={() => setStep(2)}>{t('back')}</button>
            <button
              className="btn"
              onClick={() => {
                onBackToLanding();
                setCfg((p) => ({
                  ...p,
                  accessories: [],
                  company: '',
                  contact: '',
                  notes: '',
                }));
              }}
            >
              {t('newCfg')}
            </button>
          </div>
        </section>
      )}
    </>
  );
}

/* ===== Pomocné labely ===== */
function bandLabel(b: DevBand, lang: Lang) {
  const m = {
    small: i18n[lang].bSmall,
    medium: i18n[lang].bMed,
    large: i18n[lang].bLarge,
    xl: i18n[lang].bXl,
  };
  return m[b];
}
function accuracyLabel(a: AccuracyId, lang: Lang) {
  const m = {
    ntp: i18n[lang].aNtp,
    ptp_ent: i18n[lang].aEnt,
    ptp_prtc: i18n[lang].aPrtc,
    eprtc: i18n[lang].aEprtc,
  };
  return m[a];
}
function accessoryLabel(id: AccessoryId, lang: Lang) {
  const map: Record<AccessoryId, string> = {
    antenna: i18n[lang].accAntenna,
    irig: i18n[lang].accIRIG,
    fo: i18n[lang].accFO,
    '5071a': i18n[lang].acc5071,
    dual_psu_opt: i18n[lang].accDualOpt,
  };
  return map[id];
}
