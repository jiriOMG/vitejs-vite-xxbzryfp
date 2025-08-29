import React, { useEffect, useMemo, useState } from "react";

/**
 * Elproma NTS Configurator — CS / EN / PL
 * Intro → 1) devices → 2) accuracy → 3) accessories → 4) contacts & export
 */

/* ─────────────────────────────────────────────────────────
 * Typy
 * ───────────────────────────────────────────────────────── */
type Lang = "cs" | "en" | "pl";
type ModelId = "nts-pico3" | "nts-3000" | "nts-4000" | "nts-5000";
type DevBand = "small" | "medium" | "large" | "xl";
type AccuracyId = "ntp_ms" | "ptp_ent" | "ptp_prtc" | "eprtc";

type Model = {
  id: ModelId;
  name: string;
  segment: string;
  image: string;
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

/* ─────────────────────────────────────────────────────────
 * Překlady
 * ───────────────────────────────────────────────────────── */
const i18n: Record<
  Lang,
  {
    ui: {
      appTitle: string;
      subtitle: string;
      overviewTitle: string;
      overviewLeadA: string;
      overviewLeadB: string;
      datasheet: string;
      launch: string;
      back: string;
      next: string;
      copy: string;
      download: string;
      newConfig: string;
      company: string;
      contact: string;
      notes: string;
      summary: string;
      permalink: string;
      guide: string;
      explanation: string;
      step1: string;
      step2: string;
      step3: string;
      step4: string;
      ptpPortsLabel: string;
    };
    bands: { id: DevBand; label: string }[];
    accuracy: { id: AccuracyId; label: string; help: string }[];
    bullets: string[];
    accessories: {
      antenna: { label: string; desc: string };
      irig: { label: string; desc: string };
      fo: { label: string; desc: string };
      a5071: { label: string; desc: string };
      psu3000: { label: string; desc: string };
      psuAutoInfo: { label: string; desc: string };
    };
    // Popisky u modelů (segment/notes odstavec se doplní ještě per model)
    modelExtras: {
      redPsuAuto: string; // věta k 4000/5000 (součástí)
      redPsuOptional: string; // věta k 3000 (volitelně)
    };
  }
> = {
  cs: {
    ui: {
      appTitle: "Konfigurátor časových serverů Elproma NTS",
      subtitle:
        "Interaktivní průvodce, který pomůže vybrat správný časový server pro vaši infrastrukturu.",
      overviewTitle: "Přehled časových serverů",
      overviewLeadA:
        "Seznam modelů s popisem a odkazem na datasheet.",
      overviewLeadB:
        "Nejste si jisti? Klikněte na ",
      datasheet: "Datasheet",
      launch: "Spustit konfigurátor",
      back: "Zpět",
      next: "Pokračovat",
      copy: "Zkopírovat odkaz",
      download: "Stáhnout JSON",
      newConfig: "Nová konfigurace",
      company: "Společnost",
      contact: "Kontakt",
      notes: "Poznámky",
      summary: "Shrnutí",
      permalink: "Permalink",
      guide: "Průvodce výběrem",
      explanation: "Vysvětlení",
      step1: "1) Kolik zařízení potřebujete synchronizovat?",
      step2: "2) Požadovaná přesnost",
      step3: "3) Volitelné doplňky",
      step4: "4) Kontakty & export",
      ptpPortsLabel: "Počet PTP portů (pouze NTS-5000)",
    },
    bands: [
      { id: "small", label: "do ~50 zařízení" },
      { id: "medium", label: "~50–200 zařízení" },
      { id: "large", label: "~200–1000 zařízení" },
      { id: "xl", label: ">1000 zařízení" },
    ],
    accuracy: [
      { id: "ntp_ms", label: "NTP – milisekundy", help: "běžná IT síť, logy, servery, CCTV" },
      { id: "ptp_ent", label: "PTP Enterprise – sub-ms až desítky µs", help: "datacentra, průmysl, trading edge" },
      { id: "ptp_prtc", label: "PTP Telecom/PRTC-A – sub-µs", help: "telekom/utility, HW GM/SFP, dobře navržená síť" },
      { id: "eprtc", label: "ePRTC / dlouhý holdover", help: "kritická infrastruktura, rubidium" },
    ],
    bullets: [
      "Desítky klientů → NTP / základní PTP (PICO3 / NTS-3000).",
      "Stovky až tisíce → výkonnější GM, SFP, redundance (NTS-4000/5000).",
    ],
    accessories: {
      antenna: {
        label: "NTS-antenna – náhradní anténa (1 ks je již v balení)",
        desc: "Náhradní GNSS anténa – vhodná jako skladová rezerva nebo záložní instalace.",
      },
      irig: {
        label: "IRIG-B IN/OUT module w/ 1PPS output",
        desc: "Modul IRIG-B pro rozhraní s průmyslovými zařízeními, včetně přesného 1PPS.",
      },
      fo: {
        label: "Fibre Optic Antenna Set",
        desc: "Optická sada pro připojení GNSS antény na větší vzdálenosti, odolnější proti rušení.",
      },
      a5071: {
        label: "5071A special support (firmware)",
        desc: "Speciální firmware pro integraci s cesiovými hodinami 5071A.",
      },
      psu3000: {
        label: "Dual Redundant Power Supply (jen NTS-3000)",
        desc: "Druhé nezávislé napájení pro vyšší dostupnost – volitelné pouze u NTS-3000.",
      },
      psuAutoInfo: {
        label: "Dual Redundant Power Supply (automaticky součástí)",
        desc: "Model má duální napájení již v základu (bez volby).",
      },
    },
    modelExtras: {
      redPsuAuto: "Duální napájení je součástí (automaticky).",
      redPsuOptional: "Duální napájení je k dispozici jako volitelná položka.",
    },
  },
  en: {
    ui: {
      appTitle: "Elproma NTS Time Servers Configurator",
      subtitle:
        "An interactive wizard that helps you choose the right time server for your infrastructure.",
      overviewTitle: "Time Servers Overview",
      overviewLeadA: "List of models with a short summary and datasheet link.",
      overviewLeadB: "Not sure? Click ",
      datasheet: "Datasheet",
      launch: "Start configurator",
      back: "Back",
      next: "Continue",
      copy: "Copy link",
      download: "Download JSON",
      newConfig: "New configuration",
      company: "Company",
      contact: "Contact",
      notes: "Notes",
      summary: "Summary",
      permalink: "Permalink",
      guide: "Selection guide",
      explanation: "Explanation",
      step1: "1) How many devices do you need to synchronize?",
      step2: "2) Required accuracy",
      step3: "3) Optional accessories",
      step4: "4) Contacts & export",
      ptpPortsLabel: "Number of PTP ports (NTS-5000 only)",
    },
    bands: [
      { id: "small", label: "up to ~50 devices" },
      { id: "medium", label: "~50–200 devices" },
      { id: "large", label: "~200–1000 devices" },
      { id: "xl", label: ">1000 devices" },
    ],
    accuracy: [
      { id: "ntp_ms", label: "NTP – milliseconds", help: "typical IT, logs, servers, CCTV" },
      { id: "ptp_ent", label: "PTP Enterprise – sub-ms to tens of µs", help: "datacenters, industry, trading edge" },
      { id: "ptp_prtc", label: "PTP Telecom/PRTC-A – sub-µs", help: "telecom/utility, HW GM/SFP, well-designed network" },
      { id: "eprtc", label: "ePRTC / long holdover", help: "critical infrastructure, rubidium" },
    ],
    bullets: [
      "Dozens of clients → NTP / basic PTP (PICO3 / NTS-3000).",
      "Hundreds to thousands → stronger GM, SFP, redundancy (NTS-4000/5000).",
    ],
    accessories: {
      antenna: {
        label: "NTS-antenna – spare antenna (1 pc already in the box)",
        desc: "Spare GNSS antenna – handy for stock or backup installation.",
      },
      irig: {
        label: "IRIG-B IN/OUT module w/ 1PPS output",
        desc: "IRIG-B module to interface industrial systems, including precise 1PPS.",
      },
      fo: {
        label: "Fibre Optic Antenna Set",
        desc: "Optical kit to extend GNSS antenna over long runs, more immune to interference.",
      },
      a5071: {
        label: "5071A special support (firmware)",
        desc: "Special firmware to integrate with 5071A cesium clocks.",
      },
      psu3000: {
        label: "Dual Redundant Power Supply (NTS-3000 only)",
        desc: "Second independent PSU for higher availability – optional for NTS-3000.",
      },
      psuAutoInfo: {
        label: "Dual Redundant Power Supply (included by default)",
        desc: "This model includes dual PSU out of the box (no option needed).",
      },
    },
    modelExtras: {
      redPsuAuto: "Dual PSU is included (automatically).",
      redPsuOptional: "Dual PSU is available as an option.",
    },
  },
  pl: {
    ui: {
      appTitle: "Konfigurator serwerów czasu Elproma NTS",
      subtitle:
        "Interaktywny kreator, który pomoże wybrać właściwy serwer czasu dla Twojej infrastruktury.",
      overviewTitle: "Przegląd serwerów czasu",
      overviewLeadA: "Lista modeli z krótkim opisem i linkiem do karty katalogowej.",
      overviewLeadB: "Nie jesteś pewien? Kliknij ",
      datasheet: "Karta katalogowa",
      launch: "Uruchom konfigurator",
      back: "Wstecz",
      next: "Dalej",
      copy: "Kopiuj link",
      download: "Pobierz JSON",
      newConfig: "Nowa konfiguracja",
      company: "Firma",
      contact: "Kontakt",
      notes: "Uwagi",
      summary: "Podsumowanie",
      permalink: "Permalink",
      guide: "Wskazówki wyboru",
      explanation: "Wyjaśnienie",
      step1: "1) Ile urządzeń chcesz synchronizować?",
      step2: "2) Wymagana dokładność",
      step3: "3) Opcjonalne akcesoria",
      step4: "4) Kontakty i eksport",
      ptpPortsLabel: "Liczba portów PTP (tylko NTS-5000)",
    },
    bands: [
      { id: "small", label: "do ~50 urządzeń" },
      { id: "medium", label: "~50–200 urządzeń" },
      { id: "large", label: "~200–1000 urządzeń" },
      { id: "xl", label: ">1000 urządzeń" },
    ],
    accuracy: [
      { id: "ntp_ms", label: "NTP – milisekundy", help: "typowa sieć IT, logi, serwery, CCTV" },
      { id: "ptp_ent", label: "PTP Enterprise – sub-ms do dziesiątek µs", help: "centra danych, przemysł, trading edge" },
      { id: "ptp_prtc", label: "PTP Telecom/PRTC-A – sub-µs", help: "telekom/utility, HW GM/SFP, dobrze zaprojektowana sieć" },
      { id: "eprtc", label: "ePRTC / długi holdover", help: "infrastruktura krytyczna, rubid" },
    ],
    bullets: [
      "Dziesiątki klientów → NTP / podstawowe PTP (PICO3 / NTS-3000).",
      "Setki do tysięcy → mocniejszy GM, SFP, redundancja (NTS-4000/5000).",
    ],
    accessories: {
      antenna: {
        label: "NTS-antenna – antena zapasowa (1 szt. w zestawie)",
        desc: "Zapasowa antena GNSS – przydatna do magazynu lub instalacji awaryjnej.",
      },
      irig: {
        label: "IRIG-B IN/OUT module z wyjściem 1PPS",
        desc: "Moduł IRIG-B do integracji z systemami przemysłowymi, wraz z dokładnym 1PPS.",
      },
      fo: {
        label: "Fibre Optic Antenna Set",
        desc: "Zestaw optyczny do podłączenia anteny GNSS na duże odległości, odporniejszy na zakłócenia.",
      },
      a5071: {
        label: "5071A special support (firmware)",
        desc: "Specjalne oprogramowanie do integracji z zegarami cezu 5071A.",
      },
      psu3000: {
        label: "Dual Redundant Power Supply (tylko NTS-3000)",
        desc: "Drugie niezależne zasilanie dla wyższej dostępności – opcja dla NTS-3000.",
      },
      psuAutoInfo: {
        label: "Dual Redundant Power Supply (w zestawie)",
        desc: "Model posiada podwójne zasilanie w standardzie (bez wyboru).",
      },
    },
    modelExtras: {
      redPsuAuto: "Podwójne zasilanie w standardzie (automatycznie).",
      redPsuOptional: "Podwójne zasilanie dostępne jako opcja.",
    },
  },
};

/* ─────────────────────────────────────────────────────────
 * Modely
 * ───────────────────────────────────────────────────────── */
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
    notes: "Pro malé sítě (desítky klientů), přesnost ms (NTP) / základní PTP.",
    datasheet: { href: "#", title: "NTS-PICO3" }, // požadavek: textové „NTS-PICO3“
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
    notes: "Pro stovky klientů, enterprise PTP (sub-ms až desítky µs).",
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
      power: "Redundant",
      redundantGnss: true,
    },
    notes:
      "Pro stovky až tisíce klientů, SFP, redundance, sub-µs (telekom/utility).",
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
      power: "Redundant",
      redundantGnss: true,
    },
    notes:
      "Pro velké/kritické instalace, ePRTC, dlouhý holdover, tisíce klientů.",
    datasheet: {
      href: "https://www.elpromaelectronics.com/wp-content/uploads/woocommerce_uploads/2023/05/TimeSystems_NTS_5000_120525-eozbhw.pdf",
    },
  },
];

