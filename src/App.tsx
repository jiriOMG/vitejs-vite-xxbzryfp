import { useEffect, useMemo, useState } from 'react';

/**
 * NTS CONFIGURÁTOR – rozhodovací průvodce
 * Flow: (-1) intro → 1) počet zařízení → 2) požadovaná přesnost → 3) doplňky → 4) kontakty & export
 * Bez externích UI knihoven, vše inline CSS (funguje ve Vite + TS hned po vložení).
 */

/* ---------- Typy ---------- */
type ModelId = 'nts-pico3' | 'nts-3000' | 'nts-4000' | 'nts-5000';
type DevBand = 'small' | 'medium' | 'large' | 'xl';
type AccuracyId = 'ntp_ms' | 'ptp_ent' | 'ptp_prtc' | 'eprtc';

type ModelRec = {
  id: ModelId;
  name: string;
  segment: string;
  image?: string;     // cesta/URL k obrázku (volitelné)
  datasheet?: string; // URL na datasheet (volitelné)
  defaults: {
    oscillator: 'TCXO' | 'OCXO' | 'Rb';
    gnss: string[];
    lan: number;
    sfp: number;
    power: 'Single' | 'Redundant';
    redundantGnss: boolean;
  };
  notes: string;
};

/* ---------- Data ---------- */
const MODELS: ModelRec[] = [
  {
    id: 'nts-pico3',
    name: 'NTS-PICO3',
    segment: 'Kompaktní | NTP/PTP (edge)',
    // Dočasně používám logo jako placeholder; nahraď za /img/nts-pico3.webp apod.
    image: 'https://www.westercom.eu/img/logo-1634110785.jpg',
    datasheet: 'https://www.elpromaelectronics.com/products/',
    defaults: { oscillator: 'TCXO', gnss: ['GNSS'], lan: 1, sfp: 0, power: 'Single', redundantGnss: false },
    notes: 'Pro malé sítě (desítky klientů), přesnost ms (NTP) / základní PTP.',
  },
  {
    id: 'nts-3000',
    name: 'NTS-3000',
    segment: 'PTP Grandmaster | NTP Stratum-1',
    image: 'https://www.westercom.eu/img/logo-1634110785.jpg',
    datasheet: 'https://www.elpromaelectronics.com/products/',
    defaults: { oscillator: 'OCXO', gnss: ['GNSS'], lan: 2, sfp: 0, power: 'Single', redundantGnss: false },
    notes: 'Pro stovky klientů, enterprise PTP (sub-ms až desítky µs).',
  },
  {
    id: 'nts-4000',
    name: 'NTS-4000',
    segment: 'PTP/PRTC-A | vyšší kapacita',
    image: 'https://www.westercom.eu/img/logo-1634110785.jpg',
    datasheet: 'https://www.elpromaelectronics.com/products/',
    defaults: { oscillator: 'OCXO', gnss: ['GNSS'], lan: 4, sfp: 2, power: 'Redundant', redundantGnss: true },
    notes: 'Pro stovky až tisíce klientů, SFP, redundance, sub-µs (telekom/utility).',
  },
  {
    id: 'nts-5000',
    name: 'NTS-5000',
    segment: 'ePRTC / PRTC A/B | rubidium',
    image: 'https://www.westercom.eu/img/logo-1634110785.jpg',
    datasheet: 'https://www.elpromaelectronics.com/products/',
    defaults: { oscillator: 'Rb', gnss: ['GNSS'], lan: 6, sfp: 2, power: 'Redundant', redundantGnss: true },
    notes: 'Pro velké/kritické instalace, ePRTC, dlouhý holdover, tisíce klientů.',
  },
];

const ACCESSORIES = [
  { id: 'irig', name: 'IRIG-B IN/OUT module w/ 1PPS output' },
  { id: 'psu', name: 'Dual Redundant Power Supply' },
  { id: 'fo', name: 'FO Comm Set for GNSS Antenna/Receiver' },
  { id: '5071a', name: '5071A special support (firmware)' },
];

const DEVICE_BANDS: { id: DevBand; label: string }[] = [
  { id: 'small', label: 'do ~50 zařízení' },
  { id: 'medium', label: '~50–200 zařízení' },
  { id: 'large', label: '~200–1000 zařízení' },
  { id: 'xl', label: '>1000 zařízení' },
];

