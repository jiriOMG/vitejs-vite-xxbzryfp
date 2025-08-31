import React, { useEffect, useMemo, useState } from "react";
import "./App.css";

/** ========== TYPES ========== */
type Lang = "cs" | "en" | "pl";

type ModelId = "nts-pico3" | "nts-3000" | "nts-4000" | "nts-5000";
type DevBand = "small" | "medium" | "large" | "xl";
type AccuracyId = "ntp_ms" | "ptp_ent" | "ptp_prtc" | "eprtc";

type AccessoryId = "antenna_spare" | "irig" | "fo" | "psu" | "5071a";

interface Config {
  model: ModelId;
  devBand: DevBand;
  accuracy: AccuracyId;
  // model defaults:
  oscillator: "TCXO" | "OCXO" | "Rb";
  lan: number;
  sfp: number;
  power: "Single" | "Redundant";
  redundantGnss: boolean;

  ptpProfile: string;
  accessories: AccessoryId[];

  // NTS-5000 extra option:
  nts5000_ptpPorts: 1 | 2 | 3 | 4;

  // contact / export
  company: string;
  contact: string;
  notes: string;
}

/** ========== I18N ========== */
const I18N: Record<
  Lang,
  {
    appTitle: string;
    subtitle: string;
    overviewTitle: string;
    notSure: string;
    startWizard: string;

    datasheet: string;
    language: string;

    step1Title: string;
    step2Title: string;
    step3Title: string;
    step4Title: string;

    bandLabels: Record<DevBand, string>;
    accLabels: Record<AccuracyId, string>;
    accHelps: Record<AccuracyId, string>;

    guideTips: string[];
    explainTitle: string;

    accessoriesTitle: string;
    accessoryLabels: Record<AccessoryId, string>;
    accessoryDesc: Record<AccessoryId, string>;
    dualIncluded: string;
    nts5000PortsLabel: string;

    recommended: string;

    back: string;
    next: string;
    copyLink: string;
    downloadJson: string;
    permalink: string;
    newConfig: string;

    contactsCompany: string;
    contactsContact: string;
    contactsNotes: string;

    summary: string;
    footerNote: string;

    // Cards
    card: {
      title: Record<ModelId, string>;
      segment: Record<ModelId, string>;
      blurb: Record<ModelId, string>;
    };

    // datasheet links text is generic, but we set URLs in MODELS
  }
