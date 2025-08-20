import React, { useEffect, useMemo, useState } from 'react';

/* =========================
   Typy
========================= */
type ModelId = 'nts-pico3' | 'nts-3000' | 'nts-4000' | 'nts-5000';
type DevBand = 'small' | 'medium' | 'large' | 'xl';
type AccuracyId = 'ntp_ms' | 'ptp_ent' | 'ptp_prtc' | 'eprtc';

type Accessory = {
  id: string;
  name: string;
  description: string;
  /** Pokud je vyplněno, doplněk je vybíratelný pouze pro uvedené modely. */
  allowed?: ModelId[];
};

/* =========================
   Data
========================= */
const MODELS: {
  id: ModelId;
  name: string;
  segment: string;
  notes: string;
  img?: string | null; // volitelné (pokud /public/img/* existuje)
  defaults: {
    oscillator: 'TCXO' | 'OCXO' | 'Rb';
    gnss: string[];
    lan: number;
    sfp: number;
    power: 'Single' | 'Redundant';
    redundantGnss: boolean;
    ptpPorts?: number; // jen NTS-5000
  };
  datasheet?: string | null;
}[] = [
  {
    id: 'nts-pico3',
    name: 'NTS-PICO3',
    segment: 'Kompaktní | NTP/PTP (edge)',
    notes: 'Pro malé sítě (desítky klientů), přesnost ms (NTP) / základní PTP.',
    img: '/img/nts-pico3.jpg', // volitelné; pokud soubor není, karta zobrazí fallback
    datasheet: null, // není dodán přesný odkaz; necháme tlačítko disabled
    defaults: {
      oscillator: 'TCXO',
      gnss: ['GNSS'],
      lan: 1,
      sfp: 0,
      power: 'Single',
      redundantGnss: false,
    },
  },
  {
    id: 'nts-3000',
    name: 'NTS-3000',
    segment: 'PTP Grandmaster | NTP Stratum-1',
    notes: 'Pro stovky klientů, enterprise PTP (sub-ms až desítky µs).',
    img: '/img/nts-3000.jpg',
    datasheet:
      'https://www.elpromaelectronics.com/wp-content/uploads/woocommerce_uploads/2023/05/TimeSystems_NTS_3000_120525-tamqzn.pdf',
    defaults: {
      oscillator: 'OCXO',
      gnss: ['GNSS'],
      lan: 2,
      sfp: 0,
      power: 'Single',
      redundantGnss: false,
    },
  },
  {
    id: 'nts-4000',
    name: 'NTS-4000',
    segment: 'PTP/PRTC-A | vyšší kapacita',
    notes:
      'Pro stovky až tisíce klientů, SFP, redundance, sub-µs (telekom/utility). Duální napájení je součástí (automaticky).',
    img: '/img/nts-4000.jpg',
    datasheet:
      'https://www.elpromaelectronics.com/wp-content/uploads/woocommerce_uploads/2023/05/TimeSystems_NTS_4000_120525-t2ham9.pdf',
    defaults: {
      oscillator: 'OCXO',
      gnss: ['GNSS'],
      lan: 4,
      sfp: 2,
      power: 'Redundant',
      redundantGnss: true,
    },
  },
  {
    id: 'nts-5000',
    name: 'NTS-5000',
    segment: 'ePRTC / PRTC A/B | rubidium',
    notes:
      'Pro velké/kritické instalace, ePRTC, dlouhý holdover, tisíce klientů. Duální napájení je součástí (automaticky).',
    img: '/img/nts-5000.jpg',
    datasheet:
      'https://www.elpromaelectronics.com/wp-content/uploads/woocommerce_uploads/2023/05/TimeSystems_NTS_5000_120525-eozbhw.pdf',
    defaults: {
      oscillator: 'Rb',
      gnss: ['GNSS'],
      lan: 6,
      sfp: 2,
      power: 'Redundant',
      redundantGnss: true,
      ptpPorts: 2,
    },
  },
];

