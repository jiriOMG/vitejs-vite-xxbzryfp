import { useEffect, useMemo, useState } from 'react';

/**
 * NTS CONFIGURÁTOR – rozhodovací průvodce
 * Flow: 1) počet zařízení → 2) požadovaná přesnost → 3) doplňky → 4) kontakty & export
 * Bez externích UI knihoven, vše inline CSS (funguje ve Vite + TS hned po vložení).
 */

/* ---------- Data ---------- */
type ModelId = 'nts-pico3' | 'nts-3000' | 'nts-4000' | 'nts-5000';
type DevBand = 'small' | 'medium' | 'large' | 'xl';
type AccuracyId = 'ntp_ms' | 'ptp_ent' | 'ptp_prtc' | 'eprtc';

const MODELS: {
  id: ModelId;
  name: string;
  segment: string;
  defaults: {
    oscillator: 'TCXO' | 'OCXO' | 'Rb';
    gnss: string[];
    lan: number;
    sfp: number;
    power: 'Single' | 'Redundant';
    redundantGnss: boolean;
  };
  notes: string;
}[] = [
  {
    id: 'nts-pico3',
    name: 'NTS-PICO3',
    segment: 'Kompaktní | NTP/PTP (edge)',
    defaults: {
      oscillator: 'TCXO',
      gnss: ['GNSS'],
      lan: 1,
      sfp: 0,
      power: 'Single',
      redundantGnss: false,
    },
    notes: 'Pro malé sítě (desítky klientů), přesnost ms (NTP) / základní PTP.',
  },
  {
    id: 'nts-3000',
    name: 'NTS-3000',
    segment: 'PTP Grandmaster | NTP Stratum-1',
    defaults: {
      oscillator: 'OCXO',
      gnss: ['GNSS'],
      lan: 2,
      sfp: 0,
      power: 'Single',
      redundantGnss: false,
    },
    notes: 'Pro stovky klientů, enterprise PTP (sub-ms až desítky µs).',
  },
  {
    id: 'nts-4000',
    name: 'NTS-4000',
    segment: 'PTP/PRTC-A | vyšší kapacita',
    defaults: {
      oscillator: 'OCXO',
      gnss: ['GNSS'],
      lan: 4,
      sfp: 2,
      power: 'Redundant',
      redundantGnss: true,
    },
    notes:
      'Pro stovky až tisíce klientů, SFP, redundance, sub-µs (telekom/utility).',
  },
  {
    id: 'nts-5000',
    name: 'NTS-5000',
    segment: 'ePRTC / PRTC A/B | rubidium',
    defaults: {
      oscillator: 'Rb',
      gnss: ['GNSS'],
      lan: 6,
      sfp: 2,
      power: 'Redundant',
      redundantGnss: true,
    },
    notes:
      'Pro velké/kritické instalace, ePRTC, dlouhý holdover, tisíce klientů.',
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
  {
    id: 'ntp_ms',
    label: 'NTP – milisekundy',
    help: 'běžná IT síť, logy, servery, CCTV',
  },
  {
    id: 'ptp_ent',
    label: 'PTP Enterprise – sub-ms až desítky µs',
    help: 'datacentra, průmysl, trading edge',
  },
  {
    id: 'ptp_prtc',
    label: 'PTP Telecom/PRTC-A – sub-µs',
    help: 'telekom/utility, synchronizace sítí',
  },
  {
    id: 'eprtc',
    label: 'ePRTC / dlouhý holdover',
    help: 'kritická infrastruktura, rubidium',
  },
];

/* ---------- Helpers ---------- */
const pill = (active: boolean) => ({
  height: 8,
  borderRadius: 999,
  background: active ? '#111' : '#e5e5e5',
});

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
  try {
    return JSON.parse(decodeURIComponent(escape(atob(str))));
  } catch {
    return null;
  }
};

