import Link from "next/link";
import {
  getIpaRegistryStats,
  IPA_ENTI_DATASET_URL,
  IPA_ENTI_RESOURCE_ID,
  IPA_LICENSE,
  searchIpaEntities,
  type IpaSearchResult,
} from "@/lib/ipa";
import styles from "./enti.module.css";

export const dynamic = "force-dynamic";

const numberFormatter = new Intl.NumberFormat("it-IT");

type PageProps = {
  searchParams: Promise<{
    q?: string | string[];
  }>;
};

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function locationLabel(indirizzo: string | null, cap: string | null): string {
  if (indirizzo && cap) return `${indirizzo} · ${cap}`;
  return indirizzo ?? cap ?? "Sede non indicata nel record IPA";
}

export default async function EntiPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = first(params.q).trim().slice(0, 180);
  const canSearch = query.length >= 2;

  let stats: Awaited<ReturnType<typeof getIpaRegistryStats>> | null = null;
  let result: IpaSearchResult | null = null;
  let upstreamError = false;

  try {
    stats = await getIpaRegistryStats();
  } catch {
    upstreamError = true;
  }

  if (canSearch) {
    try {
      result = await searchIpaEntities({ query, limit: 30 });
      upstreamError = false;
    } catch {
      upstreamError = true;
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.intro}>
        <div>
          <span className={styles.kicker}>REGISTRO NAZIONALE · FONTE AGID</span>
          <h1 className={styles.title}>
            Cerca una Pubblica Amministrazione. <em>Parti dalla fonte.</em>
          </h1>
          <p className={styles.lead}>
            L&apos;Indice PA diventa la chiave di ingresso di Trasparenza Italia. Ogni ente viene
            identificato con il suo Codice IPA e collegato, progressivamente, a spesa, appalti,
            progetti, consulenze e documenti pubblici senza perdere la provenienza originale.
          </p>
        </div>

        <aside className={styles.sourceCard} aria-label="Informazioni sulla fonte IPA">
          <div className={styles.sourceCardTop}>
            <strong>Indice PA · Enti</strong>
            <span className={styles.live}>FONTE ATTIVA</span>
          </div>
          <div className={styles.sourceMeta}>
            <div>
              <b>{stats ? numberFormatter.format(stats.total) : "—"}</b>
              <span>record nel dataset al momento dell&apos;interrogazione</span>
            </div>
            <div>
              <b>Giornaliera</b>
              <span>frequenza ufficiale di aggiornamento del dataset</span>
            </div>
            <div>
              <b>{IPA_LICENSE}</b>
              <span>licenza indicata da AgID per la risorsa</span>
            </div>
            <div>
              <b>Data API</b>
              <span>accesso CKAN strutturato, non scraping della pagina</span>
            </div>
          </div>
          <a className={styles.sourceLink} href={IPA_ENTI_DATASET_URL} target="_blank" rel="noreferrer">
            Apri il dataset ufficiale <span>↗</span>
          </a>
        </aside>
      </section>

      <section className={styles.searchSection} aria-labelledby="ricerca-enti">
        <span className={styles.kicker}>RICERCA DIRETTA SUL DATASTORE IPA</span>
        <form className={styles.searchForm} action="/enti" method="get">
          <label htmlFor="q" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
            Cerca un ente
          </label>
          <input
            className={styles.input}
            id="q"
            name="q"
            type="search"
            defaultValue={query}
            placeholder="Es. Comune di Milano, Ministero dell'Interno, Regione Calabria, codice IPA..."
            autoComplete="off"
          />
          <button className={styles.searchButton} type="submit">Cerca</button>
        </form>
        <p className={styles.searchHelp} id="ricerca-enti">
          Ricerca full-text sul dataset ufficiale AgID. Inserisci almeno due caratteri. I risultati non sono una copia locale simulata:
          vengono letti dal datastore IPA e normalizzati dal server di Trasparenza Italia.
        </p>
      </section>

      <section className={styles.stats} aria-label="Stato integrazione IPA">
        <div className={styles.stat}>
          <strong>{stats ? numberFormatter.format(stats.total) : "—"}</strong>
          <span>enti e soggetti presenti nel dataset IPA interrogato</span>
        </div>
        <div className={styles.stat}>
          <strong>1</strong>
          <span>identificativo canonico già usato: Codice IPA</span>
        </div>
        <div className={styles.stat}>
          <strong>0</strong>
          <span>valori economici inventati o interpolati nella pagina</span>
        </div>
      </section>

      {!query && (
        <div className={styles.empty}>
          <strong>Il registro è collegato. Ora cerca un ente.</strong>
          <p>
            Da questa anagrafe costruiremo la pagina unica di ogni amministrazione: identità IPA,
            pagamenti SIOPE, contratti ANAC, CUP, PNRR, OpenCoesione, consulenze e documenti di trasparenza.
          </p>
        </div>
      )}

      {query && !canSearch && (
        <div className={styles.empty}>
          <strong>Query troppo corta.</strong>
          <p>Inserisci almeno due caratteri per interrogare il datastore IPA.</p>
        </div>
      )}

      {upstreamError && canSearch && !result && (
        <div className={styles.error}>
          <strong>La fonte IPA non è raggiungibile in questo momento.</strong>
          <p>
            Trasparenza Italia non sostituisce il dato ufficiale con valori di fallback. Riprova più tardi oppure consulta direttamente il dataset AgID.
          </p>
        </div>
      )}

      {result && (
        <>
          <div className={styles.resultsHeader}>
            <div>
              <span className={styles.kicker}>RISULTATI</span>
              <h2>{numberFormatter.format(result.total)} corrispondenze per “{query}”</h2>
            </div>
            <p>
              Mostriamo al massimo 30 risultati per richiesta. Ogni scheda porta al record normalizzato e conserva il riferimento alla fonte IPA.
            </p>
          </div>

          {result.records.length > 0 ? (
            <div className={styles.entityList}>
              {result.records.map((entity) => (
                <Link
                  className={styles.entityCard}
                  href={`/enti/${encodeURIComponent(entity.codiceIpa)}`}
                  key={entity.codiceIpa}
                >
                  <div className={styles.entityName}>
                    <strong>{entity.denominazione}</strong>
                    <span>IPA · {entity.codiceIpa}</span>
                    <div className={styles.badges}>
                      {entity.acronimo && <i className={styles.badge}>{entity.acronimo}</i>}
                      {entity.inLiquidazione && (
                        <i className={`${styles.badge} ${styles.badgeWarning}`}>in liquidazione</i>
                      )}
                    </div>
                  </div>
                  <div className={styles.entityColumn}>
                    <b>Tipologia</b>
                    <span>{entity.tipologia ?? "Non indicata"}</span>
                  </div>
                  <div className={styles.entityColumn}>
                    <b>Sede</b>
                    <span>{locationLabel(entity.sede.indirizzo, entity.sede.cap)}</span>
                  </div>
                  <span className={styles.entityArrow} aria-hidden="true">→</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className={styles.empty}>
              <strong>Nessun ente trovato.</strong>
              <p>La query non ha prodotto corrispondenze nel dataset IPA corrente.</p>
            </div>
          )}
        </>
      )}

      <section className={styles.sourceCard} style={{ marginTop: 38 }}>
        <div className={styles.sourceCardTop}>
          <strong>Provenienza tecnica</strong>
          <span className={styles.live}>VERIFICABILE</span>
        </div>
        <div className={styles.sourceMeta}>
          <div>
            <b>Resource ID</b>
            <span>{IPA_ENTI_RESOURCE_ID}</span>
          </div>
          <div>
            <b>Proprietario</b>
            <span>Agenzia per l&apos;Italia Digitale</span>
          </div>
        </div>
      </section>
    </main>
  );
}