> = {
  cs: {
    appTitle: "Elproma NTS konfigurátor časových serverů",
    subtitle:
      "Interaktivní průvodce, který pomůže vybrat správný časový server pro vaši infrastrukturu.",
    overviewTitle: "Přehled časových serverů",
    notSure: "Nejste si jisti?",
    startWizard: "Spustit konfigurátor",

    datasheet: "Datasheet",
    language: "Jazyk",

    step1Title: "1) Kolik zařízení potřebujete synchronizovat?",
    step2Title: "2) Požadovaná přesnost",
    step3Title: "3) Volitelné doplňky",
    step4Title: "4) Kontakty & export",

    bandLabels: {
      small: "do ~50 zařízení",
      medium: "~50–200 zařízení",
      large: "~200–1000 zařízení",
      xl: ">1000 zařízení",
    },
    accLabels: {
      ntp_ms: "NTP – milisekundy",
      ptp_ent: "PTP Enterprise – sub-ms až desítky µs",
      ptp_prtc: "PTP Telecom/PRTC-A – sub-µs",
      eprtc: "ePRTC / dlouhý holdover",
    },
    accHelps: {
      ntp_ms: "Běžná IT síť, logy, servery, CCTV.",
      ptp_ent:
        "Pro podnikové PTP; sub-ms až desítky µs (záleží na síti a HW timestampingu).",
      ptp_prtc:
        "Sub-µs v telekom/utility; obvykle HW GM a SFP uplinky, pečlivá architektura.",
      eprtc:
        "Kritická infrastruktura; rubidiový oscilátor a velmi dlouhý holdover.",
    },
    guideTips: [
      "Desítky klientů → NTP / základní PTP (PICO3 / NTS-3000).",
      "Stovky až tisíce → výkonnější GM, SFP, redundance (NTS-4000/5000).",
    ],
    explainTitle: "Vysvětlení",

    accessoriesTitle: "Volitelné doplňky",
    accessoryLabels: {
      antenna_spare: "NTS-antenna – náhradní anténa (1 ks je již v balení)",
      irig: "IRIG-B IN/OUT module w/ 1PPS output",
      fo: "Fibre Optic Antenna Set",
      psu: "Dual Redundant Power Supply (jen NTS-3000)",
      "5071a": "5071A special support (firmware)",
    },
    accessoryDesc: {
      antenna_spare:
        "Rezervní GNSS anténa pro instalace, kde je vhodné mít náhradní díl k dispozici (1 ks je již v balení).",
      irig:
        "Karta pro vstup/výstup IRIG-B a přesný 1PPS — integrace do systémů využívajících IRIG čas.",
      fo: "Sada pro napájení GNSS antény po optice (FO) — eliminace rušení a dlouhá vzdálenost.",
      psu: "Dvojitý napájecí zdroj pro vyšší dostupnost — volitelné jen u NTS-3000.",
      "5071a":
        "Speciální FW podpora externího Cs etalonu 5071A — pro laboratorní a metrologické aplikace.",
    },
    dualIncluded: "Duální napájení je součástí (automaticky).",
    nts5000PortsLabel: "NTS-5000: počet PTP portů",

    recommended: "Doporučený model",

    back: "Zpět",
    next: "Pokračovat",
    copyLink: "Zkopírovat odkaz",
    downloadJson: "Stáhnout JSON",
    permalink: "Permalink",
    newConfig: "Nová konfigurace",

    contactsCompany: "Společnost",
    contactsContact: "Kontakt (e-mail / telefon)",
    contactsNotes: "Poznámky",

    summary: "Shrnutí",
    footerNote:
      "© " + new Date().getFullYear() + " Konfigurátor – rozhodovací průvodce.",

    card: {
      title: {
        "nts-pico3": "NTS-PICO3",
        "nts-3000": "NTS-3000",
        "nts-4000": "NTS-4000",
        "nts-5000": "NTS-5000",
      },
      segment: {
        "nts-pico3": "Kompaktní | NTP/PTP (edge)",
        "nts-3000": "PTP Grandmaster | NTP Stratum-1",
        "nts-4000": "PTP/PRTC-A | vyšší kapacita",
        "nts-5000": "ePRTC / PRTC A/B | rubidium",
      },
      blurb: {
        "nts-pico3":
          "Pro malé sítě (desítky klientů), přesnost ms (NTP) / základní PTP.",
        "nts-3000":
          "Pro stovky klientů, enterprise PTP (sub-ms až desítky µs). Dual PSU je volitelný.",
        "nts-4000":
          "Pro stovky až tisíce klientů, SFP, redundance, sub-µs (telekom/utility). Dual PSU je součástí (automaticky).",
        "nts-5000":
          "Pro velké/kritické instalace, ePRTC, dlouhý holdover, tisíce klientů. Dual PSU je součástí (automaticky).",
      },
    },
  },

  en: {
    appTitle: "Elproma NTS Time Servers Configurator",
    subtitle:
      "An interactive wizard that helps you choose the right time server for your infrastructure.",
    overviewTitle: "Time Servers Overview",
    notSure: "Not sure?",
    startWizard: "Start configurator",

    datasheet: "Datasheet",
    language: "Language",

    step1Title: "1) How many devices do you need to synchronise?",
    step2Title: "2) Required accuracy",
    step3Title: "3) Optional accessories",
    step4Title: "4) Contacts & export",

    bandLabels: {
      small: "up to ~50 devices",
      medium: "~50–200 devices",
      large: "~200–1000 devices",
      xl: ">1000 devices",
    },
    accLabels: {
      ntp_ms: "NTP – milliseconds",
      ptp_ent: "PTP Enterprise – sub-ms to tens of µs",
      ptp_prtc: "PTP Telecom/PRTC-A – sub-µs",
      eprtc: "ePRTC / long holdover",
    },
    accHelps: {
      ntp_ms: "Typical IT networks, servers, logging, CCTV.",
      ptp_ent:
        "Enterprise PTP; sub-ms to tens of µs (depends on network and HW timestamping).",
      ptp_prtc:
        "Sub-µs in telco/utility; usually HW GM and SFP uplinks, proper design required.",
      eprtc:
        "Critical infrastructure; rubidium oscillator and very long holdover.",
    },
    guideTips: [
      "Dozens of clients → NTP / basic PTP (PICO3 / NTS-3000).",
      "Hundreds to thousands → more capable GM, SFP, redundancy (NTS-4000/5000).",
    ],
    explainTitle: "Explanation",

    accessoriesTitle: "Optional accessories",
    accessoryLabels: {
      antenna_spare: "NTS-antenna – spare antenna (1 pc is already included)",
      irig: "IRIG-B IN/OUT module w/ 1PPS output",
      fo: "Fibre Optic Antenna Set",
      psu: "Dual Redundant Power Supply (NTS-3000 only)",
      "5071a": "5071A special support (firmware)",
    },
    accessoryDesc: {
      antenna_spare:
        "Spare GNSS antenna where a replacement on site is beneficial (1 piece already included).",
      irig:
        "IRIG-B input/output and precise 1PPS — integration for IRIG-based systems.",
      fo: "Optical feed for GNSS antenna — long distance and EMI immunity.",
      psu: "Dual PSU for higher availability — optional only with NTS-3000.",
      "5071a":
        "Special firmware support for external Cs standard 5071A — lab/metrology use.",
    },
    dualIncluded: "Dual PSU is included (automatically).",
    nts5000PortsLabel: "NTS-5000: number of PTP ports",

    recommended: "Recommended model",

    back: "Back",
    next: "Continue",
    copyLink: "Copy link",
    downloadJson: "Download JSON",
    permalink: "Permalink",
    newConfig: "New configuration",

    contactsCompany: "Company",
    contactsContact: "Contact (email / phone)",
    contactsNotes: "Notes",

    summary: "Summary",
    footerNote:
      "© " + new Date().getFullYear() + " Configurator – decision helper.",

    card: {
      title: {
        "nts-pico3": "NTS-PICO3",
        "nts-3000": "NTS-3000",
        "nts-4000": "NTS-4000",
        "nts-5000": "NTS-5000",
      },
      segment: {
        "nts-pico3": "Compact | NTP/PTP (edge)",
        "nts-3000": "PTP Grandmaster | NTP Stratum-1",
        "nts-4000": "PTP/PRTC-A | higher capacity",
        "nts-5000": "ePRTC / PRTC A/B | rubidium",
      },
      blurb: {
        "nts-pico3":
          "For small networks (dozens of clients), ms accuracy (NTP) / basic PTP.",
        "nts-3000":
          "For hundreds of clients, enterprise PTP (sub-ms to tens of µs). Dual PSU optional.",
        "nts-4000":
          "For hundreds to thousands of clients, SFP, redundancy, sub-µs (telco/utility). Dual PSU included (automatically).",
        "nts-5000":
          "For large/critical sites, ePRTC, long holdover, thousands of clients. Dual PSU included (automatically).",
      },
    },
  },

  pl: {
    appTitle: "Konfigurator serwerów czasu Elproma NTS",
    subtitle:
      "Interaktywny kreator, który pomoże wybrać właściwy serwer czasu dla Twojej infrastruktury.",
    overviewTitle: "Przegląd serwerów czasu",
    notSure: "Nie jesteś pewien?",
    startWizard: "Uruchom konfigurator",

    datasheet: "Karta katalogowa",
    language: "Język",

    step1Title: "1) Ile urządzeń potrzebuje synchronizacji?",
    step2Title: "2) Wymagana dokładność",
    step3Title: "3) Akcesoria opcjonalne",
    step4Title: "4) Kontakty i eksport",

    bandLabels: {
      small: "do ~50 urządzeń",
      medium: "~50–200 urządzeń",
      large: "~200–1000 urządzeń",
      xl: ">1000 urządzeń",
    },
    accLabels: {
      ntp_ms: "NTP – milisekundy",
      ptp_ent: "PTP Enterprise – sub-ms do dziesiątek µs",
      ptp_prtc: "PTP Telecom/PRTC-A – sub-µs",
      eprtc: "ePRTC / długi holdover",
    },
    accHelps: {
      ntp_ms: "Typowe sieci IT, serwery, logowanie, CCTV.",
      ptp_ent:
        "Przemysłowe PTP; sub-ms do dziesiątek µs (zależnie od sieci i HW timestampingu).",
      ptp_prtc:
        "Sub-µs w telekom/utility; zwykle HW GM i łącza SFP, właściwa architektura.",
      eprtc:
        "Krytyczna infrastruktura; oscylator rubidowy i bardzo długi holdover.",
    },
    guideTips: [
      "Dziesiątki klientów → NTP / podstawowe PTP (PICO3 / NTS-3000).",
      "Setki do tysięcy → mocniejszy GM, SFP, redundancja (NTS-4000/5000).",
    ],
    explainTitle: "Wyjaśnienie",

    accessoriesTitle: "Akcesoria opcjonalne",
    accessoryLabels: {
      antenna_spare: "NTS-antenna – antena zapasowa (1 szt. już w zestawie)",
      irig: "IRIG-B IN/OUT module w/ 1PPS output",
      fo: "Fibre Optic Antenna Set",
      psu: "Dual Redundant Power Supply (tylko NTS-3000)",
      "5071a": "5071A special support (firmware)",
    },
    accessoryDesc: {
      antenna_spare:
        "Zapasowa antena GNSS — warto mieć na miejscu (1 sztuka jest już w zestawie).",
      irig:
        "Wejście/wyjście IRIG-B i precyzyjny 1PPS — integracja z systemami IRIG.",
      fo: "Optyczne zasilanie anteny GNSS — duże odległości, odporność na zakłócenia.",
      psu: "Podwójny zasilacz w celu zwiększenia dostępności — opcjonalnie tylko dla NTS-3000.",
      "5071a":
        "Specjalne wsparcie FW dla zewnętrznego wzorca Cs 5071A — zastosowania laboratoryjne.",
    },
    dualIncluded: "Podwójny zasilacz jest w komplecie (automatycznie).",
    nts5000PortsLabel: "NTS-5000: liczba portów PTP",

    recommended: "Model rekomendowany",

    back: "Wstecz",
    next: "Dalej",
    copyLink: "Kopiuj link",
    downloadJson: "Pobierz JSON",
    permalink: "Permalink",
    newConfig: "Nowa konfiguracja",

    contactsCompany: "Firma",
    contactsContact: "Kontakt (email / telefon)",
    contactsNotes: "Uwagi",

    summary: "Podsumowanie",
    footerNote:
      "© " + new Date().getFullYear() + " Konfigurator – pomoc w decyzji.",

    card: {
      title: {
        "nts-pico3": "NTS-PICO3",
        "nts-3000": "NTS-3000",
        "nts-4000": "NTS-4000",
        "nts-5000": "NTS-5000",
      },
      segment: {
        "nts-pico3": "Kompakt | NTP/PTP (edge)",
        "nts-3000": "PTP Grandmaster | NTP Stratum-1",
        "nts-4000": "PTP/PRTC-A | większa wydajność",
        "nts-5000": "ePRTC / PRTC A/B | rubid",
      },
      blurb: {
        "nts-pico3":
          "Dla małych sieci (dziesiątki klientów), ms (NTP) / podstawowe PTP.",
        "nts-3000":
          "Dla setek klientów, PTP enterprise (sub-ms do dziesiątek µs). Podwójny zasilacz opcjonalny.",
        "nts-4000":
          "Dla setek do tysięcy klientów, SFP, redundancja, sub-µs (telco/utility). Podwójny zasilacz w komplecie (automatycznie).",
        "nts-5000":
          "Dla dużych/krytycznych instalacji, ePRTC, długi holdover, tysiące klientów. Podwójny zasilacz w komplecie (automatycznie).",
      },
    },
  },
};