/* ─────────────────────────────────────────────────────────
 * Pomocníci
 * ───────────────────────────────────────────────────────── */
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

function recommendModel(devBand: DevBand, acc: AccuracyId): ModelId {
  if (acc === "eprtc") return "nts-5000";
  if (acc === "ptp_prtc") return devBand === "xl" ? "nts-5000" : "nts-4000";
  if (acc === "ptp_ent")
    return devBand === "large" || devBand === "xl" ? "nts-4000" : "nts-3000";
  if (devBand === "small") return "nts-pico3";
  if (devBand === "medium") return "nts-3000";
  return "nts-4000";
}

/* ─────────────────────────────────────────────────────────
 * Aplikace
 * ───────────────────────────────────────────────────────── */
export default function App() {
  const [lang, setLang] = useState<Lang>("cs");
  const t = i18n[lang];

  // step: -1 = intro; 0..3 průvodce
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
    accessories: [] as string[], // budou jazykové labely, ne ID – pro účely exportu stačí
    company: "",
    contact: "",
    notes: "",
    ptpPorts: 2 as 1 | 2 | 3 | 4, // pouze pro NTS-5000
  }));

  // načtení z URL (zachování jazyka v UI, ale konfig je z URL)
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const c = sp.get("c");
    const dec = c ? decodeConfig(c) : null;
    if (dec) {
      setConfig((prev) => ({ ...prev, ...dec }));
      setStep(3);
    }
  }, []);

  // doporučení modelu podle voleb
  const recommendedId = useMemo(
    () => recommendModel(devBand, accuracy),
    [devBand, accuracy]
  );
  const recommendedModel = useMemo(
    () => MODELS.find((m) => m.id === recommendedId)!,
    [recommendedId]
  );

  // přepis defaultů po změně doporučení
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

  // PSU pravidlo – nenabízet psu3000 mimo NTS-3000
  useEffect(() => {
    if (config.model !== "nts-3000") {
      setConfig((prev) => ({
        ...prev,
        accessories: prev.accessories.filter(
          (a) => a !== i18n.cs.accessories.psu3000.label &&
                 a !== i18n.en.accessories.psu3000.label &&
                 a !== i18n.pl.accessories.psu3000.label
        ),
      }));
    }
  }, [config.model]);

  const shareUrl = useMemo(() => {
    const base =
      typeof window !== "undefined"
        ? window.location.origin + window.location.pathname
        : "";
    return `${base}?c=${encodeConfig({
      decision: { devBand, accuracy },
      ...config,
    })}`;
  }, [config, devBand, accuracy]);

  const summary = useMemo(() => {
    const accLabel =
      t.accuracy.find((a) => a.id === accuracy)?.label || "";
    const bandLabel =
      t.bands.find((b) => b.id === devBand)?.label || "";
    const lines = [
      `Model: ${recommendedModel.name} (${recommendedModel.segment})`,
      `${t.ui.step1.replace("1) ", "")}: ${bandLabel}`,
      `${t.ui.step2.replace("2) ", "")}: ${accLabel}`,
      `Holdover: ${config.oscillator}`,
      `LAN/SFP: ${config.lan}× LAN, ${config.sfp}× SFP`,
      `Power: ${config.power}${config.redundantGnss ? ", redundant GNSS" : ""}`,
      `PTP profile: ${config.ptpProfile}`,
    ];
    if (config.model === "nts-5000") {
      lines.push(`${t.ui.ptpPortsLabel}: ${config.ptpPorts}`);
    }
    lines.push(
      `Accessories: ${config.accessories.length ? config.accessories.join(", ") : "—"}`
    );
    return lines.join("\n");
  }, [t, recommendedModel, devBand, accuracy, config]);

  /* ────────── Vizuální obálky ────────── */
  const Section: React.FC<{ title?: string }> = ({ title, children }) => (
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

  const Header: React.FC = () => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        marginBottom: 12,
        flexWrap: "wrap",
      }}
    >
      <a
        href="/"
        onClick={(e) => {
          e.preventDefault();
          setStep(-1);
          window.history.replaceState({}, "", window.location.pathname);
        }}
        style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none" }}
        title="Home"
      >
        <img
          src="https://www.westercom.eu/img/logo-1634110785.jpg"
          alt="Westercom"
          style={{ height: 22, width: "auto" }}
        />
        <span style={{ color: "#111", fontWeight: 600 }}>{t.ui.appTitle}</span>
      </a>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <label style={{ fontSize: 12, color: "#666" }}>Language:</label>
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value as Lang)}
          style={{
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: "6px 8px",
            background: "#fff",
          }}
          aria-label="Language"
        >
          <option value="cs">Čeština</option>
          <option value="en">English</option>
          <option value="pl">Polski</option>
        </select>
      </div>
    </div>
  );

  /* ────────── Styl vložený do stránky ────────── */
  const CommonCSS = () => (
    <style>{`
      .cards{ display:grid; grid-template-columns:1fr; gap:16px; }
      @media (min-width:640px){ .cards{ grid-template-columns:repeat(2,minmax(0,1fr)); } }
      @media (min-width:1024px){ .cards{ grid-template-columns:repeat(3,minmax(0,1fr)); } }
      .card img{ width:100%; height:auto; object-fit:contain; aspect-ratio:16/9; border-bottom:1px solid #eee; }
      .muted{ color:#666; font-size:12px; }
      .btn{ display:inline-flex; align-items:center; gap:8px; padding:10px 14px; border-radius:10px; border:1px solid #e6e6e6; background:#fff; cursor:pointer; }
      .btn:active{ transform: translateY(1px); }
      .btn-primary{ background:#111; color:#fff; border-color:#111; }
      textarea.permalink{ width:100%; height:90px; white-space:pre-wrap; word-break:break-all; font-family:ui-monospace,Menlo,Consolas,monospace; font-size:12px; }
      label.choice{ display:flex; gap:12px; align-items:flex-start; padding:12px; border:1px solid #e6e6e6; border-radius:12px; margin-bottom:8px; cursor:pointer; background:#fff; }
      label.choice:hover{ background:#fafafa; }
      .note{ background:#fafafa; padding:12px; border-radius:12px; font-size:12px; color:#555; }
    `}</style>
  );

  /* ────────── Render ────────── */
  return (
    <div className="app" style={{ color: "#111" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "16px 16px 40px" }}>
        <CommonCSS />
        <Header />
        <p style={{ color: "#666", fontSize: 14, marginTop: 6 }}>{t.ui.subtitle}</p>

        {/* Intro */}
        {step === -1 && (
          <>
            <h2 style={{ fontSize: 24, margin: "18px 0" }}>{t.ui.overviewTitle}</h2>
            <p style={{ color: "#555", marginBottom: 16 }}>
              {t.ui.overviewLeadA} {t.ui.overviewLeadB}
              <b>{t.ui.launch}</b>.
            </p>

            <div className="cards">
              {MODELS.map((m) => {
                const redInfo =
                  m.id === "nts-4000" || m.id === "nts-5000"
                    ? i18n[lang].modelExtras.redPsuAuto
                    : m.id === "nts-3000"
                    ? i18n[lang].modelExtras.redPsuOptional
                    : "";
                return (
                  <div
                    key={m.id}
                    className="card"
                    style={{
                      border: "1px solid #e6e6e6",
                      borderRadius: 16,
                      overflow: "hidden",
                      background: "#fff",
                    }}
                  >
                    <img src={m.image} alt={m.name} loading="lazy" />
                    <div style={{ padding: 16 }}>
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>{m.name}</div>
                      <div className="muted" style={{ marginBottom: 10 }}>
                        {m.segment}
                      </div>
                      <div className="muted" style={{ marginBottom: 10 }}>
                        {m.notes} {redInfo && <i> {redInfo}</i>}
                      </div>
                      <div>
                        <a
                          className="btn"
                          href={m.datasheet?.href || "#"}
                          target={m.datasheet?.href ? "_blank" : undefined}
                          rel="noreferrer"
                          title={m.datasheet?.title || undefined}
                          aria-disabled={!m.datasheet?.href || m.datasheet?.href === "#"}
                          style={{
                            opacity: m.datasheet?.href ? 1 : 0.6,
                            pointerEvents: m.datasheet?.href ? "auto" : "none",
                          }}
                        >
                          {t.ui.datasheet}
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
              <button className="btn btn-primary" onClick={() => setStep(0)}>
                {t.ui.launch}
              </button>
            </div>
          </>
        )}

        {/* Progress */}
        {step >= 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              gap: 8,
              margin: "12px 0 20px",
            }}
          >
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  height: 8,
                  borderRadius: 999,
                  background:
                    i <= step ? "linear-gradient(90deg,#111,#333)" : "#e5e5e5",
                }}
              />
            ))}
          </div>
        )}

        {/* Step 1 */}
        {step === 0 && (
          <Section title={t.ui.step1}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
              <div>
                {t.bands.map((b) => (
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
                <div style={{ fontWeight: 600, marginBottom: 6 }}>{t.ui.guide}</div>
                <ul style={{ marginLeft: 18, marginTop: 0 }}>
                  {t.bullets.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
              <button className="btn btn-primary" onClick={() => setStep(1)}>
                {t.ui.next}
              </button>
            </div>
          </Section>
        )}

        {/* Step 2 */}
        {step === 1 && (
          <Section title={t.ui.step2}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
              <div>
                {t.accuracy.map((a) => (
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
                <div style={{ fontWeight: 600, marginBottom: 6 }}>{t.ui.explanation}</div>
                <p>
                  <b>NTP</b>: {t.accuracy.find((a) => a.id === "ntp_ms")?.help}
                </p>
                <p>
                  <b>PTP Enterprise</b>: {t.accuracy.find((a) => a.id === "ptp_ent")?.help}
                </p>
                <p>
                  <b>PTP Telecom/PRTC-A</b>: {t.accuracy.find((a) => a.id === "ptp_prtc")?.help}
                </p>
                <p>
                  <b>ePRTC</b>: {t.accuracy.find((a) => a.id === "eprtc")?.help}
                </p>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 16 }}>
              <button className="btn" onClick={() => setStep(0)}>
                {t.ui.back}
              </button>
              <button className="btn btn-primary" onClick={() => setStep(2)}>
                {t.ui.next}
              </button>
            </div>
          </Section>
        )}

        {/* Step 3 */}
        {step === 2 && (
          <Section title={t.ui.step3}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
              {/* Volby – PSU jen pro NTS-3000 */}
              <div>
                {[
                  t.accessories.antenna.label,
                  t.accessories.irig.label,
                  t.accessories.fo.label,
                  t.accessories.a5071.label,
                  ...(config.model === "nts-3000" ? [t.accessories.psu3000.label] : []),
                ].map((label) => {
                  const checked = config.accessories.includes(label);
                  const desc =
                    label === t.accessories.antenna.label
                      ? t.accessories.antenna.desc
                      : label === t.accessories.irig.label
                      ? t.accessories.irig.desc
                      : label === t.accessories.fo.label
                      ? t.accessories.fo.desc
                      : label === t.accessories.a5071.label
                      ? t.accessories.a5071.desc
                      : t.accessories.psu3000.desc;
                  return (
                    <label key={label} className="choice">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const set = new Set(config.accessories);
                          e.target.checked ? set.add(label) : set.delete(label);
                          setConfig({ ...config, accessories: Array.from(set) });
                        }}
                      />
                      <span>
                        <div style={{ fontWeight: 600 }}>{label}</div>
                        <div className="muted">{desc}</div>
                      </span>
                    </label>
                  );
                })}

                {(config.model === "nts-4000" || config.model === "nts-5000") && (
                  <div className="note" style={{ marginTop: 4 }}>
                    <b>{t.accessories.psuAutoInfo.label}</b>
                    <div className="muted">{t.accessories.psuAutoInfo.desc}</div>
                  </div>
                )}
              </div>

              {/* Doporučený model */}
              <div className="note">
                <div style={{ fontWeight: 700 }}>{recommendedModel.name}</div>
                <div className="muted">{recommendedModel.segment}</div>
                <p className="muted" style={{ marginTop: 8 }}>
                  {recommendedModel.notes}{" "}
                  {(recommendedModel.id === "nts-4000" || recommendedModel.id === "nts-5000") &&
                    i18n[lang].modelExtras.redPsuAuto}
                  {recommendedModel.id === "nts-3000" &&
                    " " + i18n[lang].modelExtras.redPsuOptional}
                </p>
              </div>

              {/* NTS-5000: PTP porty */}
              {config.model === "nts-5000" && (
                <div style={{ borderTop: "1px solid #eee", paddingTop: 10 }}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>
                    {t.ui.ptpPortsLabel}
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {[1, 2, 3, 4].map((n) => (
                      <label key={n} className="choice" style={{ margin: 0 }}>
                        <input
                          type="radio"
                          name="ptpPorts"
                          checked={config.ptpPorts === n}
                          onChange={() =>
                            setConfig({ ...config, ptpPorts: n as 1 | 2 | 3 | 4 })
                          }
                        />
                        <span>
                          {n} port{n > 1 ? "y" : ""}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 16 }}>
              <button className="btn" onClick={() => setStep(1)}>
                {t.ui.back}
              </button>
              <button className="btn btn-primary" onClick={() => setStep(3)}>
                {t.ui.next}
              </button>
            </div>
          </Section>
        )}

        {/* Step 4 */}
        {step === 3 && (
          <Section title={t.ui.step4}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 24 }}>
              <div>
                <div style={{ marginBottom: 12 }}>
                  <label className="muted">{t.ui.company}</label>
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
                    onChange={(e) =>
                      setConfig({ ...config, company: e.target.value })
                    }
                    placeholder={t.ui.company}
                  />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label className="muted">{t.ui.contact}</label>
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
                    onChange={(e) =>
                      setConfig({ ...config, contact: e.target.value })
                    }
                    placeholder={t.ui.contact}
                  />
                </div>
                <div>
                  <label className="muted">{t.ui.notes}</label>
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
                    onChange={(e) =>
                      setConfig({ ...config, notes: e.target.value })
                    }
                    placeholder={t.ui.notes}
                  />
                </div>
              </div>

              <div>
                <div className="note" style={{ marginBottom: 12 }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>
                    {t.ui.summary}
                  </div>
                  <pre
                    style={{
                      whiteSpace: "pre-wrap",
                      fontSize: 12,
                      color: "#333",
                      margin: 0,
                    }}
                  >
                    {summary}
                  </pre>
                </div>

                <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => navigator.clipboard.writeText(shareUrl)}
                    title={t.ui.copy}
                  >
                    {t.ui.copy}
                  </button>
                  <button
                    className="btn"
                    onClick={() => {
                      const blob = new Blob(
                        [
                          JSON.stringify(
                            { decision: { devBand, accuracy }, ...config },
                            null,
                            2
                          ),
                        ],
                        { type: "application/json" }
                      );
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `${recommendedModel.id}-config.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    {t.ui.download}
                  </button>
                </div>

                <div>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>
                    {t.ui.permalink}
                  </div>
                  <textarea className="permalink" readOnly value={shareUrl} />
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 16 }}>
              <button className="btn" onClick={() => setStep(2)}>
                {t.ui.back}
              </button>
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
                {t.ui.newConfig}
              </button>
            </div>
          </Section>
        )}

        <div style={{ marginTop: 28, fontSize: 12, color: "#666", textAlign: "left" }}>
          © {new Date().getFullYear()} Konfigurátor / Configurator / Konfigurator – {t.ui.appTitle}.
        </div>
      </div>
    </div>
  );
}
