import { useEffect, useMemo, useState } from 'react';
import './App.css';

/* =========================================================
   Typy a data
========================================================= */
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
  | 'dual_psu'        // volitelné pouze pro 3000
  | 'dual_psu_auto';  // automaticky u 4000/5000

type Model = {
  id: ModelId;
  image: string;           // /img/xxx.jpg
  name: string;            // krátký title na kartě
  segment: string;         // podtitul
  summary: string;         // krátký popis na kartě
  datasheet: string;
};

type ModelsByLang = Record<Lang, Record<ModelId, Model>>;
type TMap = Record<Lang, Record<string, string>>;

const MODELS: ModelsByLang = {
  cs: {
    'nts-pico3': {
      id: 'nts-pico3',
      image: '/img/nts-pico3.jpg',
      name: 'NTS-PICO3',
      segment: 'Kompaktní | NTP/PTP (edge)',
      summary: 'Pro malé sítě (desítky klientů), přesnost ms (NTP) / základní PTP.',
      datasheet: 'NTS-PICO3', // zadal jsi pouze název, ponechávám jako placeholder
    },
    'nts-3000': {
      id: 'nts-3000',
      image: '/img/nts-3000.jpg',
      name: 'NTS-3000',
      segment: 'PTP Grandmaster | NTP Stratum-1',
      summary: 'Pro stovky klientů, enterprise PTP (sub-ms až desítky µs). Dual PSU je volitelný.',
      datasheet: 'https://www.elpromaelectronics.com/wp-content/uploads/woocommerce_uploads/2023/05/TimeSystems_NTS_3000_120525-tamqzn.pdf',
    },
    'nts-4000': {
      id: 'nts-4000',
      image: '/img/nts-4000.jpg',
      name: 'NTS-4000',
      segment: 'PTP/PRTC-A | vyšší kapacita',
      summary: 'Pro stovky až tisíce klientů, SFP, redundance, sub-µs (telekom/utility). Dual PSU je součástí (automaticky).',
      datasheet: 'https://www.elpromaelectronics.com/wp-content/uploads/woocommerce_uploads/2023/05/TimeSystems_NTS_4000_120525-t2ham9.pdf',
    },
    'nts-5000': {
      id: 'nts-5000',
      image: '/img/nts-5000.jpg',
      name: 'NTS-5000',
      segment: 'ePRTC / PRTC A/B | rubidium',
      summary: 'Pro velké/kritické instalace, ePRTC, dlouhý holdover, tisíce klientů. Dual PSU je součástí (automaticky).',
      datasheet: 'https://www.elpromaelectronics.com/wp-content/uploads/woocommerce_uploads/2023/05/TimeSystems_NTS_5000_120525-eozbhw.pdf',
    },
  },
  en: {
    'nts-pico3': {
      id: 'nts-pico3',
      image: '/img/nts-pico3.jpg',
      name: 'NTS-PICO3',
      segment: 'Compact | NTP/PTP (edge)',
      summary: 'For small networks (dozens of clients), ms accuracy (NTP) / basic PTP.',
      datasheet: 'NTS-PICO3',
    },
    'nts-3000': {
      id: 'nts-3000',
      image: '/img/nts-3000.jpg',
      name: 'NTS-3000',
      segment: 'PTP Grandmaster | NTP Stratum-1',
      summary: 'For hundreds of clients, enterprise PTP (sub-ms to tens of µs). Dual PSU is optional.',
      datasheet: 'https://www.elpromaelectronics.com/wp-content/uploads/woocommerce_uploads/2023/05/TimeSystems_NTS_3000_120525-tamqzn.pdf',
    },
    'nts-4000': {
      id: 'nts-4000',
      image: '/img/nts-4000.jpg',
      name: 'NTS-4000',
      segment: 'PTP/PRTC-A | higher capacity',
      summary: 'For hundreds to thousands of clients, SFP, redundancy, sub-µs (telecom/utility). Dual PSU included automatically.',
      datasheet: 'https://www.elpromaelectronics.com/wp-content/uploads/woocommerce_uploads/2023/05/TimeSystems_NTS_4000_120525-t2ham9.pdf',
    },
    'nts-5000': {
      id: 'nts-5000',
      image: '/img/nts-5000.jpg',
      name: 'NTS-5000',
      segment: 'ePRTC / PRTC A/B | rubidium',
      summary: 'For large/critical sites, ePRTC, long holdover, thousands of clients. Dual PSU included automatically.',
      datasheet: 'https://www.elpromaelectronics.com/wp-content/uploads/woocommerce_uploads/2023/05/TimeSystems_NTS_5000_120525-eozbhw.pdf',
    },
  },
  pl: {
    'nts-pico3': {
      id: 'nts-pico3',
      image: '/img/nts-pico3.jpg',
      name: 'NTS-PICO3',
      segment: 'Kompaktowy | NTP/PTP (edge)',
      summary: 'Dla małych sieci (dziesiątki klientów), dokładność ms (NTP) / podstawowy PTP.',
      datasheet: 'NTS-PICO3',
    },
    'nts-3000': {
      id: 'nts-3000',
      image: '/img/nts-3000.jpg',
      name: 'NTS-3000',
      segment: 'PTP Grandmaster | NTP Stratum-1',
      summary: 'Dla setek klientów, PTP enterprise (sub-ms do kilkudziesięciu µs). Podwójny PSU opcjonalnie.',
      datasheet: 'https://www.elpromaelectronics.com/wp-content/uploads/woocommerce_uploads/2023/05/TimeSystems_NTS_3000_120525-tamqzn.pdf',
    },
    'nts-4000': {
      id: 'nts-4000',
      image: '/img/nts-4000.jpg',
      name: 'NTS-4000',
      segment: 'PTP/PRTC-A | większa wydajność',
      summary: 'Dla setek/tysięcy klientów, SFP, redundancja, sub-µs (telekom/utility). Podwójny PSU w zestawie (automatycznie).',
      datasheet: 'https://www.elpromaelectronics.com/wp-content/uploads/woocommerce_uploads/2023/05/TimeSystems_NTS_4000_120525-t2ham9.pdf',
    },
    'nts-5000': {
      id: 'nts-5000',
      image: '/img/nts-5000.jpg',
      name: 'NTS-5000',
      segment: 'ePRTC / PRTC A/B | rubid',
      summary: 'Dla dużych/krytycznych instalacji, ePRTC, długi holdover, tysiące klientów. Podwójny PSU w zestawie (automatycznie).',
      datasheet: 'https://www.elpromaelectronics.com/wp-content/uploads/woocommerce_uploads/2023/05/TimeSystems_NTS_5000_120525-eozbhw.pdf',
    },
  },
};