/** ========== STATIC MODELS ========== */
const MODELS: Array<{
  id: ModelId;
  img: string;
  datasheet: string;
  oscillator: "TCXO" | "OCXO" | "Rb";
  gnssDefault: boolean;
  lan: number;
  sfp: number;
  power: "Single" | "Redundant";
  redundantGnss: boolean;
}> = [
  {
    id: "nts-pico3",
    img: "/img/nts-pico3.jpg",
    datasheet: "NTS-PICO3", // user said plain text; if you have PDF url, put it here
    oscillator: "TCXO",
    gnssDefault: true,
    lan: 1,
    sfp: 0,
    power: "Single",
    redundantGnss: false,
  },
  {
    id: "nts-3000",
    img: "/img/nts-3000.jpg",
    datasheet:
      "https://www.elpromaelectronics.com/wp-content/uploads/woocommerce_uploads/2023/05/TimeSystems_NTS_3000_120525-tamqzn.pdf",
    oscillator: "OCXO",
    gnssDefault: true,
    lan: 2,
    sfp: 0,
    power: "Single",
    redundantGnss: false,
  },
  {
    id: "nts-4000",
    img: "/img/nts-4000.jpg",
    datasheet:
      "https://www.elpromaelectronics.com/wp-content/uploads/woocommerce_uploads/2023/05/TimeSystems_NTS_4000_120525-t2ham9.pdf",
    oscillator: "OCXO",
    gnssDefault: true,
    lan: 4,
    sfp: 2,
    power: "Redundant",
    redundantGnss: true,
  },
  {
    id: "nts-5000",
    img: "/img/nts-5000.jpg",
    datasheet:
      "https://www.elpromaelectronics.com/wp-content/uploads/woocommerce_uploads/2023/05/TimeSystems_NTS_5000_120525-eozbhw.pdf",
    oscillator: "Rb",
    gnssDefault: true,
    lan: 6,
    sfp: 2,
    power: "Redundant",
    redundantGnss: true,
  },
];

