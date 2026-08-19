import type { Metadata } from "next";
import Link from "next/link";
import { getSourceHealthOverview, type SourceHealth } from "@/lib/data/source-health";
import styles from "./stato.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Stato delle fonti",
  description:
    "Stato operativo, cadenza e policy di aggiornamento delle fonti ufficiali integrate in Trasparenza Italia.",
};

const numberFormatter = new Intl.NumberFormat("it-IT");

function duration(seconds: number): string {
  if (seconds % 86_400 === 0) return `${seconds / 86_400} g`;
  if (seconds % 3_600 === 0) return `${seconds / 3_600} h`;
  if (seconds % 60 === 0) return `${seconds / 60} min`;
  return `${seconds} s`;
}

function reachabilityLabel(source: SourceHealth): string {
  if (source.reachability === "up") return "Raggiungibile";
  if (source.reachability === "down") return "Non raggiungibile";
  return "Non ancora sondato";
}

function reachabilityClass(source: SourceHealth): string {
  if (source.reachability === "up") return styles.up;
  if (source.reachability === "down") return styles.down;
  return styles.notProbed;
}

export default async function SourceStatusPage() {
  const sources = await getSourceHealthOverview();
  const active = sources.filter((source) => source.integration === "active");
  const reachable = sources.filter((source) => source.reachability === "up");
  const unreachable = sources.filter((source) => source.reachability === "down");

  return (
    <main className={styles.page}>
      <nav className={styles.breadcrumb} aria-label="Percorso">
        <Link href="/">Home</Link>
        <span>→</span>
        <Link href="/fonti">Fonti</Link>
        <span>→</span>
        <span>Stato</span>
      </nav>

      <header className={styles.header}>
        <div>
          <span className={styles.kicker}>OSSERVABILITÀ DELLE SORGENTI</span>
          <h1 className={styles.title}>Quanto sono vivi i dati che stai guardando.</h1>
          <p className={styles.lead}>
            Separiamo lo stato del nostro adapter dalla disponibilità dell&apos;upstream e dalla
            cadenza di pubblicazione dichiarata. Una fonte raggiungibile non è necessariamente
            fresca; una fonte temporaneamente offline non rende falso l&apos;ultimo dato già acquisito.
          </p>
        </div>

        <div className={styles.summary} aria-label="Riepilogo stato fonti">
          <div>
            <strong>{sources.length}</strong>
            <span>fonti con policy</span>
          </div>
          <div>
            <strong>{active.length}</strong>
            <span>adapter attivi</span>
          </div>
          <div>
            <strong>{reachable.length}</strong>
            <span>upstream raggiungibili ora</span>
          </div>
          <div>
            <strong>{unreachable.length}</strong>
            <span>probe falliti</span>
          </div>
        </div>
      </header>

      <section className={styles.explainer}>
        <div>
          <h2>Controlliamo più spesso di quanto la fonte pubblichi.</h2>
          <p>
            Se IPA aggiorna ogni giorno, possiamo ricontrollarlo ogni ora. Se un dataset è mensile,
            ricontrollarlo più volte al giorno ci permette di rilevare rapidamente il nuovo rilascio,
            senza chiamare “tempo reale” un dato che resta mensile.
          </p>
        </div>
        <div>
          <h2>La CI del codice resta separata.</h2>
          <p>
            Un outage di AgID o RGS non deve far fallire TypeScript o la production build. I probe live
            vivono nel livello di observability e refresh, mentre la CI verifica che il software sia corretto.
          </p>
        </div>
      </section>

      <section className={styles.table} aria-label="Stato delle fonti ufficiali">
        <div className={styles.tableHeader}>
          <span>Fonte</span>
          <span>Integrazione</span>
          <span>Stato upstream</span>
          <span>Freshness policy</span>
        </div>

        {sources.map((source) => (
          <article className={styles.row} key={source.sourceId}>
            <div className={styles.source}>
              <strong>{source.label}</strong>
              <span>{source.owner}</span>
              <a href={source.policy.sourceUrl} target="_blank" rel="noreferrer">
                apri fonte ufficiale ↗
              </a>
            </div>

            <div className={styles.meta}>
              <strong>{source.integration === "active" ? "Adapter attivo" : "Mappata"}</strong>
              <span>Cadenza: {source.policy.cadence}</span>
            </div>

            <div className={styles.health}>
              <span className={`${styles.status} ${reachabilityClass(source)}`}>
                {reachabilityLabel(source)}
              </span>
              <strong>
                {source.latencyMs !== null ? `${numberFormatter.format(source.latencyMs)} ms` : "—"}
              </strong>
              <span>{source.detail ?? "Nessun dettaglio disponibile"}</span>
              {source.recordCount !== null && (
                <span>{numberFormatter.format(source.recordCount)} elementi rilevati dal probe</span>
              )}
            </div>

            <div className={styles.policy}>
              <strong>
                discovery ogni {duration(source.policy.discoveryRevalidateSeconds)}
              </strong>
              <span>dati: {duration(source.policy.dataRevalidateSeconds)}</span>
              <span>{source.policy.cadenceNote}</span>
            </div>
          </article>
        ))}
      </section>

      <p className={styles.footerNote}>
        “Non ancora sondato” non significa che il sito ufficiale sia offline: significa che Trasparenza Italia
        non ha ancora un adapter sufficientemente stabile da attribuire uno stato operativo automatico.
        Preferiamo mostrare un&apos;assenza di misura invece di inventare un semaforo.
      </p>
    </main>
  );
}
