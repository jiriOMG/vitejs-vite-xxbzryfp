import React, { useEffect, useMemo, useState } from "react";

/**
 * Konfigurátor časových serverů Elproma NTS
 * Flow: Intro → 1) počet zařízení → 2) přesnost → 3) doplňky → 4) kontakty & export
 * Responzivní, bez externích UI knihoven.
 */

/* ---------- Typy ---------- */
type ModelId = "nts-pico3" | "nts-3000" | "nts-4000" | "nts-5000";
type DevBand = "small" | "medium" | "large" | "xl";
type AccuracyId = "ntp_ms" | "ptp_ent" | "ptp_prtc" | "eprtc";

type Model = {
  id: ModelId;
  name: string;
  segment: string;
  image: string; // /img/...
  defaults: {
    oscillator: "TCXO" | "OCXO" | "Rb";
    lan: number;
    sfp: number;
    power: "Single" | "Redundant";
    redundantGnss: boolean;
  };
  notes: string;
  datasheet?: { href: string; title?: string };
};

/* ---------- Data (modely) ---------- */
const MODELS: Model[] = [
  {
    id: "nts-pico3",
    name: "NTS-PICO3",
    segment: "Kompaktní | NTP/PTP (edge)",
    image: "/img/nts-pico3.jpg",
    defaults: {
      oscillator: "TCXO",
      lan: 1,
      sfp: 0,
      power: "Single",
      redundantGnss: false,
    },
    notes:
      "Pro malé sítě (desítky klientů), přesnost ms (NTP) / základní PTP.",
    // Požadavek byl "Datasheet k NTS-PICO3 je NTS-PICO3" – použijeme text v title.
    datasheet: { href: "#", title: "NTS-PICO3" },
  },
  {
    id: "nts-3000",
    name: "NTS-3000",
    segment: "PTP Grandmaster | NTP Stratum-1",
    image: "/img/nts-3000.jpg",
    defaults: {
      oscillator: "OCXO",
      lan: 2,
      sfp: 0,
      power: "Single",
      redundantGnss: false,
    },
    notes:
      "Pro stovky klientů, enterprise PTP (sub-ms až desítky µs). Redundantní napájení je volitelné.",
    datasheet: {
      href: "https://www.elpromaelectronics.com/wp-content/uploads/woocommerce_uploads/2023/05/TimeSystems_NTS_3000_120525-tamqzn.pdf",
    },
  },
  {
    id: "nts-4000",
    name: "NTS-4000",
    segment: "PTP/PRTC-A | vyšší kapacita",
    image: "/img/nts-4000.jpg",
    defaults: {
      oscillator: "OCXO",
      lan: 4,
      sfp: 2,
      power: "Redundant", // automaticky součástí
      redundantGnss: true,
    },
    notes:
      "Pro stovky až tisíce klientů, SFP, redundance, sub-µs (telekom/utility). Duální napájení je součástí (automaticky).",
    datasheet: {
      href: "https://www.elpromaelectronics.com/wp-content/uploads/woocommerce_uploads/2023/05/TimeSystems_NTS_4000_120525-t2ham9.pdf",
    },
  },
  {
    id: "nts-5000",
    name: "NTS-5000",
    segment: "ePRTC / PRTC A/B | rubidium",
    image: "/img/nts-5000.jpg",
    defaults: {
      oscillator: "Rb",
      lan: 6,
      sfp: 2,
      power: "Redundant", // automaticky součástí
      redundantGnss: true,
    },
    notes:
      "Pro velké/kritické instalace, ePRTC, dlouhý holdover, tisíce klientů. Duální napájení je součástí (automaticky).",
    datasheet: {
      href: "https://www.elpromaelectronics.com/wp-content/uploads/woocommerce_uploads/2023/05/TimeSystems_NTS_5000_120525-eozbhw.pdf",
    },
  },
];

/* ---------- Další tabulky ---------- */
const DEVICE_BANDS: { id: DevBand; label: string }[] = [
  { id: "small", label: "do ~50 zařízení" },
  { id: "medium", label: "~50–200 zařízení" },
  { id: "large", label: "~200–1000 zařízení" },
  { id: "xl", label: ">1000 zařízení" },
];