const ACCURACY_LEVELS: { id: AccuracyId; label: string; help: string }[] = [
  { id: 'ntp_ms',  label: 'NTP – milisekundy',                     help: 'běžná IT síť, logy, servery, CCTV' },
  { id: 'ptp_ent', label: 'PTP Enterprise – sub-ms až desítky µs', help: 'datacentra, průmysl, trading edge' },
  { id: 'ptp_prtc',label: 'PTP Telecom/PRTC-A – sub-µs',           help: 'telekom/utility, synchronizace sítí' },
  { id: 'eprtc',   label: 'ePRTC / dlouhý holdover',                help: 'kritická infrastruktura, rubidium' },
];

/* ---------- Helpers ---------- */
const box = {
  border: '1px solid #e5e5e5',
  borderRadius: 16,
  boxShadow: '0 1px 6px rgba(0,0,0,.04)',
} as const;

const encodeConfig = (cfg: unknown) => {
  const json = JSON.stringify(cfg);
  return typeof window !== 'undefined'
    ? window.btoa(unescape(encodeURIComponent(json)))
    : btoa(unescape(encodeURIComponent(json)));
};
const decodeConfig = (str: string) => {
  try { return JSON.parse(decodeURIComponent(escape(atob(str)))); }
  catch { return null; }
};

/* ---------- Recommendation rules ---------- */
function recommendModel(devBand: DevBand, acc: AccuracyId): ModelId {
  if (acc === 'eprtc') return 'nts-5000';
  if (acc === 'ptp_prtc') return devBand === 'xl' ? 'nts-5000' : 'nts-4000';
  if (acc === 'ptp_ent')  return (devBand === 'large' || devBand === 'xl') ? 'nts-4000' : 'nts-3000';
  // ntp_ms
  if (devBand === 'small')  return 'nts-pico3';
  if (devBand === 'medium') return 'nts-3000';
  return 'nts-4000';
}

