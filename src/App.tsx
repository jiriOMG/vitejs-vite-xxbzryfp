import { useEffect, useMemo, useState } from 'react';

/** NTS CONFIGURÁTOR
 * Flow: (-1) úvod → 0) počet zařízení → 1) přesnost → 2) doplňky → 3) kontakty & export
 */

/* ---------- Typy ---------- */
type ModelId = 'nts-pico3' | 'nts-3000' | 'nts-4000' | 'nts-5000';
type DevBand = 'small' | 'medium' | 'large' | 'xl';
type AccuracyId = 'ntp_ms' | 'ptp_ent' | 'ptp_prtc' | 'eprtc';

type ModelRec = {
  id: ModelId;
  name: string;
  segment: string;
  image?: string;
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
  /** volitelné: doplněk je povolen jen pro tyto modely */
  allowed?: ModelId[];
};

/* ---------- Data ---------- */
const MODELS: ModelRec[] = [
  {
    id: 'nts-pico3',
    name: 'NTS-PICO3',
    segment: 'Kompaktní | NTP/PTP (edge)',
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
    notes:
      'Pro stovky až tisíce klientů, SFP, redundance, sub-µs (telekom/utility). Duální napájení je součástí (automaticky).',
  },
  {
    id: 'nts-5000',
    name: 'NTS-5000',
    segment: 'ePRTC / PRTC A/B | rubidium',
    image: 'https://www.westercom.eu/img/logo-1634110785.jpg',
    datasheet: 'https://www.elpromaelectronics.com/products/',
    defaults: { oscillator: 'Rb', gnss: ['GNSS'], lan: 6, sfp: 2, power: 'Redundant', redundantGnss: true },
    notes:
      'Pro velké/kritické instalace, ePRTC, dlouhý holdover, tisíce klientů. Duální napájení je součástí (automaticky).',
  },
];