const ACCURACY_LEVELS: { id: AccuracyId; label: string; help: string }[] = [
  { id: "ntp_ms", label: "NTP – milisekundy", help: "běžná IT síť, logy, servery, CCTV" },
  {
    id: "ptp_ent",
    label: "PTP Enterprise – sub-ms až desítky µs",
    help: "datacentra, průmysl, trading edge",
  },
  {
    id: "ptp_prtc",
    label: "PTP Telecom/PRTC-A – sub-µs",
    help: "telekom/utility, HW GM/SFP, dobře navržená síť",
  },
  {
    id: "eprtc",
    label: "ePRTC / dlouhý holdover",
    help: "kritická infrastruktura, rubidium",
  },
];

// Doplňky – texty pro vysvětlení
const ACCESSORY_TEXT: Record<
  string,
  string
> = {
  "NTS-antenna – náhradní anténa (1 ks je již v balení)":
    "Náhradní GNSS anténa – doporučeno pro skladovou rezervu nebo záložní instalaci.",
  "IRIG-B IN/OUT module w/ 1PPS output":
    "Modul IRIG-B pro rozhraní s průmyslovými zařízeními, včetně přesného 1PPS.",
  "Fibre Optic Antenna Set":
    "Optická sada pro připojení GNSS antény na větší vzdálenosti, zvyšuje odolnost vůči rušení.",
  "5071A special support (firmware)":
    "Speciální firmware pro integraci s cesiovými hodinami 5071A.",
  "Dual Redundant Power Supply (jen NTS-3000)":
    "Druhé nezávislé napájení pro vyšší dostupnost – volitelné pouze u NTS-3000.",
  "Dual Redundant Power Supply (automaticky součástí)":
    "Model má duální napájení již v základu (bez volby).",
};