/* ---------- App ---------- */
export default function App() {
  // -1 = úvodní obrazovka
  const [step, setStep] = useState(-1);
  const [devBand, setDevBand] = useState<DevBand>('medium');
  const [accuracy, setAccuracy] = useState<AccuracyId>('ptp_ent');
  const [config, setConfig] = useState(() => ({
    model: 'nts-3000' as ModelId,
    oscillator: 'OCXO' as 'TCXO' | 'OCXO' | 'Rb',
    gnss: ['GNSS'] as string[],
    lan: 2,
    sfp: 0,
    power: 'Single' as 'Single' | 'Redundant',
    redundantGnss: false,
    ptpProfile: 'Default',
    accessories: [] as string[],
    company: '',
    contact: '',
    notes: '',
  }));

  // načtení z URL
  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get('c');
    const dec = c ? decodeConfig(c) : null;
    if (dec) setConfig(dec);
  }, []);

  // doporučení modelu
  const recommendedId = useMemo(() => recommendModel(devBand, accuracy), [devBand, accuracy]);
  const recommendedModel = useMemo(() => MODELS.find((m) => m.id === recommendedId)!, [recommendedId]);

  // přepnutí defaultů při změně modelu
  useEffect(() => {
    const m = MODELS.find((m) => m.id === recommendedId);
    if (!m) return;
    setConfig((prev) => ({
      ...prev,
      model: m.id,
      oscillator: m.defaults.oscillator,
      lan: m.defaults.lan,
      sfp: m.defaults.sfp,
      power: m.defaults.power,
      redundantGnss: m.defaults.redundantGnss,
    }));
  }, [recommendedId]);

  // accessories → redundant PSU sync
  useEffect(() => {
    const wantsRedundant = config.accessories.includes('Dual Redundant Power Supply');
    setConfig((prev) => (wantsRedundant && prev.power !== 'Redundant') ? { ...prev, power: 'Redundant' } : prev);
  }, [config.accessories]);

  const shareUrl = useMemo(() => {
    const base = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';
    return base + '?c=' + encodeConfig(config);
  }, [config]);

  const summary = useMemo(() => ([
    `Doporučený model: ${recommendedModel.name} (${recommendedModel.segment})`,
    `Zařízení: ${DEVICE_BANDS.find((b) => b.id === devBand)?.label}`,
    `Požadovaná přesnost: ${ACCURACY_LEVELS.find((a) => a.id === accuracy)?.label}`,
    `Holdover: ${config.oscillator}`,
    `Síť: ${config.lan}× LAN, ${config.sfp}× SFP`,
    `Napájení: ${config.power}${config.redundantGnss ? ', redundantní GNSS' : ''}`,
    `PTP profil: ${config.ptpProfile}`,
    `Doplňky: ${config.accessories.length ? config.accessories.join(', ') : '—'}`,
  ].join('\n')), [recommendedModel, devBand, accuracy, config]);

  return (
    <div
      className="app"
      style={{ minHeight: '100vh', fontFamily: 'system-ui, Arial', color: '#111' }}
    >
      <div style={{ maxWidth: 1040, margin: '0 auto', padding: 24 }}>
        {/* Header s logem */}
        <header style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
          <img src="https://www.westercom.eu/img/logo-1634110785.jpg" alt="Westercom" height={36} />
          <div style={{ fontSize:18, fontWeight:700 }}>Konfigurátor časových serverů Elproma NTS</div>
        </header>
        <p style={{ color:'#555', fontSize:14, marginTop:0, marginBottom:8 }}>
          Interaktivní průvodce, který pomůže vybrat správný časový server pro vaši infrastrukturu.
        </p>

        {/* Progress – jen pokud nejsme v intru */}
        {step >= 0 && (
          <div className="progress" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,margin:'16px 0 24px'}}>
            {[0,1,2,3].map((i) => (
              <div key={i} className={'progress__bar' + (i <= step ? ' is-active' : '')} />
            ))}
          </div>
        )}

        {/* Intro – přehled modelů */}
        {step === -1 && (
          <section style={box}>
            <div style={{ padding:24, borderBottom:'1px solid #eee' }}>
              <h2 style={{margin:0}}>Přehled časových serverů</h2>
              <p style={{margin:'6px 0 0', color:'#555'}}>
                Krátké seznámení s portfoliem. U každého modelu najdete popisek a odkaz na datasheet.
                Nejste si jistí? Klikněte na <b>Spustit konfigurátor</b> a nechte se vést rozhodovacím průvodcem.
              </p>
            </div>
            <div style={{ padding:24 }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))', gap:16 }}>
                {MODELS.map((m) => (
                  <article key={m.id} style={{ border:'1px solid #e5e5e5', borderRadius:16, overflow:'hidden', background:'#fff', boxShadow:'0 6px 24px rgba(0,0,0,.06)' }}>
                    {m.image && (
                      <img
                        src={m.image}
                        alt={m.name}
                        loading="lazy"
                        style={{ width:'100%', height:140, objectFit:'cover', display:'block' }}
                      />
                    )}
                    <div style={{ padding:'12px 14px' }}>
                      <div style={{ fontWeight:700 }}>{m.name}</div>
                      <div style={{ color:'#666', fontSize:12, marginBottom:6 }}>{m.segment}</div>
                      <p style={{ fontSize:12, color:'#444', minHeight:48, margin:'6px 0 0' }}>{m.notes}</p>
                      {m.datasheet && (
                        <div style={{ marginTop:10 }}>
                          <a
                            href={m.datasheet}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-ghost"
                            style={{ textDecoration:'none', padding:'8px 10px', border:'1px solid #e5e5e5', borderRadius:10 }}
                          >
                            Datasheet
                          </a>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>
            <div style={{ padding:'0 24px 24px', display:'flex', justifyContent:'center' }}>
              <button className="btn-primary" onClick={() => setStep(0)}>Spustit konfigurátor</button>
            </div>
          </section>
        )}

        {/* 1) Devices */}
        {step === 0 && (
          <section style={box}>
            <div style={{ padding: 24, borderBottom: '1px solid #eee' }}>
              <b>1) Kolik zařízení potřebujete synchronizovat?</b>
            </div>
            <div style={{ padding: 24, display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
              <div>
                {DEVICE_BANDS.map((b) => (
                  <label key={b.id}
                    style={{ display:'flex', gap:12, alignItems:'center', padding:12, border:'1px solid #e5e5e5', borderRadius:12, cursor:'pointer', marginBottom:8 }}>
                    <input type="radio" name="devBand" checked={devBand === b.id} onChange={() => setDevBand(b.id)} />
                    <span>{b.label}</span>
                  </label>
                ))}
              </div>
              <div styl