const ACCESSORIES: Accessory[] = [
  { id: 'antenna', name: 'NTS-antenna – náhradní anténa (1 ks je již v balení)' },
  { id: 'irig', name: 'IRIG-B IN/OUT module w/ 1PPS output' },
  // PSU je jen pro NTS-3000
  { id: 'psu', name: 'Dual Redundant Power Supply', allowed: ['nts-3000'] },
  // přejmenováno
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
  const [step, setStep] = useState(-1); // -1 = intro
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

  // doporučení + defaulty při změně rozhodovacích vstupů
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
    }));
  }, [recommendedId]);

  // při změně modelu odstraň nepovolené doplňky (např. PSU mimo NTS-3000)
  useEffect(() => {
    const allowedSet = new Set(
      ACCESSORIES.filter((a) => !a.allowed || a.allowed.includes(config.model)).map((a) => a.name)
    );
    const filtered = config.accessories.filter((n) => allowedSet.has(n));
    if (filtered.length !== config.accessories.length) {
      setConfig((p) => ({ ...p, accessories: filtered }));
    }
  }, [config.model]); // eslint-disable-line react-hooks/exhaustive-deps

  // pokud je zvolen PSU → power=Redundant; jinak zpět na default daného modelu
  useEffect(() => {
    const psuSelected = config.accessories.includes('Dual Redundant Power Supply');
    const modelDefaults = MODELS.find((m) => m.id === config.model)!.defaults;
    const desiredPower = psuSelected ? 'Redundant' : modelDefaults.power;
    if (config.power !== desiredPower) {
      setConfig((p) => ({ ...p, power: desiredPower }));
    }
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
        `PTP profil: ${config.ptpProfile}`,
        `Doplňky: ${config.accessories.length ? config.accessories.join(', ') : '—'}`,
      ].join('\n'),
    [recommendedModel, devBand, accuracy, config]
  );

  /* ---------- UI ---------- */
  return (
    <div className="app" style={{ minHeight: '100vh', fontFamily: 'system-ui, Arial', color: '#111' }}>
      <div style={{ maxWidth: 1040, margin: '0 auto', padding: 24 }}>
        <header style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: 0.2 }}>Westercom</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#444' }}>
            Konfigurátor časových serverů Elproma NTS
          </div>
        </header>
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

        {/* Úvod */}
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
                    {/* Obrázek – vycentrovaný, bez ořezu */}
                    <div
                      style={{
                        height: 140,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#f6f7f9',
                        borderBottom: '1px solid #eee',
                      }}
                    >
                      {m.image && (
                        <img
                          src={m.image}
                          alt={m.name}
                          loading="lazy"
                          style={{ maxWidth: '78%', maxHeight: '80%', objectFit: 'contain', objectPosition: 'center', display: 'block' }}
                        />
                      )}
                    </div>

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

        {/* 0) Počet zařízení */}
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
                  const hint = a.id === 'psu' && disabled ? 'Pouze pro model NTS-3000' : undefined;

                  return (
                    <label
                      key={a.id}
                      title={hint}
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
                          const set = new Set(config.accessories);
                          e.target.checked ? set.add(a.name) : set.delete(a.name);
                          setConfig({ ...config, accessories: Array.from(set) });
                        }}
                      />
                      <span>{a.name}{hint ? ' (jen NTS-3000)' : ''}</span>
                    </label>
                  );
                })}
              </div>

              <div style={{ background: '#fafafa', padding: 16, borderRadius: 12, fontSize: 14 }}>
                <div style={{ fontWeight: 600 }}>Doporučený model</div>
                <div style={{ fontWeight: 600, marginTop: 6 }}>{recommendedModel.name}</div>
                <div style={{ fontSize: 12, color: '#666' }}>{recommendedModel.segment}</div>
                <p style={{ fontSize: 12, color: '#666', marginTop: 8 }}>{recommendedModel.notes}</p>
              </div>
            </div>
            <div style={{ padding: '0 24px 24px', display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => setStep(1)} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #ddd' }}>
                Zpět
              </button>
              <button
                onClick={() => setStep(3)}
                style={{ padding: '10px 14px', borderRadius: 10, background: '#111', color: '#fff', border: '1px solid #111' }}
              >
                Pokračovat
              </button>
            </div>
          </section>
        )}

        {/* 3) Kontakty & export */}
        {step === 3 && (
          <section style={box}>
            <div style={{ padding: 24, borderBottom: '1px solid #eee' }}>
              <b>4) Kontakty & export</b>
            </div>
            <div style={{ padding: 24, display: 'grid', gap: 24, gridTemplateColumns: '1fr 1fr' }}>
              <div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, color: '#555' }}>Společnost</label>
                  <input
                    style={{ marginTop: 6, width: '100%', border: '1px solid #ddd', borderRadius: 8, padding: '8px 10px' }}
                    value={config.company}
                    onChange={(e) => setConfig({ ...config, company: e.target.value })}
                    placeholder="Název společnosti"
                  />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, color: '#555' }}>Kontakt</label>
                  <input
                    style={{ marginTop: 6, width: '100%', border: '1px solid #ddd', borderRadius: 8, padding: '8px 10px' }}
                    value={config.contact}
                    onChange={(e) => setConfig({ ...config, contact: e.target.value })}
                    placeholder="E-mail / telefon"
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#555' }}>Poznámky</label>
                  <textarea
                    rows={4}
                    style={{ marginTop: 6, width: '100%', border: '1px solid #ddd', borderRadius: 8, padding: '8px 10px' }}
                    value={config.notes}
                    onChange={(e) => setConfig({ ...config, notes: e.target.value })}
                    placeholder="Požadavky, normy, prostředí…"
                  />
                </div>
              </div>

              <div>
                <div style={{ background: '#fafafa', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Shrnutí</div>
                  <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, color: '#333' }}>{summary}</pre>
                </div>

                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <button
                    onClick={() => navigator.clipboard.writeText(shareUrl)}
                    style={{ padding: '10px 14px', borderRadius: 10, background: '#111', color: '#fff', border: '1px solid #111' }}
                  >
                    Zkopírovat odkaz
                  </button>
                  <button
                    onClick={() => {
                      const blob = new Blob([JSON.stringify({ decision: { devBand, accuracy }, ...config }, null, 2)], {
                        type: 'application/json',
                      });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${recommendedModel.id}-konfigurace.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #ddd' }}
                  >
                    Stáhnout JSON
                  </button>
                </div>

                <div style={{ border: '1px solid #eee', borderRadius: 12, padding: 10, fontSize: 12 }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Permalink</div>
                  <textarea readOnly value={shareUrl} style={{ width: '100%', height: 80 }} />
                </div>
              </div>
            </div>

            <div style={{ padding: '0 24px 24px', display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => setStep(2)} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #ddd' }}>
                Zpět
              </button>
              <button
                onClick={() => {
                  setStep(0);
                  setConfig((c) => ({ ...c, accessories: [], company: '', contact: '', notes: '' }));
                }}
                style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #ddd' }}
              >
                Nová konfigurace
              </button>
            </div>
          </section>
        )}

        <div style={{ marginTop: 24, fontSize: 12, color: '#666' }}>
          © {new Date().getFullYear()} Konfigurátor – rozhodovací průvodce (interní testování).
        </div>
      </div>
    </div>
  );
}
