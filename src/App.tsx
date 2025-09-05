import React from 'react';
import './App.css';

type ModelCard = {
  id: 'nts-pico3' | 'nts-3000' | 'nts-4000' | 'nts-5000';
  title: string;
  subtitle: string;
  desc: string;
  img: string;
  datasheet?: string; // pokud není, tlačítko bude disabled
};

const MODELS: ModelCard[] = [
  {
    id: 'nts-pico3',
    title: 'NTS-PICO3',
    subtitle: 'Kompaktní | NTP/PTP (edge)',
    desc: 'Pro malé sítě (desítky klientů), přesnost ms (NTP) / základní PTP.',
    img: '/img/nts-pico3.jpg',
    // Jakmile budeš mít URL, odkomentuj:
    // datasheet: 'https://…'
  },
  {
    id: 'nts-3000',
    title: 'NTS-3000',
    subtitle: 'PTP Grandmaster | NTP Stratum-1',
    desc: 'Pro stovky klientů, enterprise PTP (sub-ms až desítky µs). Dual PSU je volitelný.',
    img: '/img/nts-3000.jpg',
    datasheet:
      'https://www.elpromaelectronics.com/wp-content/uploads/woocommerce_uploads/2023/05/TimeSystems_NTS_3000_120525-tamqzn.pdf',
  },
  {
    id: 'nts-4000',
    title: 'NTS-4000',
    subtitle: 'PTP/PRTC-A | vyšší kapacita',
    desc: 'Pro stovky až tisíce klientů, SFP, redundance, sub-µs (telekom/utility). Dual PSU je součástí (automaticky).',
    img: '/img/nts-4000.jpg',
    datasheet:
      'https://www.elpromaelectronics.com/wp-content/uploads/woocommerce_uploads/2023/05/TimeSystems_NTS_4000_120525-t2ham9.pdf',
  },
  {
    id: 'nts-5000',
    title: 'NTS-5000',
    subtitle: 'ePRTC / PRTC A/B | rubidium',
    desc: 'Pro velké/kritické instalace, ePRTC, dlouhý holdover, tisíce klientů. Dual PSU je součástí (automaticky).',
    img: '/img/nts-5000.jpg',
    datasheet:
      'https://www.elpromaelectronics.com/wp-content/uploads/woocommerce_uploads/2023/05/TimeSystems_NTS_5000_120525-eozbhw.pdf',
  },
];

export default function App() {
  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <a href="/" className="brand" aria-label="Westercom">
          <img
            src="https://www.westercom.eu/img/logo-1634110785.jpg"
            alt="Westercom"
            className="brand__logo"
          />
          <span className="brand__title">Elproma NTS konfigurátor časových serverů</span>
        </a>

        <div className="header-right">
          <span className="muted">Nejste si jistí?</span>{' '}
          <a className="link" href="#wizard">Spustit konfigurátor</a>
        </div>
      </header>

      <main className="container">
        <h1>Přehled časových serverů</h1>

        {/* 2-sloupcová mřížka, karty stejné výšky */}
        <section className="grid">
          {MODELS.map((m) => (
            <article key={m.id} className="card">
              <div className="card__media">
                <img src={m.img} alt={m.title} />
              </div>

              <div className="card__body">
                <h3 className="card__title">{m.title}</h3>
                <div className="card__subtitle">{m.subtitle}</div>
                <p className="card__text">{m.desc}</p>
              </div>

              <div className="card__footer">
                {m.datasheet ? (
                  <a
                    className="btn"
                    href={m.datasheet}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    Datasheet
                  </a>
                ) : (
                  <button className="btn" disabled title="Datasheet bude doplněn">
                    Datasheet
                  </button>
                )}
              </div>
            </article>
          ))}
        </section>
      </main>

      <footer className="footer">
        © {new Date().getFullYear()} Konfigurátor – rozhodovací průvodce.
      </footer>
    </div>
  );
}
