import { useEffect, useMemo, useState } from 'react';

/** NTS CONFIGURÁTOR – intro → 0) devices → 1) accuracy → 2) accessories → 3) export */

type ModelId = 'nts-pico3' | 'nts-3000' | 'nts-4000' | 'nts-5000';
type DevBand = 'small' | 'medium' | 'large' | 'xl';
type AccuracyId = 'ntp_ms' | 'ptp_ent' | 'ptp_prtc' | 'eprtc';

type ModelRec = {
  id: ModelId;
  name: string;
  segment: string;
  image?: string;      // cesta do /public/img/*.jpg nebo plná URL
  datasheet?: string;
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

type Accessory = {
  id: string;
  name: string;
  allowed?: ModelId[]; // pokud je uvedeno, doplněk je jen pro tyto modely
};

/* ---------- Malá komponenta pro obrázek s fallbackem ---------- */
function CardImage({ src, alt, label }: { src?: string; alt: string; label: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div
      style={{
        height: 140,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f6f7f9',
        borderBottom: '1px solid #eee',
      }}
    >
      {!!src && !failed && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          style={{
            maxWidth: '92%',
            maxHeight: '90%',
            objectFit: 'contain',
            objectPosition: 'center',
            display: 'block',
          }}
        />
      )}
      {(!src || failed) && (
        <div
          style={{
            padding: 12,
            color: '#6b7280',
            fontWeight: 700,
            fontSize: 14,
            textAlign: 'center',
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
}

/* ---------- Data ---------- */
const MODELS: ModelRec[] = [
  {
    id: 'nts-pico3',
    name: 'NTS-PICO3',
    segment: 'Kompaktní | NTP/PTP (edge)',
    image: '/img/nts-pico3.jpg',
    datasheet:
      'https://www.elpromaelectronics.com/wp-content/uploads/woocommerce_uploads/2023/04/TimeSystems_NTS-pico3_brochure_070125-fqrtq4.pdf',
    defaults: { oscillator: 'TCXO', gnss: ['GNSS'], lan: 1, sfp: 0, power: 'Single', redundantGnss: false },
    notes: 'Pro malé sítě (desítky klientů), přesnost ms (NTP) / základní PTP.',
  },
  {
    id: 'nts-3000',
    name: 'NTS-3000',
    segment: 'PTP Grandmaster | NTP Stratum-1',
    image: '/img/nts-3000.jpg',
    datasheet:
      'https://www.elpromaelectronics.com/wp-content/uploads/woocommerce_uploads/2023/05/TimeSystems_NTS_3000_120525-tamqzn.pdf',
    defaults: { oscillator: 'OCXO', gnss: ['GNSS'], lan: 2, sfp: 0, power: 'Single', redundantGnss: false },
    notes: 'Pro stovky klientů, enterprise PTP (sub-ms až desítky µs).',
  },
  {
    id: 'nts-4000',
    name: 'NTS-4000',
    segment: 'PTP/PRTC-A | vyšší kapacita',
    image: '/img/nts-4000.jpg',
    datasheet:
      'https://www.elpromaelectronics.com/wp-content/uploads/woocommerce_uploads/2023/05/TimeSystems_NTS_4000_120525-t2ham9.pdf',
    defaults: { oscillator: 'OCXO', gnss: ['GNSS'], lan: 4, sfp: 2, power: 'Redundant', redundantGnss: true },
    notes:
      'Pro stovky až tisíce klientů, SFP, redundance, sub-µs (telekom/utility). Duální napájení je součástí (automaticky).',
  },
  {
    id: 'nts-5000',
    name: 'NTS-5000',
    segment: 'ePRTC / PRTC A/B | rubidium',
    image: '/img/nts-5000.jpg',
    datasheet:
      'https://www.elpromaelectronics.com/wp-content/uploads/woocommerce_uploads/2023/05/TimeSystems_NTS_5000_120525-eozbhw.pdf',
    defaults: { oscillator: 'Rb', gnss: ['GNSS'], lan: 6, sfp: 2, power: 'Redundant', redundantGnss: true },
    notes:
      'Pro velké/kritické instalace, ePRTC, dlouhý holdover, tisíce klientů. Duální napájení je součástí (automaticky).',
  },
];

const ACCESSORIES: Accessory[] = [
  { id: 'antenna', name: 'NTS-antenna – náhradní anténa (1 ks je již v balení)' },
  { id: 'irig', name: 'IRIG-B IN/OUT module w/ 1PPS output' },
  { id: 'psu', name: 'Dual Redundant Power Supply', allowed: ['nts-3000'] }, // PSU jen pro NTS-3000
  { id: 'fo', name: 'Fibre Optic Antenna Set' },
  { id: '5071a', name: '5071A special support (firmware)' },
];

const DEVICE_BANDS: { id: DevBand; label: string }[] = [
  { id: 'small', label: 'do ~50 zařízení' },
  { id: 'medium', label: '~50–200 zařízení' },
  { id: 'large', label: '~200–1000 zařízení' },
  { id: 'xl', label: '>1000 zařízení' },
];

const ACCURACY_LEVELS: { id: AccuracyId; label: string; help: string }[] = [
  { id: 'ntp_ms', label: 'NTP – milisekundy', help: 'běžná IT síť, logy, servery, CCTV' },
  { id: 'ptp_ent', label: 'PTP Enterprise – sub-ms až desítky µs', help: 'datacentra, průmysl, trading edge' },
  { id: 'ptp_prtc', label: 'PTP Telecom/PRTC-A – sub-µs', help: 'telekom/utility, synchronizace sítí' },
  { id: 'eprtc', label: 'ePRTC / dlouhý holdover', help: 'kritická infrastruktura, rubidium' },
];

/* ---------- Helpers ---------- */
const box = { border: '1px solid #e5e5e5', borderRadius: 16, boxShadow: '0 1px 6px rgba(0,0,0,.04)' } as const;

const encodeConfig = (cfg: unknown) => {
  const json = JSON.stringify(cfg);
  return typeof window !== 'undefined'
    ? window.btoa(unescape(encodeURIComponent(json)))
    : btoa(unescape(encodeURIComponent(json)));
};
const decodeConfig = (str: string) => {
  try {
    return JSON.parse(decodeURIComponent(escape(atob(str))));
  } catch {
    return null;
  }
};

function recommendModel(devBand: DevBand, acc: AccuracyId): ModelId {
  if (acc === 'eprtc') return 'nts-5000';
  if (acc === 'ptp_prtc') return devBand === 'xl' ? 'nts-5000' : 'nts-4000';
  if (acc === 'ptp_ent') return devBand === 'large' || devBand === 'xl' ? 'nts-4000' : 'nts-3000';
  if (devBand === 'small') return 'nts-pico3';
  if (devBand === 'medium') return 'nts-3000';
  return 'nts-4000';
}

/* ---------- App ---------- */
export default function App() {
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
    ptpPorts: 2 as number | undefined, // jen pro NTS-5000
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

  // doporučení + defaulty
  const recommendedId = useMemo(() => recommendModel(devBand, accuracy), [devBand, accuracy]);
  const recommendedModel = useMemo(() => MODELS.find((m) => m.id === recommendedId)!, [recommendedId]);

  useEffect(() => {
    const m = MODELS.find((x) => x.id === recommendedId);
    if (!m) return;
    setConfig((prev) => ({
      ...prev,
      model: m.id,
      oscillator: m.defaults.oscillator,
      lan: m.defaults.lan,
      sfp: m.defaults.sfp,
      power: m.defaults.power,
      redundantGnss: m.defaults.redundantGnss,
      ptpPorts: m.id === 'nts-5000' ? prev.ptpPorts ?? 2 : undefined,
    }));
  }, [recommendedId]);

  // pročisti doplňky podle modelu
  useEffect(() => {
    const allowedSet = new Set(
      ACCESSORIES.filter((a) => !a.allowed || a.allowed.includes(config.model)).map((a) => a.name)
    );
    const filtered = config.accessories.filter((n) => allowedSet.has(n));
    if (filtered.length !== config.accessories.length) {
      setConfig((p) => ({ ...p, accessories: filtered }));
    }
  }, [config.model]); // eslint-disable-line react-hooks/exhaustive-deps

  // PSU -> power Redundant (jinak default modelu)
  useEffect(() => {
    const psuSelected = config.accessories.includes('Dual Redundant Power Supply');
    const modelDefaults = MODELS.find((m) => m.id === config.model)!.defaults;
    const desiredPower = psuSelected ? 'Redundant' : modelDefaults.power;
    if (config.power !== desiredPower) setConfig((p) => ({ ...p, power: desiredPower }));
  }, [config.accessories, config.model]); // eslint-disable-line react-hooks/exhaustive-deps

  const shareUrl = useMemo(() => {
    const base = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';
    return `${base}?c=${encodeConfig(config)}`;
  }, [config]);

  const summary = useMemo(
    () =>
      [
        `Doporučený model: ${recommendedModel.name} (${recommendedModel.segment})`,
        `Zařízení: ${DEVICE_BANDS.find((b) => b.id === devBand)?.label}`,
        `Požadovaná přesnost: ${ACCURACY_LEVELS.find((a) => a.id === accuracy)?.label}`,
        `Holdover: ${config.oscillator}`,
        `Síť: ${config.lan}× LAN, ${config.sfp}× SFP`,
        `Napájení: ${config.power}${config.redundantGnss ? ', redundantní GNSS' : ''}`,
        config.ptpPorts ? `PTP porty: ${config.ptpPorts}` : undefined,
        `PTP profil: ${config.ptpProfile}`,
        `Doplňky: ${config.accessories.length ? config.accessories.join(', ') : '—'}`,
      ]
        .filter(Boolean)
        .join('\n'),
    [recommendedModel, devBand, accuracy, config]
  );

  // Handler pro klik na logo – návrat na titulní obrazovku
  const goHome = () => setStep(-1);

  /* ---------- UI ---------- */
  return (
    <div className="app" style={{ minHeight: '100vh', fontFamily: 'system-ui, Arial', color: '#111' }}>
      <div style={{ maxWidth: 1040, margin: '0 auto', padding: 24 }}>
        {/* HLAVIČKA – celá je klikací, návrat na titul */}
        <div
          onClick={goHome}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && goHome()}
          title="Zpět na titulní stránku"
          style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, cursor: 'pointer' }}
        >
          <div
            style={{
              width: 26,
              height: 26,
              overflow: 'hidden',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#f2f4f7',
              border: '1px solid #e5e7eb',
              flex: '0 0 auto',
            }}
          >
            <img
              src="https://www.westercom.eu/img/logo-1634110785.jpg"
              alt="W"
              style={{ height: '100%', objectFit: 'cover', objectPosition: 'left center', display: 'block' }}
            />
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: 0.2 }}>Westercom</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#444' }}>
            Konfigurátor časových serverů Elproma NTS
          </div>
        </div>

        <p style={{ color: '#555', fontSize: 14, marginTop: 0, marginBottom: 8 }}>
          Interaktivní průvodce, který pomůže vybrat správný časový server pro vaši infrastrukturu.
        </p>

        {/* Progress jen pro kroky 0–3 */}
        {step >= 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, margin: '16px 0 24px' }}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} style={{ height: 8, borderRadius: 999, background: i <= step ? '#111' : '#e5e5e5' }} />
            ))}
          </div>
        )}

        {/* ÚVOD */}
        {step === -1 && (
          <section style={box}>
            <div style={{ padding: 24, borderBottom: '1px solid #eee' }}>
              <h2 style={{ margin: 0 }}>Přehled časových serverů</h2>
              <p style={{ margin: '6px 0 0', color: '#555' }}>
                Seznam modelů s popisem a odkazem na datasheet. Nejste si jistí? Klikněte na{' '}
                <b>Spustit konfigurátor</b> a nechte se vést.
              </p>
            </div>

            <div style={{ padding: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 16 }}>
                {MODELS.map((m) => (
                  <article
                    key={m.id}
                    style={{
                      border: '1px solid #e5e5e5',
                      borderRadius: 16,
                      overflow: 'hidden',
                      background: '#fff',
                      boxShadow: '0 6px 24px rgba(0,0,0,.06)',
                    }}
                  >
                    <CardImage src={m.image} alt={m.name} label={m.name} />

                    <div style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 700 }}>{m.name}</div>
                      <div style={{ color: '#666', fontSize: 12, marginBottom: 6 }}>{m.segment}</div>
                      <p style={{ fontSize: 12, color: '#444', minHeight: 48, margin: '6px 0 0' }}>{m.notes}</p>
                      {m.datasheet && (
                        <div style={{ marginTop: 10 }}>
                          <a
                            href={m.datasheet}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              textDecoration: 'none',
                              padding: '8px 10px',
                              border: '1px solid #e5e5e5',
                              borderRadius: 10,
                              display: 'inline-block',
                            }}
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

            <div style={{ padding: '0 24px 24px', display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={() => setStep(0)}
                style={{ padding: '10px 14px', borderRadius: 10, background: '#111', color: '#fff', border: '1px solid #111' }}
              >
                Spustit konfigurátor
              </button>
            </div>
          </section>
        )}

        {/* 0) Zařízení */}
        {step === 0 && (
          <section style={box}>
            <div style={{ padding: 24, borderBottom: '1px solid #eee' }}>
              <b>1) Kolik zařízení potřebujete synchronizovat?</b>
            </div>
            <div style={{ padding: 24, display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
              <div>
                {DEVICE_BANDS.map((b) => (
                  <label
                    key={b.id}
                    style={{
                      display: 'flex',
                      gap: 12,
                      alignItems: 'center',
                      padding: 12,
                      border: '1px solid #e5e5e5',
                      borderRadius: 12,
                      cursor: 'pointer',
                      marginBottom: 8,
                    }}
                  >
                    <input type="radio" name="devBand" checked={devBand === b.id} onChange={() => setDevBand(b.id)} />
                    <span>{b.label}</span>
                  </label>
                ))}
              </div>
              <div style={{ background: '#fafafa', padding: 16, borderRadius: 12, fontSize: 12, color: '#555' }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>Průvodce výběrem</div>
                <ul style={{ marginLeft: 16 }}>
                  <li>Desítky klientů → NTP / základní PTP (PICO3 / NTS-3000).</li>
                  <li>Stovky až tisíce → výkonnější GM, SFP, redundance (NTS-4000/5000).</li>
                </ul>
              </div>
            </div>
            <div style={{ padding: '0 24px 24px', display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => setStep(-1)} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #ddd' }}>
                Zpět
              </button>
              <button
                onClick={() => setStep(1)}
                style={{ padding: '10px 14px', borderRadius: 10, background: '#111', color: '#fff', border: '1px solid #111' }}
              >
                Pokračovat
              </button>
            </div>
          </section>
        )}

        {/* 1) Přesnost */}
        {step === 1 && (
          <section style={box}>
            <div style={{ padding: 24, borderBottom: '1px solid #eee' }}>
              <b>2) Požadovaná přesnost</b>
            </div>
            <div style={{ padding: 24, display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
              <div>
                {ACCURACY_LEVELS.map((a) => (
                  <label
                    key={a.id}
                    style={{
                      display: 'flex',
                      gap: 12,
                      alignItems: 'start',
                      padding: 12,
                      border: '1px solid #e5e5e5',
                      borderRadius: 12,
                      cursor: 'pointer',
                      marginBottom: 8,
                    }}
                  >
                    <input type="radio" name="acc" checked={accuracy === a.id} onChange={() => setAccuracy(a.id)} />
                    <span>
                      <div style={{ fontWeight: 600 }}>{a.label}</div>
                      <div style={{ fontSize: 12, color: '#666' }}>{a.help}</div>
                    </span>
                  </label>
                ))}
              </div>
              <div style={{ background: '#fafafa', padding: 16, borderRadius: 12, fontSize: 12, color: '#555' }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>Vysvětlení</div>
                <p>
                  <b>NTP</b>: typicky milisekundy – pro běžné IT a logování.
                </p>
                <p>
                  <b>PTP Enterprise</b>: sub-ms až desítky µs (záleží na síti / HW timestamping).
                </p>
                <p>
                  <b>PTP Telecom/PRTC-A</b>: sub-µs v dobře navržené síti; často SFP a HW GM.
                </p>
                <p>
                  <b>ePRTC</b>: velmi dlouhý holdover (Rb), kritická infrastruktura.
                </p>
              </div>
            </div>
            <div style={{ padding: '0 24px 24px', display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => setStep(0)} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #ddd' }}>
                Zpět
              </button>
              <button
                onClick={() => setStep(2)}
                style={{ padding: '10px 14px', borderRadius: 10, background: '#111', color: '#fff', border: '1px solid #111' }}
              >
                Pokračovat
              </button>
            </div>
          </section>
        )}

        {/* 2) Doplňky */}
        {step === 2 && (
          <section style={box}>
            <div style={{ padding: 24, borderBottom: '1px solid #eee' }}>
              <b>3) Volitelné doplňky</b>
            </div>
            <div style={{ padding: 24, display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
              <div>
                {ACCESSORIES.map((a) => {
                  const checked = config.accessories.includes(a.name);
                  const disabled = a.allowed && !a.allowed.includes(config.model);

                  let labelText = a.name;
                  let titleHint: string | undefined = undefined;

                  if (a.id === 'psu' && disabled) {
                    if (config.model === 'nts-5000') {
                      labelText = 'Dual Redundant Power Supply automaticky součástí';
                      titleHint = 'U NTS-5000 je duální napájení součástí dodávky.';
                    } else {
                      titleHint = 'Pouze pro model NTS-3000';
                      labelText = `${a.name} (jen NTS-3000)`;
                    }
                  }

                  return (
                    <label
                      key={a.id}
                      title={titleHint}
                      style={{
                        display: 'flex',
                        gap: 12,
                        alignItems: 'center',
                        padding: 12,
                        border: '1px solid #e5e5e5',
                        borderRadius: 12,
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        marginBottom: 8,
                        opacity: disabled ? 0.55 : 1,
                        background: disabled ? '#fafafa' : undefined,
                      }}
                    >
                      <input
                        type="checkbox"
                        disabled={disabled}
                        checked={checked}
                        onChange={(e) => {
                          if (disabled) return;
