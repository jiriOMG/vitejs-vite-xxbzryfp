import React, { useEffect, useMemo, useState } from "react";

/* =========================
   Types
========================= */

type Lang = "cs" | "en" | "pl";

type ModelId = "nts-pico3" | "nts-3000" | "nts-4000" | "nts-5000";
type DevBand = "small" | "medium" | "large" | "xl";
type AccuracyId = "ntp_ms" | "ptp_ent" | "ptp_prtc" | "eprtc";

type ModelTexts = Record<ModelId, { segment: string; notes: string }>;

type AccessoryId = "antenna" | "irig" | "psu" | "fo" | "5071a";

/* =========================
   Assets & constants
========================= */

const LOGO =
  "https://www.westercom.eu/img/logo-1634110785.jpg"; // header logo

const MODEL_IMAGES: Record<ModelId, string> = {
  "nts-pico3": "/img/nts-pico3.jpg",
  "nts-3000": "/img/nts-3000.jpg",
  "nts-4000": "/img/nts-4000.jpg",
  "nts-5000": "/img/nts-5000.jpg",
};

const DATASHEETS: Record<ModelId, string> = {
  "nts-pico3": "#", // TODO: add real link when available
  "nts-3000":
    "https://www.elpromaelectronics.com/wp-content/uploads/woocommerce_uploads/2023/05/TimeSystems_NTS_3000_120525-tamqzn.pdf",
  "nts-4000":
    "https://www.elpromaelectronics.com/wp-content/uploads/woocommerce_uploads/2023/05/TimeSystems_NTS_4000_120525-t2ham9.pdf",
  "nts-5000":
    "https://www.elpromaelectronics.com/wp-content/uploads/woocommerce_uploads/2023/05/TimeSystems_NTS_5000_120525-eozbhw.pdf",
};

/* =========================
   i18n
========================= */

const i18n: Record<
  Lang,
  {
    ui: {
      title: string;
      subtitle: string;
      start: string;
      overview: string;
      language: string;
      datasheet: string;
      stepDevices: string;
      stepAccuracy: string;
      stepAccessories: string;
      stepContacts: string;
      next: string;
      back: string;
      copyLink: string;
      downloadJson: string;
      permalink: string;
      newConfig: string;
      company: string;
      contact: string;
      notes: string;
      helperChoose: string;
    };
    bands: { id: DevBand; label: string }[];
    accuracy: { id: AccuracyId; label: string; help: string }[];
    bullets: string[];
    accessories: Record<
      AccessoryId,
      { name: string; desc: string; disabledNote?: string }
    >;
    modelExtras: { redPsuAuto: string; redPsuOptional: string };
    models: ModelTexts;
  }
