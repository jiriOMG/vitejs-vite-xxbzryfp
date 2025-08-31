import { useEffect, useMemo, useState } from 'react';
import './assets/App.css';

/* =========================
   Typy a data
========================= */

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
  | 'dual_psu_auto'
  | 'dual_psu_optional';

type Accessory = {
  id: AccessoryId;
  name: Record<Lang, string>;
  help: Record<Lang, string>;
  disable?: (m: ModelId) => boolean;
  autoInclude?: (m: ModelId) => boolean;
  hide?: (m: ModelId) => boolean;
};

type Config = {
  model: ModelId;
  accessories: AccessoryId[];
  company: string;
  contact: string;
  notes: string;
  ptpProfile: string;
};

const i18n = {
  title: {
    cs: 'Elproma NTS konfigurátor časových serverů',
    en: 'Elproma NTS Time Servers Configurator',
    pl: 'Konfigurator serwerów czasu Elproma NTS',
  },
  langLabel: { cs: 'Jazyk', en: 'Language', pl: 'Język' },

  /* landing */
  lead: {
    cs: 'Interaktivní průvodce, který pomůže vybrat správný časový server pro vaši infrastrukturu.',
    en: 'An interactive wizard that helps you choose the right time server for your infrastructure.',
    pl: 'Interaktywny kreator pomaga wybrać odpowiedni serwer czasu dla Twojej infrastruktury.',
  },
  overview: {
    cs: 'Přehled časových serverů',
    en: 'Time Servers Overview',
    pl: 'Przegląd serwerów czasu',
  },
  startCfg: { cs: 'Spustit konfigurátor', en: 'Start configurator', pl: 'Uruchom konfigurator' },
  notSure: { cs: 'Nejste si jisti?', en: 'Not sure?', pl: 'Nie jesteś pewien?' },
  datasheet: { cs: 'Datasheet', en: 'Datasheet', pl: 'Karta katalogowa' },

  /* wizard headings */
  step1: {
    cs: '1) Kolik zařízení synchronizovat?',
    en: '1) How many devices to synchronize?',
    pl: '1) Ile urządzeń synchronizować?',
  },
  step2: { cs: '2) Požadovaná přesnost', en: '2) Required accuracy', pl: '2) Wymagana dokładność' },
  step3: { cs: '3) Volitelné doplňky', en: '3) Optional accessories', pl: '3) Opcjonalne akcesoria' },
  step4: { cs: '4) Kontakty & export', en: '4) Contacts & export', pl: '4) Kontakty i eksport' },

  /* dev bands */
  bands: {
    small: { cs: 'do ~50 zařízení', en: 'up to ~50 devices', pl: 'do ~50 urządzeń' },
    medium: { cs: '~50–200 zařízení', en: '~50–200 devices', pl: '~50–200 urządzeń' },
    large: { cs: '~200–1000 zařízení', en: '~200–1000 devices', pl: '~200–1000 urządzeń' },
    xl: { cs: '>1000 zařízení', en: '>1000 devices', pl: '>1000 urządzeń' },
  },

  /* accuracy */
  acc: {
    ntp: {
      label: { cs: 'NTP – milisekundy', en: 'NTP – milliseconds', pl: 'NTP – milisekundy' },
      help: { cs: 'běžná IT síť, logy, CCTV', en: 'typical IT, logs, CCTV', pl: 'typowa sieć IT, logi, CCTV' },
    },
    ptp_ent: {
      label: {
        cs: 'PTP Enterprise – sub-ms až desítky µs',
        en: 'PTP Enterprise – sub-ms to tens of µs',
        pl: 'PTP Enterprise – sub-ms do dziesiątek µs',
      },
      help: { cs: 'DC/industry, HW timestamping', en: 'DC/industry, HW timestamping', pl: 'DC/przemysł, znacznik HW' },
    },
    ptp_prtc: {
      label: { cs: 'PTP Telecom/PRTC-A – sub-µs', en: 'PTP Telecom/PRTC-A – sub-µs', pl: 'PTP Telecom/PRTC-A – sub-µs' },
      help: {
        cs: 'telekom/utility, často SFP a HW GM',
        en: 'telecom/utility, often SFP & HW GM',
        pl: 'telekom/usługi, często SFP i HW GM',
      },
    },
    eprtc: {
      label: { cs: 'ePRTC / dlouhý holdover', en: 'ePRTC / long holdover', pl: 'ePRTC / długi holdover' },
      help: { cs: 'kritická infrastruktura, rubidium', en: 'critical infra, rubidium', pl: 'infrastruktura krytyczna, rubid' },
    },
  },

  /* landing model texts */
  models: {
    pico: {
      title: 'NTS-PICO3',
      subtitle: {
        cs: 'Kompaktní | NTP/PTP (edge)',
        en: 'Compact | NTP/PTP (edge)',
        pl: 'Kompaktowy | NTP/PTP (edge)',
      },
      desc: {
        cs: 'Pro malé sítě (desítky klientů), přesnost ms (NTP) / základní PTP.',
        en: 'For small networks (dozens of clients), ms accuracy (NTP) / basic PTP.',
        pl: 'Dla małych sieci (dziesiątki klientów), dokładność ms (NTP) / podstawowy PTP.',
      },
      img: '/img/nts-pico3.jpg',
      sheet: 'https://www.elpromaelectronics.com/products/',
    },
    m3000: {
      title: 'NTS-3000',
      subtitle: {
        cs: 'PTP Grandmaster | NTP Stratum-1',
        en: 'PTP Grandmaster | NTP Stratum-1',
        pl: 'PTP Grandmaster | NTP Stratum-1',
      },
      desc: {
        cs: 'Pro stovky klientů, enterprise PTP (sub-ms až desítky µs). Dual PSU je volitelný.',
        en: 'For hundreds of clients, enterprise PTP (sub-ms to tens of µs). Dual PSU optional.',
        pl: 'Dla setek klientów, enterprise PTP (sub-ms do dziesiątek µs). Zasilacz podwójny opcjonalny.',
      },
      img: '/img/nts-3000.jpg',
      sheet:
        'https://www.elpromaelectronics.com/wp-content/uploads/woocommerce_uploads/2023/05/TimeSystems_NTS_3000_120525-tamqzn.pdf',
    },
    m4000: {
      title: 'NTS-4000',
      subtitle: {
        cs: 'PTP/PRTC-A | vyšší kapacita',
        en: 'PTP/PRTC-A | higher capacity',
        pl: 'PTP/PRTC-A | większa wydajność',
      },
      desc: {
        cs: 'Pro stovky až tisíce klientů, SFP, redundance, sub-µs (telekom/utility). Dual PSU je součástí (automaticky).',
        en: 'For hundreds to thousands, SFP, redundancy, sub-µs (telecom/utility). Dual PSU included (automatically).',
        pl: 'Dla setek do tysięcy, SFP, redundancja, sub-µs (telekom/usługi). Zasilacz podwójny w zestawie (automatycznie).',
      },
      img: '/img/nts-4000.jpg',
      sheet:
        'https://www.elpromaelectronics.com/wp-content/uploads/woocommerce_uploads/2023/05/TimeSystems_NTS_4000_120525-t2ham9.pdf',
    },
    m5000: {
      title: 'NTS-5000',
      subtitle: {
        cs: 'ePRTC / PRTC A/B | rubidium',
        en: 'ePRTC / PRTC A/B | rubidium',
        pl: 'ePRTC / PRTC A/B | rubid',
      },
      desc: {
        cs: 'Pro velké/kritické instalace, ePRTC, dlouhý holdover, tisíce klientů. Dual PSU je součástí (automaticky).',
        en: 'For large/critical deployments, ePRTC, long holdover, thousands of clients. Dual PSU included (automatically).',
        pl: 'Dla dużych/krytycznych instalacji, ePRTC, długi holdover, tysiące klientów. Zasilacz podwójny w zestawie (automatycznie).',
      },
      img: '/img/nts-5000.jpg',
      sheet:
        'https://www.elpromaelectronics.com/wp-content/uploads/woocommerce_uploads/2023/05/TimeSystems_NTS_5000_120525-eozbhw.pdf',
    },
  },

  /* wizard misc labels */
  back: { cs: 'Zpět', en: 'Back', pl: 'Wstecz' },
  next: { cs: 'Pokračovat', en: 'Continue', pl: 'Dalej' },
  company: { cs: 'Společnost', en: 'Company', pl: 'Firma' },
  contact: { cs: 'Kontakt', en: 'Contact', pl: 'Kontakt' },
  notes: { cs: 'Poznámky', en: 'Notes', pl: 'Uwagi' },
  summary: { cs: 'Shrnutí', en: 'Summary', pl: 'Podsumowanie' },
  permalink: { cs: 'Permalink', en: 'Permalink', pl: 'Permalink' },
  copyLink: { cs: 'Zkopírovat odkaz', en: 'Copy link', pl: 'Kopiuj link' },
  downloadJson: { cs: 'Stáhnout JSON', en: 'Download JSON', pl: 'Pobierz JSON' },
  newCfg: { cs: 'Nová konfigurace', en: 'New configuration', pl: 'Nowa konfiguracja' },
} as const;

