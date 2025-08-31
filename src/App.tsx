import { useMemo, useState } from 'react';
import './App.css';

/* ========= Typy ========= */
type Lang = 'cs' | 'en' | 'pl';
type Screen = 'landing' | 'wizard';

type ModelId = 'nts-pico3' | 'nts-3000' | 'nts-4000' | 'nts-5000';

type I18nBlock = Record<Lang, string>;

type Model = {
  id: ModelId;
  name: string;
  img: string;
  datasheet?: string;
  tag: I18nBlock;
  desc?: I18nBlock; // může chybět → blok se nevyrenderuje
};

/* ========= Texty ========= */
const TXT = {
  brand: { cs: 'Elproma NTS konfigurátor časových serverů', en: 'Elproma NTS Time Servers Configurator', pl: 'Konfigurator serwerów czasu Elproma NTS' } as I18nBlock,
  heading: { cs: 'Přehled časových serverů', en: 'Time Servers Overview', pl: 'Przegląd serwerów czasu' } as I18nBlock,
  unsure: { cs: 'Nejste si jistí?', en: 'Not sure?', pl: 'Nie jesteś pewien?' } as I18nBlock,
  start: { cs: 'Spustit konfigurátor', en: 'Start configurator', pl: 'Uruchom konfigurator' } as I18nBlock,
  datasheet: { cs: 'Datasheet', en: 'Datasheet', pl: 'Karta katalogowa' } as I18nBlock,
  langLabel: { cs: 'Jazyk:', en: 'Language:', pl: 'Język:' } as I18nBlock,
} as const;

const MODELS: Model[] = [
  {
    id: 'nts-pico3',
    name: 'NTS-PICO3',
    img: '/img/nts-pico3.jpg',
    // nemáme odkaz na datasheet → necháme prázdné
    tag: {
      cs: 'Kompaktní | NTP/PTP (edge)',
      en: 'Compact | NTP/PTP (edge)',
      pl: 'Kompaktowy | NTP/PTP (edge)',
    },
    desc: {
      cs: 'Pro malé sítě (desítky klientů), přesnost ms (NTP) / základní PTP.',
      en: 'For small networks (dozens of clients), ms accuracy (NTP) / basic PTP.',
      pl: 'Dla małych sieci (dziesiątki klientów), dokładność ms (NTP) / podstawowy PTP.',
    },
  },
  {
    id: 'nts-3000',
    name: 'NTS-3000',
    img: '/img/nts-3000.jpg',
    datasheet:
      'https://www.elpromaelectronics.com/wp-content/uploads/woocommerce_uploads/2023/05/TimeSystems_NTS_3000_120525-tamqzn.pdf',
    tag: {
      cs: 'PTP Grandmaster | NTP Stratum-1',
      en: 'PTP Grandmaster | NTP Stratum-1',
      pl: 'PTP Grandmaster | NTP Stratum-1',
    },
    desc: {
      cs: 'Pro stovky klientů, enterprise PTP (sub-ms až desítky µs). Dual PSU je volitelný.',
      en: 'For hundreds of clients, enterprise PTP (sub-ms to tens of µs). Dual PSU is optional.',
      pl: 'Dla setek klientów, enterprise PTP (poniżej ms do kilkudziesięciu µs). Podwójny PSU opcjonalny.',
    },
  },
  {
    id: 'nts-4000',
    name: 'NTS-4000',
    img: '/img/nts-4000.jpg',
    datasheet:
      'https://www.elpromaelectronics.com/wp-content/uploads/woocommerce_uploads/2023/05/TimeSystems_NTS_4000_120525-t2ham9.pdf',
    tag: {
      cs: 'PTP/PRTC-A | vyšší kapacita',
      en: 'PTP/PRTC-A | higher capacity',
      pl: 'PTP/PRTC-A | większa pojemność',
    },
    desc: {
      cs: 'Pro stovky až tisíce klientů, SFP, redundance, sub-µs (telekom/utility). Dual PSU je součástí (automaticky).',
      en: 'For hundreds to thousands of clients, SFP, redundancy, sub-µs (telecom/utility). Dual PSU included (automatic).',
      pl: 'Dla setek do tysięcy klientów, SFP, redundancja, poniżej µs (telekom/usługi). Podwójny PSU w zestawie.',
    },
  },
  {
    id: 'nts-5000',
    name: 'NTS-5000',
    img: '/img/nts-5000.jpg',
    datasheet:
      'https://www.elpromaelectronics.com/wp-content/uploads/woocommerce_uploads/2023/05/TimeSystems_NTS_5000_120525-eozbhw.pdf',
    tag: {
      cs: 'ePRTC / PRTC A/B | rubidium',
      en: 'ePRTC / PRTC A/B | rubidium',
      pl: 'ePRTC / PRTC A/B | rubid',
    },
    desc: {
      cs: 'Pro velké/kritické instalace, ePRTC, dlouhý holdover, tisíce klientů. Dual PSU je součástí (automaticky).',
      en: 'For large/critical installations, ePRTC, long holdover, thousands of clients. Dual PSU included (automatic).',
      pl: 'Dla dużych/krytycznych instalacji, ePRTC, długi holdover, tysiące klientów. Podwójny PSU w zestawie.',
    },
  },
];