> = {
  cs: {
    ui: {
      title: "Elproma NTS Konfigurátor časových serverů",
      subtitle:
        "Interaktivní průvodce, který pomůže vybrat správný časový server pro vaši infrastrukturu.",
      start: "Spustit konfigurátor",
      overview: "Přehled časových serverů",
      language: "Jazyk:",
      datasheet: "Datasheet",
      stepDevices: "1) Kolik zařízení potřebujete synchronizovat?",
      stepAccuracy: "2) Požadovaná přesnost",
      stepAccessories: "3) Volitelné doplňky",
      stepContacts: "4) Kontakty & export",
      next: "Pokračovat",
      back: "Zpět",
      copyLink: "Zkopírovat odkaz",
      downloadJson: "Stáhnout JSON",
      permalink: "Permalink",
      newConfig: "Nová konfigurace",
      company: "Společnost",
      contact: "Kontakt (e-mail / telefon)",
      notes: "Poznámky",
      helperChoose:
        "Seznam modelů s popisem a odkazem na datasheet. Nejste si jistí? Klikněte na Spustit konfigurátor a nechte se vést.",
    },
    bands: [
      { id: "small", label: "do ~50 zařízení" },
      { id: "medium", label: "~50–200 zařízení" },
      { id: "large", label: "~200–1000 zařízení" },
      { id: "xl", label: ">1000 zařízení" },
    ],
    accuracy: [
      {
        id: "ntp_ms",
        label: "NTP – milisekundy",
        help: "Běžná IT síť, logy, servery, CCTV.",
      },
      {
        id: "ptp_ent",
        label: "PTP Enterprise – sub-ms až desítky µs",
        help: "Datacentra, průmysl; záleží na síti / HW timestampingu.",
      },
      {
        id: "ptp_prtc",
        label: "PTP Telecom/PRTC-A – sub-µs",
        help: "Telekom/utility, synchronizace sítí; často SFP a HW GM.",
      },
      {
        id: "eprtc",
        label: "ePRTC / dlouhý holdover",
        help: "Kritická infrastruktura, rubidium.",
      },
    ],
    bullets: [
      "Desítky klientů → NTP / základní PTP (PICO3 / NTS-3000).",
      "Stovky až tisíce → výkonnější GM, SFP, redundance (NTS-4000/5000).",
    ],
    accessories: {
      antenna: {
        name: "NTS-antenna – náhradní anténa (1 ks je již v balení)",
        desc: "Záložní nebo další GNSS anténa stejného typu jako je součástí balení.",
      },
      irig: {
        name: "IRIG-B IN/OUT module w/ 1PPS output",
        desc: "Rozhraní pro IRIG-B (vstup/výstup) a 1PPS – průmysl, energetika, synchronizace zařízení.",
      },
      psu: {
        name: "Dual Redundant Power Supply",
        desc: "Dvojité napájení pro zvýšení dostupnosti. U NTS-4000/5000 je již součástí (automaticky).",
        disabledNote: "Tato volba je k dispozici pouze pro NTS-3000.",
      },
      fo: {
        name: "Fibre Optic Antenna Set",
        desc: "Optický set pro přivedení GNSS signálu na velkou vzdálenost / potlačení rušení.",
      },
      "5071a": {
        name: "5071A special support (firmware)",
        desc: "Speciální FW pro spolupráci s externí cesiovou referencí 5071A.",
      },
    },
    modelExtras: {
      redPsuAuto: "Duální napájení je součástí (automaticky).",
      redPsuOptional: "Duální napájení volitelně.",
    },
    models: {
      "nts-pico3": {
        segment: "Kompaktní | NTP/PTP (edge)",
        notes:
          "Pro malé sítě (desítky klientů), milisekundový NTP / základní PTP.",
      },
      "nts-3000": {
        segment: "PTP Grandmaster | NTP Stratum-1",
        notes:
          "Pro stovky klientů, enterprise PTP (sub-ms až desítky µs). Duální PSU je volitelné.",
      },
      "nts-4000": {
        segment: "PTP/PRTC-A | vyšší kapacita",
        notes:
          "Pro stovky až tisíce klientů, SFP, redundance, sub-µs (telekom/utility). Duální PSU je součástí.",
      },
      "nts-5000": {
        segment: "ePRTC / PRTC A/B | rubidium",
        notes:
          "Pro velké/kritické instalace, ePRTC, dlouhý holdover, tisíce klientů. Duální PSU je součástí.",
      },
    },
  },

  en: {
    ui: {
      title: "Elproma NTS Time Servers Configurator",
      subtitle:
        "An interactive wizard that helps you choose the right time server for your infrastructure.",
      start: "Start configurator",
      overview: "Time Servers Overview",
      language: "Language:",
      datasheet: "Datasheet",
      stepDevices: "1) How many devices to synchronize?",
      stepAccuracy: "2) Required accuracy",
      stepAccessories: "3) Optional accessories",
      stepContacts: "4) Contacts & export",
      next: "Continue",
      back: "Back",
      copyLink: "Copy link",
      downloadJson: "Download JSON",
      permalink: "Permalink",
      newConfig: "New configuration",
      company: "Company",
      contact: "Contact (e-mail / phone)",
      notes: "Notes",
      helperChoose:
        "List of models with a short summary and datasheet link. Not sure? Click Start configurator and let it guide you.",
    },
    bands: [
      { id: "small", label: "up to ~50 devices" },
      { id: "medium", label: "~50–200 devices" },
      { id: "large", label: "~200–1000 devices" },
      { id: "xl", label: ">1000 devices" },
    ],
    accuracy: [
      {
        id: "ntp_ms",
        label: "NTP – milliseconds",
        help: "Common IT, logs, servers, CCTV.",
      },
      {
        id: "ptp_ent",
        label: "PTP Enterprise – sub-ms to tens of µs",
        help: "Data centers, industry; depends on network / HW timestamping.",
      },
      {
        id: "ptp_prtc",
        label: "PTP Telecom/PRTC-A – sub-µs",
        help: "Telecom/utility, network synchronization; often SFP & HW GM.",
      },
      {
        id: "eprtc",
        label: "ePRTC / long holdover",
        help: "Critical infrastructure, rubidium.",
      },
    ],
    bullets: [
      "Dozens of clients → NTP / basic PTP (PICO3 / NTS-3000).",
      "Hundreds to thousands → stronger GM, SFP, redundancy (NTS-4000/5000).",
    ],
    accessories: {
      antenna: {
        name: "NTS-antenna – spare antenna (1 pc already in the box)",
        desc: "Spare or additional GNSS antenna of the same type as supplied.",
      },
      irig: {
        name: "IRIG-B IN/OUT module w/ 1PPS output",
        desc: "IRIG-B interface (in/out) plus 1PPS – industry, energy, device sync.",
      },
      psu: {
        name: "Dual Redundant Power Supply",
        desc: "Dual PSU for higher availability. Included by default on NTS-4000/5000.",
        disabledNote: "This option is available only for NTS-3000.",
      },
      fo: {
        name: "Fibre Optic Antenna Set",
        desc: "Optical set to bring GNSS signal over long distances / avoid interference.",
      },
      "5071a": {
        name: "5071A special support (firmware)",
        desc: "Special firmware to interoperate with an external 5071A cesium reference.",
      },
    },
    modelExtras: {
      redPsuAuto: "Dual PSU is included (automatically).",
      redPsuOptional: "Dual PSU optional.",
    },
    models: {
      "nts-pico3": {
        segment: "Compact | NTP/PTP (edge)",
        notes:
          "For small networks (dozens of clients), millisecond NTP / basic PTP.",
      },
      "nts-3000": {
        segment: "PTP Grandmaster | NTP Stratum-1",
        notes:
          "For hundreds of clients, enterprise PTP (sub-ms to tens of µs). Dual PSU optional.",
      },
      "nts-4000": {
        segment: "PTP/PRTC-A | higher capacity",
        notes:
          "For hundreds to thousands of clients, SFP, redundancy, sub-µs (telecom/utility). Dual PSU included.",
      },
      "nts-5000": {
        segment: "ePRTC / PRTC A/B | rubidium",
        notes:
          "For large/critical installations, ePRTC, long holdover, thousands of clients. Dual PSU included.",
      },
    },
  },

  pl: {
    ui: {
      title: "Elproma NTS – konfigurator serwerów czasu",
      subtitle:
        "Interaktywny kreator, który pomoże wybrać właściwy serwer czasu dla Twojej infrastruktury.",
      start: "Uruchom konfigurator",
      overview: "Przegląd serwerów czasu",
      language: "Język:",
      datasheet: "Karta katalogowa",
      stepDevices: "1) Ile urządzeń synchronizować?",
      stepAccuracy: "2) Wymagana dokładność",
      stepAccessories: "3) Akcesoria opcjonalne",
      stepContacts: "4) Kontakt i eksport",
      next: "Dalej",
      back: "Wstecz",
      copyLink: "Skopiuj link",
      downloadJson: "Pobierz JSON",
      permalink: "Permalink",
      newConfig: "Nowa konfiguracja",
      company: "Firma",
      contact: "Kontakt (e-mail / telefon)",
      notes: "Uwagi",
      helperChoose:
        "Lista modeli z krótkim opisem i linkiem do karty katalogowej. Nie wiesz? Kliknij Uruchom konfigurator.",
    },
    bands: [
      { id: "small", label: "do ~50 urządzeń" },
      { id: "medium", label: "~50–200 urządzeń" },
      { id: "large", label: "~200–1000 urządzeń" },
      { id: "xl", label: ">1000 urządzeń" },
    ],
    accuracy: [
      {
        id: "ntp_ms",
        label: "NTP – milisekundy",
        help: "Typowe IT, logi, serwery, CCTV.",
      },
      {
        id: "ptp_ent",
        label: "PTP Enterprise – sub-ms do dziesiątek µs",
        help: "Centra danych, przemysł; zależy od sieci / HW timestampingu.",
      },
      {
        id: "ptp_prtc",
        label: "PTP Telecom/PRTC-A – sub-µs",
        help: "Telekom/utility; często SFP i sprzętowy GM.",
      },
      {
        id: "eprtc",
        label: "ePRTC / długi holdover",
        help: "Infrastruktura krytyczna, rubid.",
      },
    ],
    bullets: [
      "Dziesiątki klientów → NTP / podstawowe PTP (PICO3 / NTS-3000).",
      "Setki do tysięcy → mocniejszy GM, SFP, redundancja (NTS-4000/5000).",
    ],
    accessories: {
      antenna: {
        name: "NTS-antenna – antena zapasowa (1 szt. w zestawie)",
        desc: "Zapasowa lub dodatkowa antena GNSS tego samego typu.",
      },
      irig: {
        name: "IRIG-B IN/OUT module z wyjściem 1PPS",
        desc: "Interfejs IRIG-B (we/wy) i 1PPS – przemysł, energetyka, synchronizacja.",
      },
      psu: {
        name: "Podwójne zasilanie (Dual PSU)",
        desc: "Redundantne zasilanie. W NTS-4000/5000 jest już w zestawie.",
        disabledNote: "Dostępne tylko dla NTS-3000.",
      },
      fo: {
        name: "Fibre Optic Antenna Set",
        desc: "Zestaw optyczny do transmisji GNSS na duże odległości / eliminacji zakłóceń.",
      },
      "5071a": {
        name: "5071A – specjalne wsparcie (firmware)",
        desc: "Firmware do współpracy z zewnętrzną referencją cezową 5071A.",
      },
    },
    modelExtras: {
      redPsuAuto: "Podwójne zasilanie w komplecie (automatycznie).",
      redPsuOptional: "Podwójne zasilanie opcjonalne.",
    },
    models: {
      "nts-pico3": {
        segment: "Kompaktowy | NTP/PTP (edge)",
        notes:
          "Dla małych sieci (dziesiątki klientów), milisekundowy NTP / podstawowe PTP.",
      },
      "nts-3000": {
        segment: "PTP Grandmaster | NTP Stratum-1",
        notes:
          "Dla setek klientów, enterprise PTP (sub-ms do dziesiątek µs). Podwójne zasilanie opcjonalne.",
      },
      "nts-4000": {
        segment: "PTP/PRTC-A | większa wydajność",
        notes:
          "Dla setek do tysięcy klientów, SFP, redundancja, sub-µs (telekom/utility). Podwójne zasilanie w komplecie.",
      },
      "nts-5000": {
        segment: "ePRTC / PRTC A/B | rubid",
        notes:
          "Dla dużych/krytycznych instalacji, ePRTC, długi holdover, tysiące klientów. Podwójne zasilanie w komplecie.",
      },
    },
  },
};