const accessories: Accessory[] = [
  {
    id: 'antenna',
    name: {
      cs: 'NTS-antenna – náhradní anténa',
      en: 'NTS-antenna – spare antenna',
      pl: 'NTS-antenna – antena zapasowa',
    },
    help: {
      cs: '1 ks je již v balení; položka je pro dokoupení navíc.',
      en: '1 pc included in the box; this is for extra spares.',
      pl: '1 szt. w zestawie; pozycja na dodatkowe sztuki.',
    },
  },
  {
    id: 'irig',
    name: {
      cs: 'IRIG-B IN/OUT modul s 1PPS',
      en: 'IRIG-B IN/OUT module w/ 1PPS',
      pl: 'Moduł IRIG-B IN/OUT z 1PPS',
    },
    help: {
      cs: 'Rozhraní IRIG-B pro kompatibilní systémy, včetně 1PPS výstupu.',
      en: 'IRIG-B I/O for compatible systems, incl. 1PPS output.',
      pl: 'IRIG-B I/O dla zgodnych systemów, z wyjściem 1PPS.',
    },
  },
  {
    id: 'fo',
    name: { cs: 'Fibre Optic Antenna Set', en: 'Fibre Optic Antenna Set', pl: 'Fibre Optic Antenna Set' },
    help: {
      cs: 'Sada pro vláknové připojení GNSS antény/receiveru.',
      en: 'Set for fibre connection of GNSS antenna/receiver.',
      pl: 'Zestaw do światłowodowego połączenia anteny/odbiornika GNSS.',
    },
  },
  {
    id: '5071a',
    name: {
      cs: '5071A special support (firmware)',
      en: '5071A special support (firmware)',
      pl: '5071A special support (firmware)',
    },
    help: {
      cs: 'Podpora integrace se standardem 5071A (firmware).',
      en: 'Integration support with 5071A standard (firmware).',
      pl: 'Wsparcie integracji ze standardem 5071A (firmware).',
    },
  },
  /* Dual PSU pravidla */
  {
    id: 'dual_psu_auto',
    name: {
      cs: 'Dual Redundant Power Supply – součástí',
      en: 'Dual Redundant Power Supply – included',
      pl: 'Dual Redundant Power Supply – w zestawie',
    },
    help: {
      cs: 'U NTS-4000/5000 dodáváno automaticky.',
      en: 'For NTS-4000/5000 delivered automatically.',
      pl: 'Dla NTS-4000/5000 dostarczane automatycznie.',
    },
    autoInclude: (m) => m === 'nts-4000' || m === 'nts-5000',
    hide: (m) => !(m === 'nts-4000' || m === 'nts-5000'),
  },
  {
    id: 'dual_psu_optional',
    name: {
      cs: 'Dual Redundant Power Supply (jen NTS-3000)',
      en: 'Dual Redundant Power Supply (NTS-3000 only)',
      pl: 'Dual Redundant Power Supply (tylko NTS-3000)',
    },
    help: { cs: 'Volitelné jen pro NTS-3000.', en: 'Optional for NTS-3000 only.', pl: 'Opcjonalnie tylko dla NTS-3000.' },
    disable: (m) => m !== 'nts-3000',
    hide: (m) => m === 'nts-4000' || m === 'nts-5000' || m === 'nts-pico3',
  },
];