/** ========== HELPERS ========== */
function encodeConfig(cfg: unknown): string {
  const json = JSON.stringify(cfg);

  // 1) Prohlížeč: použij btoa
  if (typeof globalThis !== "undefined" && typeof (globalThis as any).btoa === "function") {
    return (globalThis as any).btoa(unescape(encodeURIComponent(json)));
  }

  // 2) Build/Node-like: použij Buffer, ale pouze dynamicky přes globalThis (bez typů)
  if (typeof globalThis !== "undefined" && (globalThis as any).Buffer) {
    return (globalThis as any).Buffer.from(json, "utf-8").toString("base64");
  }

  // 3) Nouzová cesta
  return json;
}

function decodeConfig(str: string): any | null {
  try {
    // 1) Prohlížeč: atob
    if (typeof globalThis !== "undefined" && typeof (globalThis as any).atob === "function") {
      const dec = (globalThis as any).atob(str);
      return JSON.parse(decodeURIComponent(escape(dec)));
    }

    // 2) Build/Node-like: Buffer
    if (typeof globalThis !== "undefined" && (globalThis as any).Buffer) {
      const dec = (globalThis as any).Buffer.from(str, "base64").toString("utf-8");
      return JSON.parse(dec);
    }

    // 3) Nouzová cesta
    return JSON.parse(str);
  } catch {
    return null;
  }
}