/* =========================
   Models (tech defaults)
========================= */

const MODELS: {
  id: ModelId;
  name: string;
  image: string;
  defaults: {
    oscillator: "TCXO" | "OCXO" | "Rb";
    lan: number;
    sfp: number;
    power: "Single" | "Redundant";
    redundantGnss: boolean;
    redPsuAuto: boolean; // auto included (NTS-4000/5000)
  };
}[] = [
  {
    id: "nts-pico3",
    name: "NTS-PICO3",
    image: MODEL_IMAGES["nts-pico3"],
    defaults: {
      oscillator: "TCXO",
      lan: 1,
      sfp: 0,
      power: "Single",
      redundantGnss: false,
      redPsuAuto: false,
    },
  },
  {
    id: "nts-3000",
    name: "NTS-3000",
    image: MODEL_IMAGES["nts-3000"],
    defaults: {
      oscillator: "OCXO",
      lan: 2,
      sfp: 0,
      power: "Single",
      redundantGnss: false,
      redPsuAuto: false, // optional only here
    },
  },
  {
    id: "nts-4000",
    name: "NTS-4000",
    image: MODEL_IMAGES["nts-4000"],
    defaults: {
      oscillator: "OCXO",
      lan: 4,
      sfp: 2,
      power: "Redundant",
      redundantGnss: true,
      redPsuAuto: true,
    },
  },
  {
    id: "nts-5000",
    name: "NTS-5000",
    image: MODEL_IMAGES["nts-5000"],
    defaults: {
      oscillator: "Rb",
      lan: 6,
      sfp: 2,
      power: "Redundant",
      redundantGnss: true,
      redPsuAuto: true,
    },
  },
];