/* Doporučení modelu dle pásma a přesnosti */
function recommend(dev: DevBand, acc: AccuracyId): ModelId {
  if (acc === 'eprtc') return 'nts-5000';
  if (acc === 'ptp_prtc') return dev === 'xl' ? 'nts-5000' : 'nts-4000';
  if (acc === 'ptp_ent') return dev === 'large' || dev === 'xl' ? 'nts-4000' : 'nts-3000';
  if (dev === 'small') return 'nts-pico3';
  if (dev === 'medium') return 'nts-3000';
  return 'nts-4000';
}

/* URL-safe base64 bez Bufferu */
const encode = (obj: unknown) => {
  const json = JSON.stringify(obj);
  const b64 = btoa(unescape(encodeURIComponent(json)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/u, '');
};
const decode = (str: string) => {
  try {
    const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(escape(atob(b64)));
    return JSON.parse(json) as unknown;
  } catch {
    return null;
  }
};

/* =========================
   Aplikace
========================= */

export default function App() {
  const [lang, setLang] = useState<Lang>('cs');
  const [screen, setScreen] = useState<Screen>('landing');
  const [step, setStep] = useState(0);

  const [devBand, setDevBand] = useState<DevBand>('medium');
  const [acc, setAcc] = useState<AccuracyId>('ptp_ent');

  const [cfg, setCfg] = useState<Config>(() => ({
    model: 'nts-3000',
    accessories: [],
    company: '',
    contact: '',
    notes: '',
    ptpProfile: 'Default',
  }));

  /* Inicializace z URL */
  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get('c');
    const o = (c ? decode(c) : null) as (Config & { decision?: { devBand: DevBand; acc: AccuracyId } }) | null;
    if (o) {
      setScreen('wizard');
      // minimální safety merge
      setCfg({
        model: o.model,
        accessories: o.accessories ?? [],
        company: o.company ?? '',
        contact: o.contact ?? '',
        notes: o.notes ?? '',
        ptpProfile: o.ptpProfile ?? 'Default',
      });
      if (o.decision) {
        setDevBand(o.decision.devBand);
        setAcc(o.decision.acc);
      }
    }
  }, []);

  const modelId = useMemo(() => recommend(devBand, acc), [devBand, acc]);

  /* auto zahrnutí dual_psu_auto u 4000/5000 */
  useEffect(() => {
    setCfg((prev: Config) => {
      const set = new Set<AccessoryId>(prev.accessories || []);
      accessories.forEach((a: Accessory) => {
        const auto = a.autoInclude?.(modelId);
        if (a.id === 'dual_psu_auto') {
          if (auto) set.add('dual_psu_auto');
          else set.delete('dual_psu_auto');
        }
      });
      return { ...prev, model: modelId, accessories: Array.from(set) };
    });
  }, [modelId]);

  /* permalink */
  const permalink = useMemo(() => {
    const base = window.location.origin + window.location.pathname;
    return `${base}?c=${encode({ decision: { devBand, acc }, ...cfg })}`;
  }, [cfg, devBand, acc]);

  const L = i18n.models;

  return (
    <>
      {/* TOPBAR */}
      <div className="topbar">
        <div
          className="topbar__brand"
          onClick={() => {
            setScreen('landing');
            setStep(0);
          }}
        >
          <img className="topbar__logo" src="https://www.westercom.eu/img/logo-1634110785.jpg" alt="Westercom" />
          <div className="topbar__title">{i18n.title[lang]}</div>
        </div>
        <div className="topbar__spacer" />
        <div className="topbar__ctrls">
          <label htmlFor="lang">{i18n.langLabel[lang]}:</label>
          <select id="lang" className="sel" value={lang} onChange={(e) => setLang(e.target.value as Lang)}>
            <option value="cs">Čeština</option>
            <option value="en">English</option>
            <option value="pl">Polski</option>
          </select>
        </div>
      </div>

      {/* LANDING */}
      {screen === 'landing' && (
        <div className="container">
          <div className="landing__lead">{i18n.lead[lang]}</div>
          <div className="landing__title">{i18n.overview[lang]}</div>
          <div className="landing__lead">
            {i18n.notSure[lang]}{' '}
            <b onClick={() => setScreen('wizard')} style={{ cursor: 'pointer' }}>
              {i18n.startCfg[lang]}
            </b>
            .
          </div>

          <div className="grid">
            {/* PICO3 */}
            <article className="card">
              <div className="card__media">
                <img className="card__img" src={L.pico.img} alt={L.pico.title} loading="lazy" />
              </div>
              <div className="card__body">
                <h3 className="card__title">{L.pico.title}</h3>
                <div className="card__subtitle">{L.pico.subtitle[lang]}</div>
                <p className="card__desc">{L.pico.desc[lang]}</p>
              </div>
              <div className="card__actions">
                <a className="btn" href={L.pico.sheet} target="_blank" rel="noreferrer">
                  {i18n.datasheet[lang]}
                </a>
              </div>
            </article>

            {/* 3000 */}
            <article className="card">
              <div className="card__media">
                <img className="card__img" src={L.m3000.img} alt={L.m3000.title} loading="lazy" />
              </div>
              <div className="card__body">
                <h3 className="card__title">{L.m3000.title}</h3>
                <div className="card__subtitle">{L.m3000.subtitle[lang]}</div>
                <p className="card__desc">{L.m3000.desc[lang]}</p>
              </div>
              <div className="card__actions">
                <a className="btn" href={L.m3000.sheet} target="_blank" rel="noreferrer">
                  {i18n.datasheet[lang]}
                </a>
              </div>
            </article>

            {/* 4000 */}
            <article className="card">
              <div className="card__media">
                <img className="card__img" src={L.m4000.img} alt={L.m4000.title} loading="lazy" />
              </div>
              <div className="card__body">
                <h3 className="card__title">{L.m4000.title}</h3>
                <div className="card__subtitle">{L.m4000.subtitle[lang]}</div>
                <p className="card__desc">{L.m4000.desc[lang]}</p>
              </div>
              <div className="card__actions">
                <a className="btn" href={L.m4000.sheet} target="_blank" rel="noreferrer">
                  {i18n.datasheet[lang]}
                </a>
              </div>
            </article>

            {/* 5000 */}
            <article className="card">
              <div className="card__media">
                <img className="card__img" src={L.m5000.img} alt={L.m5000.title} loading="lazy" />
              </div>
              <div className="card__body">
                <h3 className="card__title">{L.m5000.title}</h3>
                <div className="card__subtitle">{L.m5000.subtitle[lang]}</div>
                <p className="card__desc">{L.m5000.desc[lang]}</p>
              </div>
              <div className="card__actions">
                <a className="btn" href={L.m5000.sheet} target="_blank" rel="noreferrer">
                  {i18n.datasheet[lang]}
                </a>
              </div>
            </article>
          </div>

          <div style={{ textAlign: 'center', margin: '24px 0 8px' }}>
            <button className="btn btn--primary" onClick={() => setScreen('wizard')}>
              {i18n.startCfg[lang]}
            </button>
          </div>
        </div>
      )}

      {/* WIZARD */}
      {screen === 'wizard' && (
        <div className="container">
          {/* Progress */}
          <div className="progress">{[0, 1, 2, 3].map((i) => <div key={i} className={i <= step ? 'is' : ''} />)}</div>

          {/* 1) devices */}
          {step === 0 && (
            <section className="section">
              <div className="section__hd">{i18n.step1[lang]}</div>
              <div className="section__bd row2">
                <div>
                  {(Object.keys(i18n.bands) as DevBand[]).map((b: DevBand) => (
                    <label key={b} className="pill">
                      <input type="radio" name="band" checked={devBand === b} onChange={() => setDevBand(b)} />
                      {i18n.bands[b][lang]}
                    </label>
                  ))}
                </div>
                <div className="footerNote">
                  • {i18n.models.pico.desc[lang]}
                  <br />• {i18n.models.m4000.desc[lang]}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 18px 16px' }}>
                <button className="btn btn--primary" onClick={() => setStep(1)}>
                  {i18n.next[lang]}
                </button>
              </div>
            </section>
          )}

          {/* 2) accuracy */}
          {step === 1 && (
            <section className="section">
              <div className="section__hd">{i18n.step2[lang]}</div>
              <div className="section__bd row2">
                <div>
                  {(['ntp', 'ptp_ent', 'ptp_prtc', 'eprtc'] as AccuracyId[]).map((a: AccuracyId) => (
                    <label key={a} className="pill" style={{ alignItems: 'start' }}>
                      <input type="radio" name="acc" checked={acc === a} onChange={() => setAcc(a)} />
                      <span>
                        <b>{i18n.acc[a].label[lang]}</b>
                        <br />
                        <span style={{ color: '#666', fontSize: 12 }}>{i18n.acc[a].help[lang]}</span>
                      </span>
                    </label>
                  ))}
                </div>
                <div className="footerNote">{i18n.models.m5000.desc[lang]}</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 18px 16px' }}>
                <button className="btn" onClick={() => setStep(0)}>
                  {i18n.back[lang]}
                </button>
                <button className="btn btn--primary" onClick={() => setStep(2)}>
                  {i18n.next[lang]}
                </button>
              </div>
            </section>
          )}

          {/* 3) accessories */}
          {step === 2 && (
            <section className="section">
              <div className="section__hd">{i18n.step3[lang]}</div>
              <div className="section__bd row2">
                <div>
                  {accessories.map((a: Accessory) => {
                    if (a.hide?.(modelId)) return null;
                    const disabled = a.disable?.(modelId) ?? false;
                    const auto = a.autoInclude?.(modelId) ?? false;
                    const isChecked = auto || (cfg.accessories || []).includes(a.id);

                    return (
                      <label key={a.id} className="pill" style={{ opacity: disabled ? 0.5 : 1 }}>
                        <input
                          type="checkbox"
                          disabled={disabled || auto}
                          checked={isChecked}
                          onChange={(e) => {
                            setCfg((c: Config) => {
                              const set = new Set<AccessoryId>(c.accessories || []);
                              if (e.target.checked) set.add(a.id);
                              else set.delete(a.id);
                              return { ...c, accessories: Array.from(set) };
                            });
                          }}
                        />
                        <span>
                          <b>
                            {a.name[lang]}
                            {auto ? ' • ' + (lang === 'cs' ? '(automaticky)' : '(automatic)') : ''}
                          </b>
                          <br />
                          <span style={{ color: '#666', fontSize: 12 }}>{a.help[lang]}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>

                <div>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>Doporučený model</div>
                  <div style={{ fontWeight: 700 }}>
                    {modelId === 'nts-pico3'
                      ? 'NTS-PICO3'
                      : modelId === 'nts-3000'
                      ? 'NTS-3000'
                      : modelId === 'nts-4000'
                      ? 'NTS-4000'
                      : 'NTS-5000'}
                  </div>
                  <div style={{ color: '#666', fontSize: 12, marginTop: 6 }}>
                    {modelId === 'nts-pico3'
                      ? i18n.models.pico.subtitle[lang]
                      : modelId === 'nts-3000'
                      ? i18n.models.m3000.subtitle[lang]
                      : modelId === 'nts-4000'
                      ? i18n.models.m4000.subtitle[lang]
                      : i18n.models.m5000.subtitle[lang]}
                  </div>
                  <p style={{ color: '#666', fontSize: 12 }}>
                    {modelId === 'nts-pico3'
                      ? i18n.models.pico.desc[lang]
                      : modelId === 'nts-3000'
                      ? i18n.models.m3000.desc[lang]
                      : modelId === 'nts-4000'
                      ? i18n.models.m4000.desc[lang]
                      : i18n.models.m5000.desc[lang]}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 18px 16px' }}>
                <button className="btn" onClick={() => setStep(1)}>
                  {i18n.back[lang]}
                </button>
                <button className="btn btn--primary" onClick={() => setStep(3)}>
                  {i18n.next[lang]}
                </button>
              </div>
            </section>
          )}

          {/* 4) contacts & export */}
          {step === 3 && (
            <section className="section">
              <div className="section__hd">{i18n.step4[lang]}</div>
              <div className="section__bd row2">
                <div>
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ fontSize: 12, color: '#555' }}>{i18n.company[lang]}</label>
                    <input
                      style={{ width: '100%', padding: '9px 10px', border: '1px solid #e6e6e6', borderRadius: 10 }}
                      value={cfg.company}
                      onChange={(e) => setCfg((c: Config) => ({ ...c, company: e.target.value }))}
                      placeholder={i18n.company[lang]}
                    />
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ fontSize: 12, color: '#555' }}>{i18n.contact[lang]}</label>
                    <input
                      style={{ width: '100%', padding: '9px 10px', border: '1px solid #e6e6e6', borderRadius: 10 }}
                      value={cfg.contact}
                      onChange={(e) => setCfg((c: Config) => ({ ...c, contact: e.target.value }))}
                      placeholder={i18n.contact[lang]}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: '#555' }}>{i18n.notes[lang]}</label>
                    <textarea
                      rows={4}
                      style={{ width: '100%', padding: '9px 10px', border: '1px solid #e6e6e6', borderRadius: 10 }}
                      value={cfg.notes}
                      onChange={(e) => setCfg((c: Config) => ({ ...c, notes: e.target.value }))}
                      placeholder="Požadavky, normy, prostředí… / Requirements…"
                    />
                  </div>
                </div>

                <div>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>{i18n.summary[lang]}</div>
                  <pre className="mono" style={{ whiteSpace: 'pre-wrap' }}>
                    {[
                      `Model: ${cfg.model}`,
                      `Zařízení: ${i18n.bands[devBand][lang]}`,
                      `Přesnost: ${i18n.acc[acc].label[lang]}`,
                      `PTP profil: ${cfg.ptpProfile}`,
                      `Doplňky: ${
                        cfg.accessories.length
                          ? cfg.accessories
                              .map((aid: AccessoryId) => accessories.find((x: Accessory) => x.id === aid)?.name[lang] || aid)
                              .join(', ')
                          : '—'
                      }`,
                    ].join('\n')}
                  </pre>

                  <div style={{ display: 'flex', gap: 8, margin: '10px 0' }}>
                    <button
                      className="btn btn--primary"
                      onClick={() => navigator.clipboard.writeText(permalink)}
                    >
                      {i18n.copyLink[lang]}
                    </button>
                    <button
                      className="btn"
                      onClick={() => {
                        const blob = new Blob(
                          [JSON.stringify({ decision: { devBand, acc }, ...cfg }, null, 2)],
                          { type: 'application/json' }
                        );
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${cfg.model}-config.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      {i18n.downloadJson[lang]}
                    </button>
                  </div>

                  <div style={{ marginTop: 6 }}>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{i18n.permalink[lang]}</div>
                    <textarea className="mono" readOnly value={permalink} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 18px 16px' }}>
                <button className="btn" onClick={() => setStep(2)}>
                  {i18n.back[lang]}
                </button>
                <button
                  className="btn"
                  onClick={() => {
                    setStep(0);
                    setScreen('landing');
                    setCfg((c: Config) => ({ ...c, accessories: [], company: '', contact: '', notes: '' }));
                  }}
                >
                  {i18n.newCfg[lang]}
                </button>
              </div>
            </section>
          )}

          <div className="footerNote">© {new Date().getFullYear()} Westercom</div>
        </div>
      )}
    </>
  );
}