const ACCESSORIES: Accessory[] = [
  {
    id: 'antenna',
    name: 'NTS-antenna – náhradní anténa (1 ks je již v balení)',
    description:
      'Externí GNSS anténa jako náhradní kus nebo pro rozšíření instalace. Hodí se mít v rezervě; kabel/úchyt dle konkrétního provedení.',
  },
  {
    id: 'irig',
    name: 'IRIG-B IN/OUT module w/ 1PPS output',
    description:
      'Modul s rozhraním IRIG-B (vstup/výstup) a signálem 1PPS. Slouží k synchronizaci se systémy v energetice/průmyslu a k distribuci přesného času.',
  },
  {
    id: 'psu',
    name: 'Dual Redundant Power Supply',
    description:
      'Dvojité napájení A/B pro zvýšení dostupnosti. U NTS-4000/5000 je součástí dodávky automaticky; u NTS-3000 lze doobjednat.',
    allowed: ['nts-3000'], // volitelné jen pro 3000
  },
  {
    id: 'fo',
    name: 'Fibre Optic Antenna Set',
    description:
      'Sada pro napojení GNSS antény přes optické vlákno – pro dlouhé trasy, galvanické oddělení a bleskovou ochranu.',
  },
  {
    id: '5071a',
    name: '5071A special support (firmware)',
    description:
      'Firmware pro speciální podporu cesiového etalonu HP/Agilent 5071A (disciplining/monitoring 10 MHz/1PPS).',
  },
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

/* =========================
   Helpers
========================= */
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
  if (acc === 'ptp_ent')
    return devBand === 'large' || devBand === 'xl' ? 'nts-4000' : 'nts-3000';
  // ntp_ms
  if (devBand === 'small') return 'nts-pico3';
  if (devBand === 'medium') return 'nts-3000';
  return 'nts-4000';
}