/* =========================
   Helpers (share)
========================= */

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

/* =========================
   Recommendation rules
========================= */

function recommendModel(dev: DevBand, acc: AccuracyId): ModelId {
  if (acc === "eprtc") return "nts-5000";
  if (acc === "ptp_prtc") return dev === "xl" ? "nts-5000" : "nts-4000";
  if (acc === "ptp_ent")
    return dev === "large" || dev === "xl" ? "nts-4000" : "nts-3000";
  // NTP
  if (dev === "small") return "nts-pico3";
  if (dev === "medium") return "nts-3000";
  return "nts-4000";
}

/* =========================
   App
========================= */

export default function App() {
  const [lang, setLang] = useState<Lang>("cs");
  const t = i18n[lang];

  const [view, setView] = useState<"intro" | "wizard">("intro");
  const [step, setStep] = useState(0);

  // decision & config
  const [devBand, setDevBand] = useState<DevBand>("medium");
  const [accuracy, setAccuracy] = useState<AccuracyId>("ptp_ent");
  const [ptpPorts5000, setPtpPorts5000] = useState<number>(2);

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
  }));

  // Load from URL (lang + config)
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const L = sp.get("l");
    if (L === "cs" || L === "en" || L === "pl") setLang(L);
    const c = sp.get("c");
    const dec = c ? decodeConfig(c) : null;
    if (dec && typeof dec === "object") {
      setConfig((prev) => ({ ...prev, ...(dec as any) }));
      setView("wizard");
    }
  }, []);

  const recommendedId = useMemo(
    () => recommendModel(devBand, accuracy),
    [devBand, accuracy]
  );
  const recommendedModel = useMemo(
    () => MODELS.find((m) => m.id === recommendedId)!,
    [recommendedId]
  );

  // keep defaults when the recommendation changes
  useEffect(() => {
    const m = recommendedModel;
    setConfig((prev) => ({
      ...prev,
      model: m.id,
      oscillator: m.defaults.oscillator,
      lan: m.defaults.lan,
      sfp: m.defaults.sfp,
      power: m.defaults.power,
      redundantGnss: m.defaults.redundantGnss,
    }));
  }, [recommendedModel]);

  // dual PSU lock: if model auto-PSU, ensure config shows Redundant
  useEffect(() => {
    if (recommendedModel.defaults.redPsuAuto) {
      setConfig((prev) => ({ ...prev, power: "Redundant" }));
    }
  }, [recommendedModel]);

  // share URL
  const shareUrl = useMemo(() => {
    const base =
      typeof window !== "undefined"
        ? window.location.origin + window.location.pathname
        : "";
    const qp = new URLSearchParams();
    qp.set("l", lang);
    qp.set("c", encodeConfig({ decision: { devBand, accuracy }, ...config }));
    return `${base}?${qp.toString()}`;
  }, [lang, devBand, accuracy, config]);

  // summary
  const redInfo =
    recommendedModel.defaults.redPsuAuto
      ? i18n[lang].modelExtras.redPsuAuto
      : i18n[lang].modelExtras.redPsuOptional;

  const summary = useMemo(
    () =>
      [
        `Model: ${recommendedModel.name} (${t.models[recommendedModel.id].segment})`,
        `Zařízení/Devices: ${
          t.bands.find((b) => b.id === devBand)?.label ?? devBand
        }`,
        `Přesnost/Accuracy: ${
          t.accuracy.find((a) => a.id === accuracy)?.label ?? accuracy
        }`,
        `Holdover: ${config.oscillator}`,
        `Síť/Network: ${config.lan}× LAN, ${config.sfp}× SFP`,
        `Napájení/Power: ${config.power}${
          recommendedModel.defaults.redPsuAuto ? " (auto)" : ""
        }`,
        `PTP profil: ${config.ptpProfile}`,
        `Doplňky/Accessories: ${
          config.accessories.length ? config.accessories.join(", ") : "—"
        }`,
        recommendedModel.id === "nts-5000"
          ? `PTP porty/ports (5000): ${ptpPorts5000}`
          : "",
      ]
        .filter(Boolean)
        .join("\n"),
    [t, recommendedModel, devBand, accuracy, config, ptpPorts5000]
  );

  /* =============== UI helpers =============== */

  const Card: React.FC<{
    children: React.ReactNode;
    style?: React.CSSProperties;
  }> = ({ children, style }) => (
    <div
      style={{
        border: "1px solid #e5e5e5",
        borderRadius: 16,
        boxShadow: "0 1px 6px rgba(0,0,0,.05)",
        background: "#fff",
        ...style,
      }}
    >
      {children}
    </div>
  );

  const LabelRow: React.FC<{
    children: React.ReactNode;
    active?: boolean;
    disabled?: boolean;
    onClick?: () => void;
  }> = ({ children, active, disabled, onClick }) => (
    <div
      onClick={disabled ? undefined : onClick}
      style={{
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        padding: 12,
        border: `1px solid ${active ? "#111" : "#e5e5e5"}`,
        borderRadius: 12,
        cursor: disabled ? "not-allowed" : "pointer",
        background: active ? "#f7f7f7" : "#fff",
        opacity: disabled ? 0.6 : 1,
        userSelect: "none",
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  );

  /* =============== Intro (catalog) =============== */

  const Intro = () => (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
      <Header />
      <h1 style={{ fontSize: 26, margin: "14px 0" }}>{t.overview}</h1>
      <p style={{ color: "#555", marginTop: 0 }}>{t.helperChoose}</p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
          gap: 20,
          marginTop: 12,
        }}
      >
        {MODELS.map((m) => (
          <Card key={m.id}>
            <div style={{ padding: 18, borderBottom: "1px solid #eee" }}>
              <img
                src={m.image}
                alt={m.name}
                style={{
                  width: "100%",
                  height: 160,
                  objectFit: "contain",
                  objectPosition: "center",
                  display: "block",
                }}
              />
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>{m.name}</div>
              <div className="muted" style={{ marginBottom: 10 }}>
                {t.models[m.id].segment}
              </div>
              <div className="muted" style={{ marginBottom: 10 }}>
                {t.models[m.id].notes}{" "}
                <i>{m.defaults.redPsuAuto ? t.modelExtras.redPsuAuto : ""}</i>
              </div>
              <a
                href={DATASHEETS[m.id]}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-block",
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: "1px solid #e5e5e5",
                  textDecoration: "none",
                }}
              >
                {t.datasheet}
              </a>
            </div>
          </Card>
        ))}
      </div>

      <div style={{ textAlign: "center", marginTop: 28 }}>
        <button
          className="btn btn-primary"
          onClick={() => {
            setView("wizard");
            setStep(0);
          }}
          style={{
            padding: "10px 16px",
            borderRadius: 12,
            background: "#111",
            color: "#fff",
            border: "1px solid #111",
            cursor: "pointer",
          }}
        >
          {t.start}
        </button>
      </div>

      <Footer />
    </div>
  );

  /* =============== Wizard Steps =============== */

  const StepDevices = () => (
    <Card>
      <div style={{ padding: 20, borderBottom: "1px solid #eee" }}>
        <b>{t.stepDevices}</b>
      </div>
      <div
        style={{
          padding: 20,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
        }}
      >
        <div>
          {t.bands.map((b) => (
            <LabelRow
              key={b.id}
              active={devBand === b.id}
              onClick={() => setDevBand(b.id)}
            >
              <input
                type="radio"
                checked={devBand === b.id}
                readOnly
                style={{ marginTop: 4 }}
              />
              <span>{b.label}</span>
            </LabelRow>
          ))}
        </div>
        <div
          style={{
            background: "#fafafa",
            padding: 14,
            borderRadius: 12,
            fontSize: 13,
            color: "#555",
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 6 }}>
            {lang === "cs"
              ? "Průvodce výběrem"
              : lang === "pl"
              ? "Wskazówki wyboru"
              : "Selection hints"}
          </div>
          <ul style={{ margin: "4px 0 0 18px", padding: 0 }}>
            {t.bullets.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </div>
      </div>
      <div
        style={{
          padding: "0 20px 20px",
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
        }}
      >
        <button
          onClick={() => setStep(1)}
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            background: "#111",
            color: "#fff",
            border: "1px solid #111",
            cursor: "pointer",
          }}
        >
          {t.next}
        </button>
      </div>
    </Card>
  );

  const StepAccuracy = () => (
    <Card>
      <div style={{ padding: 20, borderBottom: "1px solid #eee" }}>
        <b>{t.stepAccuracy}</b>
      </div>
      <div
        style={{
          padding: 20,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
        }}
      >
        <div>
          {t.accuracy.map((a) => (
            <LabelRow
              key={a.id}
              active={accuracy === a.id}
              onClick={() => setAccuracy(a.id)}
            >
              <input
                type="radio"
                checked={accuracy === a.id}
                readOnly
                style={{ marginTop: 4 }}
              />
              <span>
                <div style={{ fontWeight: 600 }}>{a.label}</div>
                <div style={{ fontSize: 12, color: "#666" }}>{a.help}</div>
              </span>
            </LabelRow>
          ))}
        </div>
        <div
          style={{
            background: "#fafafa",
            padding: 14,
            borderRadius: 12,
            fontSize: 13,
            color: "#555",
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 6 }}>
            {lang === "cs"
              ? "Vysvětlení"
              : lang === "pl"
              ? "Objaśnienie"
              : "Explanation"}
          </div>
          <p style={{ marginTop: 0 }}>
            {lang === "cs"
              ? "Vyberte cílovou úroveň přesnosti v síti. U PTP záleží na topologii, timestampingu a konfiguraci GM/BC."
              : lang === "pl"
              ? "Wybierz docelową dokładność w sieci. W PTP zależy to od topologii, timestampingu i konfiguracji GM/BC."
              : "Choose the target accuracy in your network. For PTP it depends on topology, timestamping and GM/BC configuration."}
          </p>
        </div>
      </div>
      <div
        style={{
          padding: "0 20px 20px",
          display: "flex",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <button
          onClick={() => setStep(0)}
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            border: "1px solid #ddd",
            background: "#fff",
            cursor: "pointer",
          }}
        >
          {t.back}
        </button>
        <button
          onClick={() => setStep(2)}
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            background: "#111",
            color: "#fff",
            border: "1px solid #111",
            cursor: "pointer",
          }}
        >
          {t.next}
        </button>
      </div>
    </Card>
  );

  const StepAccessories = () => {
    const a = i18n[lang].accessories;

    const is3000 = recommendedModel.id === "nts-3000";
    const is4000or5000 =
      recommendedModel.id === "nts-4000" || recommendedModel.id === "nts-5000";

    const accList: { id: AccessoryId; disabled?: boolean }[] = [
      { id: "antenna" },
      { id: "irig" },
      { id: "psu", disabled: !is3000 }, // PSU optional only for NTS-3000
      { id: "fo" },
      { id: "5071a" },
    ];

    const toggle = (name: string, checked: boolean) => {
      const s = new Set(config.accessories);
      checked ? s.add(name) : s.delete(name);
      setConfig({ ...config, accessories: Array.from(s) });
    };

    return (
      <Card>
        <div style={{ padding: 20, borderBottom: "1px solid #eee" }}>
          <b>{t.stepAccessories}</b>
        </div>
        <div
          style={{
            padding: 20,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
          }}
        >
          <div>
            {accList.map((item) => {
              const meta = a[item.id];
              const checked = config.accessories.includes(meta.name);
              const disabled = !!item.disabled;

              return (
                <LabelRow
                  key={item.id}
                  active={checked}
                  disabled={disabled}
                  onClick={() =>
                    !disabled && toggle(meta.name, !checked)
                  }
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) =>
                      toggle(meta.name, e.currentTarget.checked)
                    }
                    disabled={disabled}
                    style={{ marginTop: 3 }}
                  />
                  <span>
                    <div style={{ fontWeight: 600 }}>{meta.name}</div>
                    <div style={{ fontSize: 12, color: "#666" }}>{meta.desc}</div>
                    {disabled && meta.disabledNote ? (
                      <div style={{ fontSize: 12, color: "#999" }}>
                        {meta.disabledNote}
                      </div>
                    ) : null}
                  </span>
                </LabelRow>
              );
            })}

            {recommendedModel.id === "nts-5000" && (
              <div
                style={{
                  marginTop: 10,
                  padding: 12,
                  border: "1px solid #e5e5e5",
                  borderRadius: 12,
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 6 }}>
                  PTP ports (NTS-5000)
                </div>
                <select
                  value={ptpPorts5000}
                  onChange={(e) => setPtpPorts5000(parseInt(e.target.value, 10))}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 8,
                    border: "1px solid #ddd",
                  }}
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

          <div
            style={{
              background: "#fafafa",
              padding: 16,
              borderRadius: 12,
              fontSize: 14,
            }}
          >
            <div style={{ fontWeight: 700 }}>{recommendedModel.name}</div>
            <div className="muted">{t.models[recommendedModel.id].segment}</div>
            <p className="muted" style={{ marginTop: 8 }}>
              {t.models[recommendedModel.id].notes}{" "}
              {recommendedModel.defaults.redPsuAuto ? (
                <i>{i18n[lang].modelExtras.redPsuAuto}</i>
              ) : (
                <i>{i18n[lang].modelExtras.redPsuOptional}</i>
              )}
            </p>
          </div>
        </div>
        <div
          style={{
            padding: "0 20px 20px",
            display: "flex",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <button
            onClick={() => setStep(1)}
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: "1px solid #ddd",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            {t.back}
          </button>
          <button
            onClick={() => setStep(3)}
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              background: "#111",
              color: "#fff",
              border: "1px solid #111",
              cursor: "pointer",
            }}
          >
            {t.next}
          </button>
        </div>
      </Card>
    );
  };

  const StepContacts = () => (
    <Card>
      <div style={{ padding: 20, borderBottom: "1px solid #eee" }}>
        <b>{t.stepContacts}</b>
      </div>
      <div
        style={{
          padding: 20,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
        }}
      >
        <div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: "#555" }}>{t.company}</label>
            <input
              style={inputStyle}
              value={config.company}
              onChange={(e) => setConfig({ ...config, company: e.target.value })}
              placeholder={t.company}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: "#555" }}>{t.contact}</label>
            <input
              style={inputStyle}
              value={config.contact}
              onChange={(e) => setConfig({ ...config, contact: e.target.value })}
              placeholder={t.contact}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#555" }}>{t.notes}</label>
            <textarea
              rows={4}
              style={inputStyle}
              value={config.notes}
              onChange={(e) => setConfig({ ...config, notes: e.target.value })}
              placeholder="Požadavky, normy, prostředí… / Requirements…"
            />
          </div>
        </div>

        <div>
          <div
            style={{
              background: "#fafafa",
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 6 }}>
              {lang === "cs"
                ? "Shrnutí"
                : lang === "pl"
                ? "Podsumowanie"
                : "Summary"}
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

          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <button
              onClick={() => navigator.clipboard.writeText(shareUrl)}
              style={primaryBtn}
            >
              {t.copyLink}
            </button>
            <button
              onClick={() => {
                const blob = new Blob(
                  [
                    JSON.stringify(
                      { decision: { devBand, accuracy, ptpPorts5000 }, ...config },
                      null,
                      2
                    ),
                  ],
                  { type: "application/json" }
                );
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${recommendedId}-config.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              style={ghostBtn}
            >
              {t.downloadJson}
            </button>
          </div>

          <div
            style={{
              border: "1px solid #eee",
              borderRadius: 12,
              padding: 10,
              fontSize: 12,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 4 }}>
              {t.permalink}
            </div>
            <textarea
              readOnly
              value={shareUrl}
              style={{
                width: "100%",
                height: 70,
                fontFamily:
                  "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
                fontSize: 11,
                border: "1px solid #e5e5e5",
                borderRadius: 8,
                padding: "6px 8px",
              }}
            />
          </div>
        </div>
      </div>

      <div
        style={{
          padding: "0 20px 20px",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <button onClick={() => setStep(2)} style={ghostBtn}>
          {t.back}
        </button>
        <button
          onClick={() => {
            setStep(0);
            setConfig((c) => ({
              ...c,
              accessories: [],
              company: "",
              contact: "",
              notes: "",
            }));
            setView("intro");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          style={ghostBtn}
        >
          {t.newConfig}
        </button>
      </div>
    </Card>
  );

  /* =============== Common header/footer =============== */

  const Header = () => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        justifyContent: "space-between",
      }}
    >
      <div
        style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
        onClick={() => {
          setView("intro");
          setStep(0);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        title="Home"
      >
        <img src={LOGO} alt="Westercom" style={{ height: 26, objectFit: "contain" }} />
        <div style={{ fontWeight: 700 }}>
          {t.title}
        </div>
      </div>

      <div>
        <label style={{ marginRight: 8 }}>{t.language}</label>
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value as Lang)}
          style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #ddd" }}
        >
          <option value="cs">Čeština</option>
          <option value="en">English</option>
          <option value="pl">Polski</option>
        </select>
      </div>
    </div>
  );

  const Footer = () => (
    <div style={{ marginTop: 24, fontSize: 12, color: "#666" }}>
      © {new Date().getFullYear()} {lang === "cs"
        ? "Konfigurátor – rozhodovací průvodce."
        : lang === "pl"
        ? "Konfigurator – kreator wyboru."
        : "Configurator – decision helper."}
    </div>
  );

  /* =============== Render =============== */

  const Progress = () => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, margin: "16px 0 24px" }}>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            height: 8,
            borderRadius: 999,
            background: i <= step ? "#111" : "#e5e5e5",
          }}
        />
      ))}
    </div>
  );

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div style={{ minHeight: "100vh", background: "#fff", color: "#111" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
        <Header />
        {view === "wizard" && <Progress />}
        {children}
        <Footer />
      </div>
    </div>
  );

  if (view === "intro") {
    return <Intro />;
  }

  return (
    <Wrapper>
      {step === 0 && <StepDevices />}
      {step === 1 && <StepAccuracy />}
      {step === 2 && <StepAccessories />}
      {step === 3 && <StepContacts />}
    </Wrapper>
  );
}

/* =========================
   Small style helpers
========================= */

const inputStyle: React.CSSProperties = {
  marginTop: 6,
  width: "100%",
  border: "1px solid #ddd",
  borderRadius: 8,
  padding: "8px 10px",
};

const primaryBtn: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 10,
  background: "#111",
  color: "#fff",
  border: "1px solid #111",
  cursor: "pointer",
};

const ghostBtn: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 10,
  border: "1px solid #ddd",
  background: "#fff",
  cursor: "pointer",
};