const T: TMap = {
  cs: {
    brandTitle: 'Elproma NTS konfigurátor časových serverů',
    language: 'Jazyk',
    overview: 'Přehled časových serverů',
    unsure: 'Nejste si jisti?',
    start: 'Spustit konfigurátor',
    datasheet: 'Datasheet',
    step1: '1) Kolik zařízení potřebujete synchronizovat?',
    step2: '2) Požadovaná přesnost',
    step3: '3) Volitelné doplňky',
    step4: '4) Kontakty & export',
    back: 'Zpět',
    next: 'Pokračovat',
    copyLink: 'Zkopírovat odkaz',
    downloadJson: 'Stáhnout JSON',
    permalink: 'Permalink',
    company: 'Společnost',
    contact: 'Kontakt',
    notes: 'Poznámky',
    summary: 'Shrnutí',
    deviceBands: 'do ~50 / ~50–200 / ~200–1000 / >1000 zařízení',
    dev_small: 'do ~50 zařízení',
    dev_med: '~50–200 zařízení',
    dev_large: '~200–1000 zařízení',
    dev_xl: '>1000 zařízení',
    acc_ntp: 'NTP – milisekundy',
    acc_ptp_ent: 'PTP Enterprise – sub-ms až desítky µs',
    acc_ptp_prtc: 'PTP Telecom/PRTC-A – sub-µs',
    acc_eprtc: 'ePRTC / dlouhý holdover',
    // accessories
    a_antenna: 'NTS-antenna – náhradní anténa (1 ks je již v balení)',
    a_irig: 'IRIG-B IN/OUT modul s 1PPS výstupem',
    a_fo: 'Fibre Optic Antenna Set (opto-vlákno k anténě)',
    a_5071a: '5071A special support (firmware)',
    a_dualpsu: 'Dual Redundant Power Supply (jen NTS-3000)',
    a_dualpsu_auto: 'Dual Redundant Power Supply (automaticky součástí)',
    ptpPorts: 'Počet PTP portů (NTS-5000)',
    newConfig: 'Nová konfigurace',
    footer: '© Konfigurátor – rozhodovací průvodce.',
  },
  en: {
    brandTitle: 'Elproma NTS Time Servers Configurator',
    language: 'Language',
    overview: 'Time Servers Overview',
    unsure: 'Not sure?',
    start: 'Start configurator',
    datasheet: 'Datasheet',
    step1: '1) How many devices to synchronize?',
    step2: '2) Required accuracy',
    step3: '3) Optional accessories',
    step4: '4) Contacts & export',
    back: 'Back',
    next: 'Next',
    copyLink: 'Copy link',
    downloadJson: 'Download JSON',
    permalink: 'Permalink',
    company: 'Company',
    contact: 'Contact',
    notes: 'Notes',
    summary: 'Summary',
    deviceBands: 'up to ~50 / ~50–200 / ~200–1000 / >1000 devices',
    dev_small: 'up to ~50 devices',
    dev_med: '~50–200 devices',
    dev_large: '~200–1000 devices',
    dev_xl: '>1000 devices',
    acc_ntp: 'NTP – milliseconds',
    acc_ptp_ent: 'PTP Enterprise – sub-ms to tens of µs',
    acc_ptp_prtc: 'PTP Telecom/PRTC-A – sub-µs',
    acc_eprtc: 'ePRTC / long holdover',
    a_antenna: 'NTS-antenna – spare antenna (1 pc already included)',
    a_irig: 'IRIG-B IN/OUT module w/ 1PPS output',
    a_fo: 'Fibre Optic Antenna Set (optical feed to antenna)',
    a_5071a: '5071A special support (firmware)',
    a_dualpsu: 'Dual Redundant Power Supply (NTS-3000 only)',
    a_dualpsu_auto: 'Dual Redundant Power Supply (included automatically)',
    ptpPorts: 'Number of PTP ports (NTS-5000)',
    newConfig: 'New configuration',
    footer: '© Configurator – decision helper.',
  },
  pl: {
    brandTitle: 'Konfigurator serwerów czasu Elproma NTS',
    language: 'Język',
    overview: 'Przegląd serwerów czasu',
    unsure: 'Nie wiesz?',
    start: 'Uruchom konfigurator',
    datasheet: 'Datasheet',
    step1: '1) Ile urządzeń synchronizować?',
    step2: '2) Wymagana dokładność',
    step3: '3) Akcesoria opcjonalne',
    step4: '4) Kontakt i eksport',
    back: 'Wstecz',
    next: 'Dalej',
    copyLink: 'Kopiuj link',
    downloadJson: 'Pobierz JSON',
    permalink: 'Permalink',
    company: 'Firma',
    contact: 'Kontakt',
    notes: 'Uwagi',
    summary: 'Podsumowanie',
    deviceBands: 'do ~50 / ~50–200 / ~200–1000 / >1000 urządzeń',
    dev_small: 'do ~50 urządzeń',
    dev_med: '~50–200 urządzeń',
    dev_large: '~200–1000 urządzeń',
    dev_xl: '>1000 urządzeń',
    acc_ntp: 'NTP – milisekundy',
    acc_ptp_ent: 'PTP Enterprise – sub-ms do dziesiątek µs',
    acc_ptp_prtc: 'PTP Telecom/PRTC-A – sub-µs',
    acc_eprtc: 'ePRTC / długi holdover',
    a_antenna: 'NTS-antenna – antena zapasowa (1 szt. w zestawie)',
    a_irig: 'IRIG-B IN/OUT moduł z wyjściem 1PPS',
    a_fo: 'Fibre Optic Antenna Set (połączenie optyczne do anteny)',
    a_5071a: '5071A specjalne wsparcie (firmware)',
    a_dualpsu: 'Dual Redundant Power Supply (tylko NTS-3000)',
    a_dualpsu_auto: 'Dual Redundant Power Supply (w zestawie)',
    ptpPorts: 'Liczba portów PTP (NTS-5000)',
    newConfig: 'Nowa konfiguracja',
    footer: '© Konfigurator – przewodnik decyzyjny.',
  },
};