/* ========= Pomocné ========= */
const t = (txt: I18nBlock, lang: Lang) => txt[lang];

/* ========= Komponenty ========= */

function Header({
  lang,
  setLang,
  goHome,
}: {
  lang: Lang;
  setLang: (l: Lang) => void;
  goHome: () => void;
}) {
  return (
    <header className="app-header">
      <button className="brand" onClick={goHome} title="Zpět na přehled">
        <img
          src="https://www.westercom.eu/img/logo-1634110785.jpg"
          alt="Westercom"
          height={24}
        />
        <span className="brand-text">{t(TXT.brand, lang)}</span>
      </button>

      <label className="lang">
        <span>{t(TXT.langLabel, lang)}</span>
        <select value={lang} onChange={(e) => setLang(e.target.value as Lang)}>
          <option value="cs">Čeština</option>
          <option value="en">English</option>
          <option value="pl">Polski</option>
        </select>
      </label>
    </header>
  );
}

function Landing({
  lang,
  onStart,
}: {
  lang: Lang;
  onStart: () => void;
}) {
  return (
    <main className="container">
      <div className="heading-row">
        <h1>{t(TXT.heading, lang)}</h1>
        <div className="hint">
          <span>{t(TXT.unsure, lang)}&nbsp;</span>
          <button className="btn-link" onClick={onStart}>
            {t(TXT.start, lang)}
          </button>
        </div>
      </div>

      <div className="models">
        {MODELS.map((m) => {
          const desc = m.desc?.[lang] ?? '';
          return (
            <article key={m.id} className="card">
              <div className="card__img">
                <img src={m.img} alt={m.name} />
              </div>

              <div className="card__content">
                <h2 className="card__title">{m.name}</h2>
                <div className="card__tag">{m.tag[lang]}</div>

                {desc && <p className="card__desc">{desc}</p>}

                <div className="card__push" />
                <div className="card__actions">
                  {m.datasheet ? (
                    <a
                      className="btn"
                      href={m.datasheet}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {t(TXT.datasheet, lang)}
                    </a>
                  ) : (
                    <button className="btn btn--ghost" disabled>
                      {t(TXT.datasheet, lang)}
                    </button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="cta-row">
        <button className="btn btn--primary" onClick={onStart}>
          {t(TXT.start, lang)}
        </button>
      </div>
    </main>
  );
}

function Wizard({ lang, goHome }: { lang: Lang; goHome: () => void }) {
  // Sem můžeš vrátit svůj existující “průvodce”. Zatím jednoduché placeholder UI:
  return (
    <main className="container">
      <div className="heading-row">
        <h1>Wizard</h1>
        <div className="hint">
          <button className="btn-link" onClick={goHome}>
            ← {t(TXT.heading, lang)}
          </button>
        </div>
      </div>

      <section className="placeholder">
        <p>
          Tady můžeš vložit svůj kompletní rozhodovací průvodce (4 kroky, doplňky, export,
          permalink…). Frontend je připraven — stačí napojit.
        </p>
      </section>
    </main>
  );
}

/* ========= App ========= */

export default function App() {
  const [lang, setLang] = useState<Lang>('cs');
  const [screen, setScreen] = useState<Screen>('landing');

  const goHome = () => setScreen('landing');

  return (
    <div className="app">
      <Header lang={lang} setLang={setLang} goHome={goHome} />

      {screen === 'landing' ? (
        <Landing lang={lang} onStart={() => setScreen('wizard')} />
      ) : (
        <Wizard lang={lang} goHome={goHome} />
      )}

      <footer className="app-footer">
        © {new Date().getFullYear()} Westercom • Elproma
      </footer>
    </div>
  );
}
