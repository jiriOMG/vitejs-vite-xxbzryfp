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