const DEVICE_BANDS: Record<DevBand, keyof TMap['cs']> = {
  small: 'dev_small',
  medium: 'dev_med',
  large: 'dev_large',
  xl: 'dev_xl',
};

const ACCURACY_LABELS: Record<AccuracyId, keyof TMap['cs']> = {
  ntp: 'acc_ntp',
  ptp_ent: 'acc_ptp_ent',
  ptp_prtc: 'acc_ptp_prtc',
  eprtc: 'acc_eprtc',
};

/* =========================================================
   Pomocné funkce
========================================================= */
const t = (lang: Lang, key: keyof TMap['cs']): string => T[lang][key];

function recommendModel(dev: DevBand, acc: AccuracyId): ModelId {
  if (acc === 'eprtc') return 'nts-5000';
  if (acc === 'ptp_prtc') return dev === 'xl' ? 'nts-5000' : 'nts-4000';
  if (acc === 'ptp_ent') return dev === 'large' || dev === 'xl' ? 'nts-4000' : 'nts-3000';
  // ntp
  if (dev === 'small') return 'nts-pico3';
  if (dev === 'medium') return 'nts-3000';
  return 'nts-4000';
}

function encodeConfig(obj: unknown): string {
  try {
    const json = JSON.stringify(obj);
    // čistě browserové btoa/atob, bez Bufferu
    return typeof window !== 'undefined'
      ? window.btoa(unescape(encodeURIComponent(json)))
      : btoa(unescape(encodeURIComponent(json)));
  } catch {
    return '';
  }
}
function decodeConfig<T>(s: string | null): T | null {
  if (!s) return null;
  try {
    const json = decodeURIComponent(escape(atob(s)));
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

/* =========================================================
   App
========================================================= */
export default function App() {
  const [lang, setLang] = useState<Lang>('cs');
  const [screen, setScreen] = useState<Screen>('landing');

  // wizard state
  const [step, setStep] = useState<number>(0);
  const [devBand, setDevBand] = useState<DevBand>('medium');
  const [accuracy, setAccuracy] = useState<AccuracyId>('ptp_ent');

  type Config = {
    model: ModelId;
    accessories: AccessoryId[];
    company: string;
    contact: string;
    notes: string;
    ptpPorts5000?: 1 | 2 | 3 | 4; // jen pro 5000
  };
  const [config, setConfig] = useState<Config>({
    model: 'nts-3000',
    accessories: [],
    company: '',
    contact: '',
    notes: '',
  });

  // načteni z URL
  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get('c');
    const parsed = decodeConfig<Config>(c);
    if (parsed) setConfig(parsed);
  }, []);

  // doporučení modelu
  const reco: ModelId = useMemo(() => recommendModel(devBand, accuracy), [devBand, accuracy]);

  // vynucení Dual PSU podle modelu + účesání accessories
  useEffect(() => {
    setConfig(prev => {
      const acc = new Set<AccessoryId>(prev.accessories);
      // Dual PSU logika
      if (reco === 'nts-4000' || reco === 'nts-5000') {
        acc.delete('dual_psu');
        acc.add('dual_psu_auto');
      } else {
        acc.delete('dual_psu_auto');
        // pro 3000 ponecháme možnost 'dual_psu'
      }
      // vyčištění PTP portů pokud není 5000
      const next: Config = {
        ...prev,
        model: reco,
        accessories: Array.from(acc),
        ptpPorts5000: reco === 'nts-5000' ? (prev.ptpPorts5000 ?? 2) : undefined,
      };
      return next;
    });
  }, [reco]);

  // permalink
  const shareUrl = useMemo(() => {
    const base = window.location.origin + window.location.pathname;
    return `${base}?c=${encodeConfig({ decision: { devBand, accuracy }, ...config })}`;
  }, [config, devBand, accuracy]);

  // model k renderu

  /* ================= Header ================= */
  const Header = () => (
    <div className="header">
      <div className="brand" onClick={() => { setScreen('landing'); setStep(0); }}>
        <div className="wgrid" aria-hidden>
          <span></span><span></span><span></span><span></span>
        </div>
        <div>
          <div className="brand-title">Westercom</div>
          <div className="pale" style={{fontSize:12}}>{t(lang,'brandTitle')}</div>
        </div>
      </div>

      <div className="lang">
        <label className="pale" htmlFor="lang">{t(lang,'language')}:</label>
        <select
          id="lang"
          value={lang}
          onChange={(e) => setLang(e.target.value as Lang)}
          className="input"
          style={{width:160}}
        >
          <option value="cs">Čeština</option>
          <option value="en">English</option>
          <option value="pl">Polski</option>
        </select>
      </div>
    </div>
  );

  /* ================= Landing (Overview) ================= */
  const Landing = () => {
    const models: Model[] = (['nts-pico3','nts-3000','nts-4000','nts-5000'] as ModelId[])
      .map(id => MODELS[lang][id]);

    return (
      <>
        <h1>{t(lang,'overview')}</h1>
        <div className="lead">
          {t(lang,'unsure')} <a href="#" onClick={(e)=>{e.preventDefault(); setScreen('wizard');}}>{t(lang,'start')}</a>.
        </div>

        <div className="grid">
          {models.map((mm) => (
            <div className="card" key={mm.id}>
              <div className="imgbox">
                <img src={mm.image} alt={mm.name}/>
              </div>
              <div className="card-body">
                <h3>{mm.name}</h3>
                <small>{mm.segment}</small>
                <div className="pale" style={{marginTop:6}}>{mm.summary}</div>
              </div>
              <div className="actions">
                <a className="btn" href={mm.datasheet} target="_blank" rel="noreferrer">{t(lang,'datasheet')}</a>
              </div>
            </div>
          ))}
        </div>

        <div style={{display:'flex',justifyContent:'center',marginTop:20}}>
          <button className="btn btn-primary" onClick={()=>setScreen('wizard')}>
            {t(lang,'start')}
          </button>
        </div>
      </>
    );
  };

  /* ================= Wizard Steps ================= */
  const Step1 = () => (
    <>
      <div className="pale" style={{marginBottom:8}}>{t(lang,'step1')}</div>
      <div className="grid">
        <div className="card">
          <div className="card-body">
            {(Object.keys(DEVICE_BANDS) as DevBand[]).map((band) => (
              <label key={band} style={{display:'flex',alignItems:'center',gap:10,margin:'8px 0',cursor:'pointer'}}>
                <input type="radio" checked={devBand===band} onChange={()=>setDevBand(band)}/>
                <span>{t(lang, DEVICE_BANDS[band])}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="pale">{t(lang,'deviceBands')}</div>
          </div>
        </div>
      </div>
    </>
  );

  const Step2 = () => (
    <>
      <div className="pale" style={{marginBottom:8}}>{t(lang,'step2')}</div>
      <div className="grid">
        <div className="card">
          <div className="card-body">
            {(['ntp','ptp_ent','ptp_prtc','eprtc'] as AccuracyId[]).map((id) => (
              <label key={id} style={{display:'flex',alignItems:'center',gap:10,margin:'8px 0',cursor:'pointer'}}>
                <input type="radio" checked={accuracy===id} onChange={()=>setAccuracy(id)}/>
                <span>{t(lang, ACCURACY_LABELS[id])}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <b>{MODELS[lang][reco].name}</b>
            <div className="pale">{MODELS[lang][reco].segment}</div>
            <div className="pale" style={{marginTop:8}}>{MODELS[lang][reco].summary}</div>
          </div>
        </div>
      </div>
    </>
  );

  const accessoriesAll: { id: AccessoryId; labelKey: keyof TMap['cs'] }[] = [
    { id: 'antenna', labelKey: 'a_antenna' },
    { id: 'irig', labelKey: 'a_irig' },
    { id: 'fo', labelKey: 'a_fo' },
    { id: '5071a', labelKey: 'a_5071a' },
    { id: 'dual_psu', labelKey: 'a_dualpsu' },         // jen 3000
    { id: 'dual_psu_auto', labelKey: 'a_dualpsu_auto' } // auto 4000/5000
  ];

  const Step3 = () => {
    const accSet = new Set(config.accessories);
    const toggle = (id: AccessoryId) => {
      const next = new Set(config.accessories);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setConfig({ ...config, accessories: Array.from(next) });
    };

    const list = accessoriesAll.filter(a => {
      if (a.id === 'dual_psu' && reco !== 'nts-3000') return false;
      if (a.id === 'dual_psu_auto' && !(reco==='nts-4000'||reco==='nts-5000')) return false;
      return true;
    });

    return (
      <>
        <div className="pale" style={{marginBottom:8}}>{t(lang,'step3')}</div>
        <div className="grid">
          <div className="card">
            <div className="card-body">
              {list.map(a => (
                <label key={a.id} style={{display:'flex',alignItems:'center',gap:10,margin:'10px 0',cursor:'pointer'}}>
                  {a.id === 'dual_psu_auto' ? (
                    <input type="checkbox" checked readOnly />
                  ) : (
                    <input type="checkbox" checked={accSet.has(a.id)} onChange={()=>toggle(a.id)} />
                  )}
                  <span>{t(lang, a.labelKey)}</span>
                </label>
              ))}

              {reco === 'nts-5000' && (
                <div className="field" style={{marginTop:12}}>
                  <label>{t(lang,'ptpPorts')}</label>
                  <select
                    className="input"
                    value={config.ptpPorts5000 ?? 2}
                    onChange={(e)=>setConfig({...config, ptpPorts5000: Number(e.target.value) as 1|2|3|4})}
                  >
                    {[1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <b>{MODELS[lang][reco].name}</b>
              <div className="pale">{MODELS[lang][reco].segment}</div>
              <div className="pale" style={{marginTop:8}}>{MODELS[lang][reco].summary}</div>
            </div>
          </div>
        </div>
      </>
    );
  };

  const Step4 = () => {
    const modelTxt = `${MODELS[lang][reco].name} (${MODELS[lang][reco].segment})`;
    const lines: string[] = [
      modelTxt,
      `${t(lang, DEVICE_BANDS[devBand])}`,
      `${t(lang, ACCURACY_LABELS[accuracy])}`,
      config.ptpPorts5000 && reco==='nts-5000' ? `PTP ports: ${config.ptpPorts5000}` : '',
      `Accessories: ${config.accessories.length ? config.accessories.join(', ') : '—'}`
    ].filter(Boolean);

    return (
      <>
        <div className="pale" style={{marginBottom:8}}>{t(lang,'step4')}</div>
        <div className="form">
          <div className="card">
            <div className="card-body">
              <div className="field">
                <label className="pale">{t(lang,'company')}</label>
                <input className="input" value={config.company} onChange={(e)=>setConfig({...config, company:e.target.value})}/>
              </div>
              <div className="field">
                <label className="pale">{t(lang,'contact')}</label>
                <input className="input" value={config.contact} onChange={(e)=>setConfig({...config, contact:e.target.value})}/>
              </div>
              <div className="field">
                <label className="pale">{t(lang,'notes')}</label>
                <textarea className="textarea" value={config.notes} onChange={(e)=>setConfig({...config, notes:e.target.value})}/>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div style={{fontWeight:600,marginBottom:6}}>{t(lang,'summary')}</div>
              <div className="summary">{lines.join('\n')}</div>

              <div style={{display:'flex',gap:8,marginTop:10}}>
                <button className="btn btn-primary" onClick={()=>navigator.clipboard.writeText(shareUrl)}>
                  {t(lang,'copyLink')}
                </button>
                <button
                  className="btn"
                  onClick={()=>{
                    const blob = new Blob([JSON.stringify({ decision:{devBand,accuracy}, ...config }, null, 2)], {type:'application/json'});
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url; a.download = `${reco}-config.json`; a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  {t(lang,'downloadJson')}
                </button>
              </div>

              <div style={{marginTop:12}}>
                <div style={{fontWeight:600,marginBottom:4}}>{t(lang,'permalink')}</div>
                <div className="permalink">{shareUrl}</div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  /* ================= Render ================= */
  return (
    <div className="app">
      <div className="container">
        <Header/>

        {screen === 'landing' ? (
          <Landing/>
        ) : (
          <>
            <div className="progress">
              {[0,1,2,3].map(i => <div key={i} className={i<=step?'active':''}/>)}
            </div>

            {step===0 && <Step1/>}
            {step===1 && <Step2/>}
            {step===2 && <Step3/>}
            {step===3 && <Step4/>}

            <div style={{display:'flex',justifyContent:'space-between',marginTop:16}}>
              <button className="btn" onClick={()=>setStep(s=>Math.max(0, s-1))}>{t(lang,'back')}</button>
              <div style={{display:'flex',gap:8}}>
                {step<3 ? (
                  <button className="btn btn-primary" onClick={()=>setStep(s=>Math.min(3, s+1))}>{t(lang,'next')}</button>
                ) : (
                  <button className="btn" onClick={()=>{
                    setStep(0);
                    setConfig({ model: 'nts-3000', accessories: [], company:'', contact:'', notes:'' });
                  }}>{t(lang,'newConfig')}</button>
                )}
              </div>
            </div>
          </>
        )}

        <div className="footer">{t(lang,'footer')}</div>
      </div>
    </div>
  );
}