function recommendModel(devBand: DevBand, acc: AccuracyId): ModelId {
  if (acc === "eprtc") return "nts-5000";
  if (acc === "ptp_prtc") return devBand === "xl" ? "nts-5000" : "nts-4000";
  if (acc === "ptp_ent")
    return devBand === "large" || devBand === "xl" ? "nts-4000" : "nts-3000";
  // ntp_ms
  if (devBand === "small") return "nts-pico3";
  if (devBand === "medium") return "nts-3000";
  return "nts-4000";
}

/** ========== APP ========== */
export default function App() {
  const [lang, setLang] = useState<Lang>(() => {
    const s = localStorage.getItem("nts_lang") as Lang | null;
    return s ?? "cs";
  });

  const T = I18N[lang];
  useEffect(() => localStorage.setItem("nts_lang", lang), [lang]);

  type View = "home" | "wizard";
  const [view, setView] = useState<View>("home");

  const [step, setStep] = useState(0);
  const [devBand, setDevBand] = useState<DevBand>("medium");
  const [accuracy, setAccuracy] = useState<AccuracyId>("ptp_ent");

  const recommendedId = useMemo(
    () => recommendModel(devBand, accuracy),
    [devBand, accuracy]
  );
  const recommendedModel = useMemo(
    () => MODELS.find((m) => m.id === recommendedId)!,
    [recommendedId]
  );

  const [config, setConfig] = useState<Config>(() => ({
    model: "nts-3000",
    devBand: "medium",
    accuracy: "ptp_ent",
    oscillator: "OCXO",
    lan: 2,
    sfp: 0,
    power: "Single",
    redundantGnss: false,
    ptpProfile: "Default",
    accessories: [],
    nts5000_ptpPorts: 2,
    company: "",
    contact: "",
    notes: "",
  }));

  // Load from permalink
  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get("c");
    const dec = c ? decodeConfig(c) : null;
    if (dec) {
      setConfig(dec as Config);
      setView("wizard");
      setStep(3);
    }
  }, []);

  // Sync config defaults when recommendation changes
  useEffect(() => {
    const m = recommendedModel;
    setConfig((prev) => ({
      ...prev,
      model: m.id,
      devBand,
      accuracy,
      oscillator: m.oscillator,
      lan: m.lan,
      sfp: m.sfp,
      power: m.power,
      redundantGnss: m.redundantGnss,
    }));
  }, [recommendedModel, devBand, accuracy]);

  // PSU logic: If accessories contain psu but model is 4000/5000 (included), drop it
  useEffect(() => {
    setConfig((prev) => {
      if (prev.model === "nts-4000" || prev.model === "nts-5000") {
        if (prev.accessories.includes("psu")) {
          return { ...prev, accessories: prev.accessories.filter((a) => a !== "psu") };
        }
        // Also force power to Redundant for these models
        return { ...prev, power: "Redundant" };
      }
      return prev;
    });
  }, [config.model]);

  // share URL
  const shareUrl = useMemo(() => {
    const base =
      typeof window !== "undefined"
        ? window.location.origin + window.location.pathname
        : "";
    return `${base}?c=${encodeConfig(config)}`;
  }, [config]);

  // cards list:
  const HomeCard: React.FC<{ id: ModelId }> = ({ id }) => {
    const m = MODELS.find((x) => x.id === id)!;
    return (
      <div className="card">
        <div className="card__image">
          <img src={m.img} alt={id} />
        </div>
        <div className="card__body">
          <div className="card__title">{T.card.title[id]}</div>
          <div className="card__segment">{T.card.segment[id]}</div>
          <p className="card__blurb">{T.card.blurb[id]}</p>
          <div>
            <a
              className="btn btn-ghost"
              href={m.datasheet}
              target="_blank"
              rel="noreferrer"
            >
              {T.datasheet}
            </a>
          </div>
        </div>
      </div>
    );
  };

  const accessoriesOrder: AccessoryId[] = [
    "antenna_spare",
    "irig",
    "fo",
    "psu",
    "5071a",
  ];

  const summaryText = useMemo(() => {
    const lines = [
      `${T.recommended}: ${T.card.title[config.model]} (${T.card.segment[config.model]})`,
      `${T.step1Title} → ${T.bandLabels[config.devBand]}`,
      `${T.step2Title} → ${T.accLabels[config.accuracy]}`,
      `Holdover: ${config.oscillator}`,
      `LAN/SFP: ${config.lan}×LAN, ${config.sfp}×SFP`,
      `Power: ${config.power}${config.redundantGnss ? ", redundant GNSS" : ""}`,
      `PTP profile: ${config.ptpProfile}`,
      `Accessories: ${
        config.accessories.length ? config.accessories.join(", ") : "—"
      }`,
      config.model === "nts-5000" ? `PTP ports: ${config.nts5000_ptpPorts}` : "",
      config.company ? `Company: ${config.company}` : "",
      config.contact ? `Contact: ${config.contact}` : "",
      config.notes ? `Notes: ${config.notes}` : "",
    ].filter(Boolean);
    return lines.join("\n");
  }, [config, T]);

  return (
    <div className="app">
      {/* HEADER */}
      <header className="header">
        <div className="brand" onClick={() => { setView("home"); setStep(0); }}>
          <img src="/vite.svg" alt="logo" />
          <span>Westercom</span>
        </div>
        <div className="header__title" onClick={() => setView("home")}>
          {T.appTitle}
        </div>
        <div className="lang">
          <label>{T.language}: </label>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as Lang)}
          >
            <option value="cs">Čeština</option>
            <option value="en">English</option>
            <option value="pl">Polski</option>
          </select>
        </div>
      </header>

      {/* HOME */}
      {view === "home" && (
        <main className="container">
          <p className="subtitle">{T.subtitle}</p>

          <div className="home__title">{T.overviewTitle}</div>
          <p className="home__lead">
            {T.notSure} <b className="start" onClick={() => setView("wizard")}>{T.startWizard}</b>.
          </p>

          <div className="grid">
            <HomeCard id="nts-pico3" />
            <HomeCard id="nts-3000" />
            <HomeCard id="nts-4000" />
            <HomeCard id="nts-5000" />
          </div>

          <div className="center">
            <button className="btn btn-primary" onClick={() => setView("wizard")}>
              {T.startWizard}
            </button>
          </div>
        </main>
      )}

      {/* WIZARD */}
      {view === "wizard" && (
        <main className="container">
          {/* progress */}
          <div className="progress">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={"progress__bar " + (i <= step ? "is-active" : "")}/>
            ))}
          </div>

          {/* Step 1: devices */}
          {step === 0 && (
            <section className="section">
              <div className="section__head">{T.step1Title}</div>
              <div className="section__grid2">
                <div>
                  {(["small", "medium", "large", "xl"] as DevBand[]).map((b) => (
                    <label key={b} className="option">
                      <input
                        type="radio"
                        name="band"
                        checked={devBand === b}
                        onChange={() => setDevBand(b)}
                      />
                      <span>{T.bandLabels[b]}</span>
                    </label>
                  ))}
                </div>
                <div className="hint">
                  <div className="hint__title">{T.explainTitle}</div>
                  <ul>
                    {T.guideTips.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="actions">
                <button className="btn btn-primary" onClick={() => setStep(1)}>
                  {T.next}
                </button>
              </div>
            </section>
          )}

          {/* Step 2: accuracy */}
          {step === 1 && (
            <section className="section">
              <div className="section__head">{T.step2Title}</div>
              <div className="section__grid2">
                <div>
                  {(["ntp_ms", "ptp_ent", "ptp_prtc", "eprtc"] as AccuracyId[]).map(
                    (a) => (
                      <label key={a} className="option option--top">
                        <input
                          type="radio"
                          name="acc"
                          checked={accuracy === a}
                          onChange={() => setAccuracy(a)}
                        />
                        <span>
                          <div className="bold">{T.accLabels[a]}</div>
                          <div className="muted">{T.accHelps[a]}</div>
                        </span>
                      </label>
                    )
                  )}
                </div>
                <div className="hint">
                  <div className="hint__title">{T.recommended}</div>
                  <div className="rec">
                    <img src={recommendedModel.img} alt={recommendedModel.id} />
                    <div>
                      <div className="bold">
                        {T.card.title[recommendedModel.id]}
                      </div>
                      <div className="muted">
                        {T.card.segment[recommendedModel.id]}
                      </div>
                      <p className="muted">{T.card.blurb[recommendedModel.id]}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="actions">
                <button className="btn" onClick={() => setStep(0)}>
                  {T.back}
                </button>
                <button className="btn btn-primary" onClick={() => setStep(2)}>
                  {T.next}
                </button>
              </div>
            </section>
          )}

          {/* Step 3: accessories */}
          {step === 2 && (
            <section className="section">
              <div className="section__head">{T.step3Title}</div>
              <div className="section__grid2">
                <div>
                  <div className="muted mb8">{T.accessoriesTitle}</div>
                  {accessoriesOrder.map((a) => {
                    // PSU rule:
                    const isPsu = a === "psu";
                    const included =
                      config.model === "nts-4000" || config.model === "nts-5000";
                    const disabled = isPsu && included;
                    const checked = config.accessories.includes(a);

                    return (
                      <label key={a} className={"option " + (disabled ? "is-disabled" : "")}>
                        <input
                          type="checkbox"
                          disabled={disabled}
                          checked={checked}
                          onChange={(e) => {
                            const set = new Set(config.accessories);
                            if (e.target.checked) set.add(a);
                            else set.delete(a);
                            setConfig({ ...config, accessories: Array.from(set) });
                          }}
                        />
                        <span>
                          <div className="bold">
                            {T.accessoryLabels[a]}
                            {disabled && (
                              <em className="muted"> — {T.dualIncluded}</em>
                            )}
                          </div>
                          <div className="muted">{T.accessoryDesc[a]}</div>
                        </span>
                      </label>
                    );
                  })}

                  {config.model === "nts-5000" && (
                    <div className="inlineField">
                      <label htmlFor="ptpPorts" className="bold">
                        {T.nts5000PortsLabel}
                      </label>
                      <select
                        id="ptpPorts"
                        value={config.nts5000_ptpPorts}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            nts5000_ptpPorts: Number(e.target.value) as 1 | 2 | 3 | 4,
                          })
                        }
                      >
                        {[1, 2, 3, 4].map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="hint">
                  <div className="hint__title">{T.recommended}</div>
                  <div className="rec">
                    <img src={recommendedModel.img} alt={recommendedModel.id} />
                    <div>
                      <div className="bold">
                        {T.card.title[recommendedModel.id]}
                      </div>
                      <div className="muted">
                        {T.card.segment[recommendedModel.id]}
                      </div>
                      <p className="muted">{T.card.blurb[recommendedModel.id]}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="actions">
                <button className="btn" onClick={() => setStep(1)}>
                  {T.back}
                </button>
                <button className="btn btn-primary" onClick={() => setStep(3)}>
                  {T.next}
                </button>
              </div>
            </section>
          )}

          {/* Step 4: contacts & export */}
          {step === 3 && (
            <section className="section">
              <div className="section__head">{T.step4Title}</div>
              <div className="section__grid2">
                <div>
                  <div className="field">
                    <label className="muted">{T.contactsCompany}</label>
                    <input
                      value={config.company}
                      onChange={(e) =>
                        setConfig({ ...config, company: e.target.value })
                      }
                      placeholder={T.contactsCompany}
                    />
                  </div>
                  <div className="field">
                    <label className="muted">{T.contactsContact}</label>
                    <input
                      value={config.contact}
                      onChange={(e) =>
                        setConfig({ ...config, contact: e.target.value })
                      }
                      placeholder={T.contactsContact}
                    />
                  </div>
                  <div className="field">
                    <label className="muted">{T.contactsNotes}</label>
                    <textarea
                      rows={4}
                      value={config.notes}
                      onChange={(e) =>
                        setConfig({ ...config, notes: e.target.value })
                      }
                      placeholder={T.contactsNotes}
                    />
                  </div>
                </div>

                <div>
                  <div className="summary">
                    <div className="bold mb6">{T.summary}</div>
                    <pre className="pre">{summaryText}</pre>
                  </div>

                  <div className="row">
                    <button
                      className="btn btn-primary"
                      onClick={() => navigator.clipboard.writeText(shareUrl)}
                    >
                      {T.copyLink}
                    </button>
                    <button
                      className="btn"
                      onClick={() => {
                        const blob = new Blob([JSON.stringify(config, null, 2)], {
                          type: "application/json",
                        });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `${config.model}-config.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      {T.downloadJson}
                    </button>
                  </div>

                  <div className="permalink">
                    <div className="bold mb6">{T.permalink}</div>
                    <textarea readOnly value={shareUrl} />
                  </div>
                </div>
              </div>

              <div className="actions">
                <button className="btn" onClick={() => setStep(2)}>
                  {T.back}
                </button>
                <button
                  className="btn"
                  onClick={() => {
                    setStep(0);
                    setConfig((c) => ({
                      ...c,
                      accessories: [],
                      company: "",
                      contact: "",
                      notes: "",
                    }));
                  }}
                >
                  {T.newConfig}
                </button>
              </div>
            </section>
          )}
        </main>
      )}

      <footer className="footer">{T.footerNote}</footer>
    </div>
  );
}