/* ---------- Pomocné funkce (URL kódování) ---------- */
const encodeConfig = (cfg: unknown) => {
  const json = JSON.stringify(cfg);
  return typeof window !== "undefined"
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

/* ---------- Pravidla doporučení modelu ---------- */
function recommendModel(devBand: DevBand, acc: AccuracyId): ModelId {
  if (acc === "eprtc") return "nts-5000";
  if (acc === "ptp_prtc") return devBand === "xl" ? "nts-5000" : "nts-4000";
  if (acc === "ptp_ent") return devBand === "large" || devBand === "xl" ? "nts-4000" : "nts-3000";
  // ntp_ms
  if (devBand === "small") return "nts-pico3";
  if (devBand === "medium") return "nts-3000";
  return "nts-4000";
}

/* ---------- Hlavní komponenta ---------- */
export default function App() {
  // step: -1 = intro (přehled), 0..3 = průvodce
  const [step, setStep] = useState<number>(-1);

  const [devBand, setDevBand] = useState<DevBand>("medium");
  const [accuracy, setAccuracy] = useState<AccuracyId>("ptp_ent");

  const [config, setConfig] = useState(() => ({
    model: "nts-3000" as ModelId,
    oscillator: "OCXO" as "TCXO" | "OCXO" | "Rb",
    lan: 2,
    sfp: 0,
    power: "Single" as "Single" | "Redundant",
    redundantGnss: false,
    ptpProfile: "Default",
    accessories: [] as string[],
    company: "",
    contact: "",
    notes: "",
    ptpPorts: 2 as 1 | 2 | 3 | 4, // pouze pro NTS-5000 (výchozí)
  }));

  // načtení z URL (permalink)
  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get("c");
    const dec = c ? decodeConfig(c) : null;
    if (dec) {
      setConfig((prev) => ({ ...prev, ...dec }));
      // pokud je v URL, skočíme rovnou do kroku 4 (export)
      setStep(3);
    }
  }, []);

  // doporučený model + reference
  const recommendedId = useMemo(
    () => recommendModel(devBand, accuracy),
    [devBand, accuracy]
  );
  const recommendedModel = useMemo(
    () => MODELS.find((m) => m.id === recommendedId)!,
    [recommendedId]
  );

  // při změně doporučení props defaultů přesuneme do configu
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
      // ponecháme accessories / další pole beze změny
    }));
  }, [recommendedId]);

  // PSU pravidlo – pokud je vybraný PSU mimo NTS-3000, odstraníme ho
  useEffect(() => {
    if (config.model !== "nts-3000") {
      setConfig((prev) => ({
        ...prev,
        accessories: prev.accessories.filter(
          (a) => a !== "Dual Redundant Power Supply (jen NTS-3000)"
        ),
      }));
    }
  }, [config.model]);

  const shareUrl = useMemo(() => {
    const base =
      typeof window !== "undefined"
        ? window.location.origin + window.location.pathname
        : "";
    return `${base}?c=${encodeConfig({ decision: { devBand, accuracy }, ...config })}`;
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
        `Napájení: ${config.power}${config.redundantGnss ? ", redundantní GNSS" : ""}`,
        `PTP profil: ${config.ptpProfile}`,
        ...(config.model === "nts-5000" ? [`PTP porty: ${config.ptpPorts}`] : []),
        `Doplňky: ${config.accessories.length ? config.accessories.join(", ") : "—"}`,
      ].join("\n"),
    [recommendedModel, devBand, accuracy, config]
  );

  /* ---------- UI pomocné ---------- */
  const Section: React.FC<{ title?: string; children: React.ReactNode }> = ({
    title,
    children,
  }) => (
    <section
      style={{
        border: "1px solid #e6e6e6",
        borderRadius: 16,
        boxShadow: "0 6px 24px rgba(0,0,0,.06)",
        overflow: "hidden",
        background: "#fff",
      }}
    >
      {title && (
        <div style={{ padding: 24, borderBottom: "1px solid #eee" }}>
          <b>{title}</b>
        </div>
      )}
      <div style={{ padding: 24 }}>{children}</div>
    </section>
  );

  const HeaderLogo: React.FC = () => (
    <a
      href="/"
      onClick={(e) => {
        e.preventDefault();
        setStep(-1);
        window.history.replaceState({}, "", window.location.pathname);
      }}
      style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none" }}
      title="Zpět na titulní stránku"
    >
      <img
        src="https://www.westercom.eu/img/logo-1634110785.jpg"
        alt="Westercom"
        style={{ height: 22, width: "auto" }}
      />
      <span style={{ color: "#111", fontWeight: 600 }}>Konfigurátor časových serverů Elproma NTS</span>
    </a>
  );

  /* ---------- Render ---------- */
  return (
    <div className="app" style={{ color: "#111" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "16px 16px 40px" }}>
        {/* Header */}
        <div style={{ marginBottom: 12 }}>
          <HeaderLogo />
          <p style={{ color: "#666", fontSize: 14, marginTop: 8 }}>
            Interaktivní průvodce, který pomůže vybrat správný časový server pro vaši infrastrukturu.
          </p>
        </div>

        {/* Intro (cards) */}
        {step === -1 && (
          <>
            <h2 style={{ fontSize: 24, margin: "18px 0" }}>Přehled časových serverů</h2>
            <p style={{ color: "#555", marginBottom: 16 }}>
              Seznam modelů s popisem a odkazem na datasheet. Nejste si jisti? Klikněte na{" "}
              <b>Spustit konfigurátor</b> a nechte se vést.
            </p>

            <div
              className="cards"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: 16,
              }}
            >
              {/* breakpoints */}
              <style>
                {`
                  @media (min-width: 640px){
                    .cards{ grid-template-columns: repeat(2, minmax(0,1fr)); }
                  }
                  @media (min-width: 1024px){
                    .cards{ grid-template-columns: repeat(3, minmax(0,1fr)); }
                  }
                  .card img{ width:100%; height:auto; object-fit:contain; aspect-ratio: 16/9; border-bottom:1px solid #eee; }
                  .muted{ color:#666; font-size:12px; }
                  .btn{ display:inline-flex; align-items:center; gap:8px; padding:10px 14px; border-radius:10px; border:1px solid #e6e6e6; background:#fff; cursor:pointer; }
                  .btn:active{ transform: translateY(1px); }
                  .btn-primary{ background:#111; color:#fff; border-color:#111; }
                  textarea.permalink{ width:100%; height:90px; white-space:pre-wrap; word-break:break-all; font-family:ui-monospace,Menlo,Consolas,monospace; font-size:12px; }
                  label.choice{ display:flex; gap:12px; align-items:flex-start; padding:12px; border:1px solid #e6e6e6; border-radius:12px; margin-bottom:8px; cursor:pointer; background:#fff; }
                  label.choice:hover{ background:#fafafa; }
                  .note{ background:#fafafa; padding:12px; border-radius:12px; font-size:12px; color:#555; }
                `}
              </style>

              {MODELS.map((m) => (
                <div key={m.id} className="card" style={{ border: "1px solid #e6e6e6", borderRadius: 16, overflow: "hidden", background: "#fff" }}>
                  <img src={m.image} alt={m.name} loading="lazy" />
                  <div style={{ padding: 16 }}>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>{m.name}</div>
                    <div className="muted" style={{ marginBottom: 10 }}>{m.segment}</div>
                    <div className="muted" style={{ marginBottom: 10 }}>{m.notes}</div>
                    <div>
                      <a
                        className="btn"
                        href={m.datasheet?.href || "#"}
                        target="_blank"
                        rel="noreferrer"
                        title={m.datasheet?.title || undefined}
                        aria-disabled={!m.datasheet?.href || m.datasheet?.href === "#"}
                        style={{ opacity: m.datasheet?.href ? 1 : 0.6, pointerEvents: m.datasheet?.href ? "auto" : "none" }}
                      >
                        Datasheet
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
              <button className="btn btn-primary" onClick={() => setStep(0)}>
                Spustit konfigurátor
              </button>
            </div>
          </>
        )}

        {/* Průvodce: progress */}
        {step >= 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, margin: "12px 0 20px" }}>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  height: 8,
                  borderRadius: 999,
                  background: i <= step ? "linear-gradient(90deg,#111,#333)" : "#e5e5e5",
                }}
              />
            ))}
          </div>
        )}

        {/* Krok 1: Počet zařízení */}
        {step === 0 && (
          <Section title="1) Kolik zařízení potřebujete synchronizovat?">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: 12,
              }}
            >
              <div>
                {DEVICE_BANDS.map((b) => (
                  <label key={b.id} className="choice">
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
              <div className="note">
                <div style={{ fontWeight: 600, marginBottom: 6 }}>Průvodce výběrem</div>
                <ul style={{ margin: "0 0 0 18px" }}>
                  <li>Desítky klientů → NTP / základní PTP (PICO3 / NTS-3000).</li>
                  <li>Stovky až tisíce → výkonnější GM, SFP, redundance (NTS-4000/5000).</li>
                </ul>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
              <button className="btn btn-primary" onClick={() => setStep(1)}>
                Pokračovat
              </button>
            </div>
          </Section>
        )}

        {/* Krok 2: Přesnost */}
        {step === 1 && (
          <Section title="2) Požadovaná přesnost">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: 12,
              }}
            >
              <div>
                {ACCURACY_LEVELS.map((a) => (
                  <label key={a.id} className="choice">
                    <input
                      type="radio"
                      name="acc"
                      checked={accuracy === a.id}
                      onChange={() => setAccuracy(a.id)}
                    />
                    <span>
                      <div style={{ fontWeight: 600 }}>{a.label}</div>
                      <div className="muted">{a.help}</div>
                    </span>
                  </label>
                ))}
              </div>
              <div className="note">
                <div style={{ fontWeight: 600, marginBottom: 6 }}>Vysvětlení</div>
                <p><b>NTP</b>: typicky milisekundy – pro běžné IT a logování.</p>
                <p><b>PTP Enterprise</b>: sub-ms až desítky µs (záleží na síti / HW timestamping).</p>
                <p><b>PTP Telecom/PRTC-A</b>: sub-µs v dobře navržené síti; často SFP a HW GM.</p>
                <p><b>ePRTC</b>: velmi dlouhý holdover (Rb), kritická infrastruktura.</p>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 16 }}>
              <button className="btn" onClick={() => setStep(0)}>Zpět</button>
              <button className="btn btn-primary" onClick={() => setStep(2)}>Pokračovat</button>
            </div>
          </Section>
        )}

        {/* Krok 3: Doplňky */}
        {step === 2 && (
          <Section title="3) Volitelné doplňky">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: 14,
              }}
            >
              {/* Výpis doplňků – PSU jen pro NTS-3000, pro 4000/5000 pouze informace */}
              <div>
                {[
                  "NTS-antenna – náhradní anténa (1 ks je již v balení)",
                  "IRIG-B IN/OUT module w/ 1PPS output",
                  "Fibre Optic Antenna Set",
                  "5071A special support (firmware)",
                  // PSU volitelně jen pro 3000:
                  ...(config.model === "nts-3000"
                    ? ["Dual Redundant Power Supply (jen NTS-3000)"]
                    : []),
                ].map((name) => {
                  const checked = config.accessories.includes(name);
                  return (
                    <label key={name} className="choice">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const set = new Set(config.accessories);
                          e.target.checked ? set.add(name) : set.delete(name);
                          setConfig({ ...config, accessories: Array.from(set) });
                        }}
                      />
                      <span>
                        <div style={{ fontWeight: 600 }}>{name}</div>
                        <div className="muted">{ACCESSORY_TEXT[name] ?? ""}</div>
                      </span>
                    </label>
                  );
                })}

                {/* Informativní PSU řádek pro 4000/5000 */}
                {(config.model === "nts-4000" || config.model === "nts-5000") && (
                  <div className="note" style={{ marginTop: 4 }}>
                    <b>Dual Redundant Power Supply (automaticky součástí)</b>
                    <div className="muted">{ACCESSORY_TEXT["Dual Redundant Power Supply (automaticky součástí)"]}</div>
                  </div>
                )}
              </div>

              {/* Doporučený model box */}
              <div className="note">
                <div style={{ fontWeight: 700 }}>{recommendedModel.name}</div>
                <div className="muted">{recommendedModel.segment}</div>
                <p className="muted" style={{ marginTop: 8 }}>{recommendedModel.notes}</p>
              </div>

              {/* Speciální volba pro NTS-5000: počet PTP portů */}
              {config.model === "nts-5000" && (
                <div style={{ borderTop: "1px solid #eee", paddingTop: 10 }}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>Počet PTP portů (pouze NTS-5000)</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {[1, 2, 3, 4].map((n) => (
                      <label key={n} className="choice" style={{ margin: 0 }}>
                        <input
                          type="radio"
                          name="ptpPorts"
                          checked={config.ptpPorts === n}
                          onChange={() => setConfig({ ...config, ptpPorts: n as 1 | 2 | 3 | 4 })}
                        />
                        <span>{n} port{n > 1 ? "y" : ""}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 16 }}>
              <button className="btn" onClick={() => setStep(1)}>Zpět</button>
              <button className="btn btn-primary" onClick={() => setStep(3)}>Pokračovat</button>
            </div>
          </Section>
        )}

        {/* Krok 4: Kontakty & export */}
        {step === 3 && (
          <Section title="4) Kontakty & export">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: 24,
              }}
            >
              <div>
                <div style={{ marginBottom: 12 }}>
                  <label className="muted">Společnost</label>
                  <input
                    style={{
                      marginTop: 6,
                      width: "100%",
                      border: "1px solid #ddd",
                      borderRadius: 8,
                      padding: "10px 12px",
                      fontSize: 16,
                    }}
                    value={config.company}
                    onChange={(e) => setConfig({ ...config, company: e.target.value })}
                    placeholder="Název společnosti"
                  />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label className="muted">Kontakt</label>
                  <input
                    style={{
                      marginTop: 6,
                      width: "100%",
                      border: "1px solid #ddd",
                      borderRadius: 8,
                      padding: "10px 12px",
                      fontSize: 16,
                    }}
                    value={config.contact}
                    onChange={(e) => setConfig({ ...config, contact: e.target.value })}
                    placeholder="E-mail / telefon"
                  />
                </div>
                <div>
                  <label className="muted">Poznámky</label>
                  <textarea
                    rows={4}
                    style={{
                      marginTop: 6,
                      width: "100%",
                      border: "1px solid #ddd",
                      borderRadius: 8,
                      padding: "10px 12px",
                      fontSize: 16,
                    }}
                    value={config.notes}
                    onChange={(e) => setConfig({ ...config, notes: e.target.value })}
                    placeholder="Požadavky, normy, prostředí…"
                  />
                </div>
              </div>

              <div>
                <div className="note" style={{ marginBottom: 12 }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Shrnutí</div>
                  <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, color: "#333", margin: 0 }}>
                    {summary}
                  </pre>
                </div>

                <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => navigator.clipboard.writeText(shareUrl)}
                    title="Zkopírovat permalink"
                  >
                    Zkopírovat odkaz
                  </button>
                  <button
                    className="btn"
                    onClick={() => {
                      const blob = new Blob(
                        [JSON.stringify({ decision: { devBand, accuracy }, ...config }, null, 2)],
                        { type: "application/json" }
                      );
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `${recommendedModel.id}-konfigurace.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    Stáhnout JSON
                  </button>
                </div>

                <div>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Permalink</div>
                  <textarea className="permalink" readOnly value={shareUrl} />
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 16 }}>
              <button className="btn" onClick={() => setStep(2)}>Zpět</button>
              <button
                className="btn"
                onClick={() => {
                  setStep(-1);
                  setConfig((c) => ({
                    ...c,
                    accessories: [],
                    company: "",
                    contact: "",
                    notes: "",
                  }));
                }}
              >
                Nová konfigurace
              </button>
            </div>
          </Section>
        )}

        {/* Footer */}
        <div style={{ marginTop: 28, fontSize: 12, color: "#666", textAlign: "left" }}>
          © {new Date().getFullYear()} Konfigurátor – rozhodovací průvodce.
        </div>
      </div>
    </div>
  );
}