/* =========================
   Komponenta
========================= */
export default function App() {
  const [screen, setScreen] = useState<'home' | 'wizard'>('home');
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
    ptpPorts: undefined as number | undefined, // jen pro 5000
  }));

  // načtení sdílené konfigurace
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const c = new URLSearchParams(window.location.search).get('c');
    const dec = c ? decodeConfig(c) : null;
    if (dec) {
      setConfig(dec);
      setScreen('wizard');
    }
  }, []);

  // doporučený model a objekt modelu
  const recommendedId = useMemo(
    () => recommendModel(devBand, accuracy),
    [devBand, accuracy]
  );
  const recommendedModel = useMemo(
    () => MODELS.find((m) => m.id === recommendedId)!,
    [recommendedId]
  );

  // při změně doporučení nastav defaulty daného modelu
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
      ptpPorts: m.defaults.ptpPorts, // jen pro 5000 (undefined jinde)
    }));
  }, [recommendedId]);

  // pokud uživatel vybere PSU a mezitím přejde na model kde je PSU automaticky,
  // necháme výběr beze změny (je to pouze kosmetické – ve shrnutí je jasné, že u 4000/5000 je PSU auto)
  // NTS-5000: výběr PTP portů
  const ptpPortsOptions = [1, 2, 3, 4];

  const shareUrl = useMemo(() => {
    const base =
      typeof window !== 'undefined'
        ? window.location.origin + window.location.pathname
        : '';
    return `${base}?c=${encodeConfig({
      decision: { devBand, accuracy },
      ...config,
    })}`;
  }, [config, devBand, accuracy]);

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
        recommendedId === 'nts-5000' && config.ptpPorts
          ? `PTP porty: ${config.ptpPorts}`
          : '',
        `PTP profil: ${config.ptpProfile}`,
        `Doplňky: ${
          config.accessories.length ? config.accessories.join(', ') : '—'
        }`,
      ]
        .filter(Boolean)
        .join('\n'),
    [recommendedModel, devBand, accuracy, config, recommendedId]
  );

  /* =========================
     UI — společné styly (inline)
  ========================= */
  const cardBox: React.CSSProperties = {
    border: '1px solid #e5e5e5',
    borderRadius: 16,
    boxShadow: '0 1px 8px rgba(0,0,0,.06)',
    background: '#fff',
  };

  const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
    title,
    children,
  }) => (
    <section style={cardBox}>
      <div
        style={{
          padding: 20,
          borderBottom: '1px solid #eee',
          fontWeight: 600,
        }}
      >
        {title}
      </div>
      {children}
    </section>
  );

  const Logo: React.FC = () => (
    <div
      onClick={() => {
        setScreen('home');
        setStep(0);
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        cursor: 'pointer',
        userSelect: 'none',
      }}
      title="Zpět na titulní stranu"
    >
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          background:
            'linear-gradient(135deg, rgba(0,102,255,.95), rgba(0,170,255,.95))',
        }}
      />
      <div style={{ fontWeight: 700 }}>Westercom</div>
    </div>
  );

  /* =========================
     Obrazovky
  ========================= */

  // Úvodní katalog
  const HomeScreen = () => (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <Logo />
      </header>

      <div
        style={{
          ...cardBox,
          padding: 20,
          marginBottom: 16,
        }}
      >
        <div
          style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}
        >{`Přehled časových serverů`}</div>
        <div style={{ color: '#444' }}>
          Seznam modelů s popisem a odkazem na datasheet. Nejste si jisti?
          Klikněte na <b>Spustit konfigurátor</b> a nechte se vést.
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: 16,
        }}
      >
        {MODELS.map((m) => (
          <div key={m.id} style={cardBox}>
            {/* Obrázek / fallback */}
            <div
              style={{
                height: 140,
                borderBottom: '1px solid #eee',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                background: '#fafafa',
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
              }}
            >
              {m.img ? (
                // obrázek se načte až když existuje v /public/img
                <img
                  src={m.img}
                  alt={m.name}
                  style={{
                    maxHeight: 120,
                    objectFit: 'contain',
                    width: '100%',
                  }}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                    // necháme fallback text níže
                  }}
                />
              ) : (
                <div
                  style={{
                    fontWeight: 700,
                    color: '#333',
                  }}
                >
                  {m.name}
                </div>
              )}
            </div>

            <div style={{ padding: 16 }}>
              <div style={{ fontWeight: 700 }}>{m.name}</div>
              <div style={{ fontSize: 12, color: '#666' }}>{m.segment}</div>
              <p style={{ fontSize: 12, color: '#555', marginTop: 8 }}>
                {m.notes}
              </p>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  disabled={!m.datasheet}
                  onClick={() => m.datasheet && window.open(m.datasheet, '_blank')}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 10,
                    border: '1px solid #ddd',
                    cursor: m.datasheet ? 'pointer' : 'not-allowed',
                    opacity: m.datasheet ? 1 : 0.6,
                    background: '#fff',
                  }}
                >
                  Datasheet
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <button
          onClick={() => {
            setScreen('wizard');
            setStep(0);
            window.scrollTo(0, 0);
          }}
          style={{
            padding: '10px 16px',
            borderRadius: 10,
            background: '#111',
            color: '#fff',
            border: '1px solid #111',
          }}
        >
          Spustit konfigurátor
        </button>
      </div>

      <footer style={{ marginTop: 24, fontSize: 12, color: '#666' }}>
        © {new Date().getFullYear()} Konfigurátor – rozhodovací průvodce.
      </footer>
    </div>
  );

  // Průvodce
  const WizardScreen = () => (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: 24 }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <Logo />
        <div style={{ color: '#444', fontSize: 12 }}>
          Průvodce: počet zařízení → požadovaná přesnost → doplňky → export.
        </div>
      </header>

      {/* Progress */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, margin: '12px 0 20px' }}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              height: 8,
              borderRadius: 999,
              background: i <= step ? '#111' : '#e5e5e5',
            }}
          />
        ))}
      </div>

      {/* 1) Devices */}
      {step === 0 && (
        <Section title="1) Kolik zařízení potřebujete synchronizovat?">
          <div
            style={{
              padding: 20,
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
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Průvodce výběrem</div>
              <ul style={{ marginLeft: 16 }}>
                <li>Desítky klientů → NTP / základní PTP (PICO3 / NTS-3000).</li>
                <li>Stovky až tisíce → výkonnější GM, SFP, redundance (NTS-4000/5000).</li>
              </ul>
            </div>
          </div>
          <div style={{ padding: '0 20px 20px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setStep(1)}
              style={{
                padding: '8px 12px',
                borderRadius: 10,
                background: '#111',
                color: '#fff',
                border: '1px solid #111',
              }}
            >
              Pokračovat
            </button>
          </div>
        </Section>
      )}

      {/* 2) Accuracy */}
      {step === 1 && (
        <Section title="2) Požadovaná přesnost">
          <div
            style={{
              padding: 20,
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
                    <div style={{ fontSize: 12, color: '#666' }}>{a.help}</div>
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
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Vysvětlení</div>
              <p>
                <b>NTP</b>: typicky milisekundy – pro běžné IT a logování.
              </p>
              <p>
                <b>PTP Enterprise</b>: sub-ms až desítky µs (záleží na síti / HW
                timestamping).
              </p>
              <p>
                <b>PTP Telecom/PRTC-A</b>: sub-µs v dobře navržené síti; často SFP a HW GM.
              </p>
              <p>
                <b>ePRTC</b>: velmi dlouhý holdover (Rb), kritická infrastruktura.
              </p>
            </div>
          </div>
          <div
            style={{
              padding: '0 20px 20px',
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
                background: '#fff',
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
                border: '1px solid #111',
              }}
            >
              Pokračovat
            </button>
          </div>
        </Section>
      )}

      {/* 3) Accessories + doporučený model + NTS-5000 PTP porty */}
      {step === 2 && (
        <Section title="3) Volitelné doplňky">
          <div
            style={{
              padding: 20,
              display: 'grid',
              gap: 12,
              gridTemplateColumns: '1fr 1fr',
            }}
          >
            <div>
              {ACCESSORIES.map((a) => {
                const checked = config.accessories.includes(a.name);
                const allowed =
                  !a.allowed || a.allowed.includes(recommendedId);
                const disabled =
                  !allowed ||
                  ((recommendedId === 'nts-4000' || recommendedId === 'nts-5000') &&
                    a.id === 'psu'); // PSU je u 4000/5000 automaticky

                const labelText =
                  a.id === 'psu' &&
                  (recommendedId === 'nts-4000' || recommendedId === 'nts-5000')
                    ? 'Dual Redundant Power Supply (automaticky součástí)'
                    : a.name;

                const titleHint = !allowed
                  ? 'Tento doplněk není dostupný pro doporučený model.'
                  : disabled && a.id === 'psu'
                  ? 'U NTS-4000/5000 je duální napájení součástí.'
                  : a.description;

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
                      opacity: disabled ? 0.6 : 1,
                      background: disabled ? '#fafafa' : '#fff',
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
                        setConfig({
                          ...config,
                          accessories: Array.from(set),
                        });
                      }}
                    />
                    <span>
                      <div style={{ fontWeight: 600 }}>{labelText}</div>
                      <div style={{ fontSize: 12, color: '#666' }}>
                        {a.description}
                      </div>
                    </span>
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
              <div style={{ fontWeight: 700 }}>Doporučený model</div>
              <div style={{ fontWeight: 700, marginTop: 6 }}>
                {recommendedModel.name}
              </div>
              <div style={{ fontSize: 12, color: '#666' }}>
                {recommendedModel.segment}
              </div>
              <p style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
                {recommendedModel.notes}
              </p>

              {/* NTS-5000: výběr počtu PTP portů */}
              {recommendedId === 'nts-5000' && (
                <div
                  style={{
                    marginTop: 12,
                    paddingTop: 12,
                    borderTop: '1px dashed #ddd',
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>
                    Počet PTP portů (NTS-5000)
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {ptpPortsOptions.map((n) => (
                      <label
                        key={n}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '6px 10px',
                          border: '1px solid #e5e5e5',
                          borderRadius: 10,
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="radio"
                          name="ptpPorts"
                          checked={config.ptpPorts === n}
                          onChange={() =>
                            setConfig((c) => ({ ...c, ptpPorts: n }))
                          }
                        />
                        {n}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              padding: '0 20px 20px',
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
                background: '#fff',
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
                border: '1px solid #111',
              }}
            >
              Pokračovat
            </button>
          </div>
        </Section>
      )}

      {/* 4) Contacts & export */}
      {step === 3 && (
        <Section title="4) Kontakty & export">
          <div
            style={{
              padding: 20,
              display: 'grid',
              gap: 24,
              gridTemplateColumns: '1fr 1fr',
            }}
          >
            {/* Kontakty */}
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
                <label style={{ fontSize: 12, color: '#555' }}>Poznámky</label>
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

            {/* Shrnutí + export */}
            <div>
              <div
                style={{
                  background: '#fafafa',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 6 }}>Shrnutí</div>
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
                    border: '1px solid #111',
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
                    background: '#fff',
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
                <textarea
                  readOnly
                  value={shareUrl}
                  style={{
                    width: '100%',
                    height: 72,
                    fontFamily:
                      'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                    fontSize: 11,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    border: '1px solid #e5e5e5',
                    borderRadius: 8,
                    padding: '6px 8px',
                  }}
                />
              </div>
            </div>
          </div>

          <div
            style={{
              padding: '0 20px 20px',
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
                background: '#fff',
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
                background: '#fff',
              }}
            >
              Nová konfigurace
            </button>
          </div>
        </Section>
      )}

      <footer style={{ marginTop: 24, fontSize: 12, color: '#666' }}>
        © {new Date().getFullYear()} Konfigurátor – rozhodovací průvodce.
      </footer>
    </div>
  );

  return (
    <div className="app" style={{ minHeight: '100vh', color: '#111', background: '#fff' }}>
      {screen === 'home' ? <HomeScreen /> : <WizardScreen />}
    </div>
  );
}