/* ---------- Recommendation rules ---------- */
function recommendModel(devBand: DevBand, acc: AccuracyId): ModelId {
  if (acc === 'eprtc') return 'nts-5000';
  if (acc === 'ptp_prtc') return devBand === 'xl' ? 'nts-5000' : 'nts-4000';
  if (acc === 'ptp_ent')
    return devBand === 'large' || devBand === 'xl' ? 'nts-4000' : 'nts-3000';
  // ntp_ms
  if (devBand === 'small') return 'nts-pico3';
  if (devBand === 'medium') return 'nts-3000';
  return 'nts-4000';
}

/* ---------- App ---------- */
export default function App() {
  const [step, setStep] = useState(0);
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

  // model doporučení + defaulty
  const recommendedId = useMemo(
    () => recommendModel(devBand, accuracy),
    [devBand, accuracy]
  );
  const recommendedModel = useMemo(
    () => MODELS.find((m) => m.id === recommendedId)!,
    [recommendedId]
  );

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

  // accessory → redundant PSU sync
  useEffect(() => {
    const wantsRedundant = config.accessories.includes(
      'Dual Redundant Power Supply'
    );
    setConfig((prev) => ({
      ...prev,
      power: wantsRedundant ? 'Redundant' : prev.power,
    }));
  }, [config.accessories]);

  const shareUrl = useMemo(() => {
    const base =
      typeof window !== 'undefined'
        ? window.location.origin + window.location.pathname
        : '';
    return `${base}?c=${encodeConfig(config)}`;
  }, [config]);

  const summary = useMemo(
    () =>
      [
        `Doporučený model: ${recommendedModel.name} (${recommendedModel.segment})`,
        `Zařízení: ${DEVICE_BANDS.find((b) => b.id === devBand)?.label}`,
        `Požadovaná přesnost: ${
          ACCURACY_LEVELS.find((a) => a.id === accuracy)?.label
        }`,
        `Holdover: ${config.oscillator}`,
        `Síť: ${config.lan}× LAN, ${config.sfp}× SFP`,
        `Napájení: ${config.power}${
          config.redundantGnss ? ', redundantní GNSS' : ''
        }`,
        `PTP profil: ${config.ptpProfile}`,
        `Doplňky: ${
          config.accessories.length ? config.accessories.join(', ') : '—'
        }`,
      ].join('\n'),
    [recommendedModel, devBand, accuracy, config]
  );

  return (
    <div
      style={{
        minHeight: '100vh',
        fontFamily: 'system-ui, Arial',
        color: '#111',
      }}
    >
      <div style={{ maxWidth: 960, margin: '0 auto', padding: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 600 }}>
          Konfigurátor časových serverů Elproma NTS
        </h1>
        <p style={{ color: '#555', fontSize: 14 }}>
          Průvodce: počet zařízení → požadovaná přesnost → doplňky → export.
        </p>

        {/* Progress */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4,1fr)',
            gap: 8,
            margin: '16px 0 24px',
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={pill(i <= step)} />
          ))}
        </div>

        {/* 1) Devices */}
        {step === 0 && (
          <section style={box}>
            <div style={{ padding: 24, borderBottom: '1px solid #eee' }}>
              <b>1) Kolik zařízení potřebujete synchronizovat?</b>
            </div>
            <div
              style={{
                padding: 24,
                display: 'grid',
                gap: 12,
                gridTemplateColumns: '1fr 1fr',
              }}
            >
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
              <div
                style={{
                  background: '#fafafa',
                  padding: 16,
                  borderRadius: 12,
                  fontSize: 12,
                  color: '#555',
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 6 }}>
                  Průvodce výběrem
                </div>
                <ul style={{ marginLeft: 16 }}>
                  <li>
                    Desítky klientů → NTP / základní PTP (PICO3 / NTS-3000).
                  </li>
                  <li>
                    Stovky až tisíce → výkonnější GM, SFP, redundance
                    (NTS-4000/5000).
                  </li>
                </ul>
              </div>
            </div>
            <div
              style={{
                padding: '0 24px 24px',
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <button
                onClick={() => setStep(1)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 10,
                  background: '#111',
                  color: '#fff',
                }}
              >
                Pokračovat
              </button>
            </div>
          </section>
        )}

        {/* 2) Accuracy */}
        {step === 1 && (
          <section style={box}>
            <div style={{ padding: 24, borderBottom: '1px solid #eee' }}>
              <b>2) Požadovaná přesnost</b>
            </div>
            <div
              style={{
                padding: 24,
                display: 'grid',
                gap: 12,
                gridTemplateColumns: '1fr 1fr',
              }}
            >
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
                    <input
                      type="radio"
                      name="acc"
                      checked={accuracy === a.id}
                      onChange={() => setAccuracy(a.id)}
                    />
                    <span>
                      <div style={{ fontWeight: 600 }}>{a.label}</div>
                      <div style={{ fontSize: 12, color: '#666' }}>
                        {a.help}
                      </div>
                    </span>
                  </label>
                ))}
              </div>
              <div
                style={{
                  background: '#fafafa',
                  padding: 16,
                  borderRadius: 12,
                  fontSize: 12,
                  color: '#555',
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 6 }}>
                  Vysvětlení
                </div>
                <p>
                  <b>NTP</b>: typicky milisekundy – pro běžné IT a logování.
                </p>
                <p>
                  <b>PTP Enterprise</b>: sub-ms až desítky µs (záleží na síti /
                  HW timestamping).
                </p>
                <p>
                  <b>PTP Telecom/PRTC-A</b>: sub-µs v dobře navržené síti; často
                  SFP a HW GM.
                </p>
                <p>
                  <b>ePRTC</b>: velmi dlouhý holdover (Rb), kritická
                  infrastruktura.
                </p>
              </div>
            </div>
            <div
              style={{
                padding: '0 24px 24px',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <button
                onClick={() => setStep(0)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 10,
                  border: '1px solid #ddd',
                }}
              >
                Zpět
              </button>
              <button
                onClick={() => setStep(2)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 10,
                  background: '#111',
                  color: '#fff',
                }}
              >
                Pokračovat
              </button>
            </div>
          </section>
        )}

        {/* 3) Accessories */}
        {step === 2 && (
          <section style={box}>
            <div style={{ padding: 24, borderBottom: '1px solid #eee' }}>
              <b>3) Volitelné doplňky</b>
            </div>
            <div
              style={{
                padding: 24,
                display: 'grid',
                gap: 12,
                gridTemplateColumns: '1fr 1fr',
              }}
            >
              <div>
                {ACCESSORIES.map((a) => {
                  const checked = config.accessories.includes(a.name);
                  return (
                    <label
                      key={a.id}
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
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const set = new Set(config.accessories);
                          e.target.checked
                            ? set.add(a.name)
                            : set.delete(a.name);
                          setConfig({
                            ...config,
                            accessories: Array.from(set),
                          });
                        }}
                      />
                      <span>{a.name}</span>
                    </label>
                  );
                })}
              </div>
              <div
                style={{
                  background: '#fafafa',
                  padding: 16,
                  borderRadius: 12,
                  fontSize: 14,
                }}
              >
                <div style={{ fontWeight: 600 }}>Doporučený model</div>
                <div style={{ fontWeight: 600, marginTop: 6 }}>
                  {recommendedModel.name}
                </div>
                <div style={{ fontSize: 12, color: '#666' }}>
                  {recommendedModel.segment}
                </div>
                <p style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
                  {recommendedModel.notes}
                </p>
              </div>
            </div>
            <div
              style={{
                padding: '0 24px 24px',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <button
                onClick={() => setStep(1)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 10,
                  border: '1px solid #ddd',
                }}
              >
                Zpět
              </button>
              <button
                onClick={() => setStep(3)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 10,
                  background: '#111',
                  color: '#fff',
                }}
              >
                Pokračovat
              </button>
            </div>
          </section>
        )}

        {/* 4) Contacts & export */}
        {step === 3 && (
          <section style={box}>
            <div style={{ padding: 24, borderBottom: '1px solid #eee' }}>
              <b>4) Kontakty & export</b>
            </div>
            <div
              style={{
                padding: 24,
                display: 'grid',
                gap: 24,
                gridTemplateColumns: '1fr 1fr',
              }}
            >
              <div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, color: '#555' }}>
                    Společnost
                  </label>
                  <input
                    style={{
                      marginTop: 6,
                      width: '100%',
                      border: '1px solid #ddd',
                      borderRadius: 8,
                      padding: '8px 10px',
                    }}
                    value={config.company}
                    onChange={(e) =>
                      setConfig({ ...config, company: e.target.value })
                    }
                    placeholder="Název společnosti"
                  />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, color: '#555' }}>Kontakt</label>
                  <input
                    style={{
                      marginTop: 6,
                      width: '100%',
                      border: '1px solid #ddd',
                      borderRadius: 8,
                      padding: '8px 10px',
                    }}
                    value={config.contact}
                    onChange={(e) =>
                      setConfig({ ...config, contact: e.target.value })
                    }
                    placeholder="E-mail / telefon"
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#555' }}>
                    Poznámky
                  </label>
                  <textarea
                    rows={4}
                    style={{
                      marginTop: 6,
                      width: '100%',
                      border: '1px solid #ddd',
                      borderRadius: 8,
                      padding: '8px 10px',
                    }}
                    value={config.notes}
                    onChange={(e) =>
                      setConfig({ ...config, notes: e.target.value })
                    }
                    placeholder="Požadavky, normy, prostředí…"
                  />
                </div>
              </div>

              <div>
                <div
                  style={{
                    background: '#fafafa',
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>
                    Shrnutí
                  </div>
                  <pre
                    style={{
                      whiteSpace: 'pre-wrap',
                      fontSize: 12,
                      color: '#333',
                    }}
                  >
                    {summary}
                  </pre>
                </div>

                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <button
                    onClick={() => navigator.clipboard.writeText(shareUrl)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 10,
                      background: '#111',
                      color: '#fff',
                    }}
                  >
                    Zkopírovat odkaz
                  </button>
                  <button
                    onClick={() => {
                      const blob = new Blob(
                        [
                          JSON.stringify(
                            { decision: { devBand, accuracy }, ...config },
                            null,
                            2
                          ),
                        ],
                        { type: 'application/json' }
                      );
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${recommendedModel.id}-konfigurace.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 10,
                      border: '1px solid #ddd',
                    }}
                  >
                    Stáhnout JSON
                  </button>
                </div>

                <div
                  style={{
                    border: '1px solid #eee',
                    borderRadius: 12,
                    padding: 10,
                    fontSize: 12,
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>
                    Permalink
                  </div>
                  <div
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={shareUrl}
                  >
                    {shareUrl}
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                padding: '0 24px 24px',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <button
                onClick={() => setStep(2)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 10,
                  border: '1px solid #ddd',
                }}
              >
                Zpět
              </button>
              <button
                onClick={() => {
                  setStep(0);
                  setConfig((c) => ({
                    ...c,
                    accessories: [],
                    company: '',
                    contact: '',
                    notes: '',
                  }));
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: 10,
                  border: '1px solid #ddd',
                }}
              >
                Nová konfigurace
              </button>
            </div>
          </section>
        )}

        <div style={{ marginTop: 24, fontSize: 12, color: '#666' }}>
          © {new Date().getFullYear()} Prototyp konfigurátoru – rozhodovací
          průvodce (interní testování).
        </div>
      </div>
    </div>
  );
}
