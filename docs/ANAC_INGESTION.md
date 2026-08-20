# ANAC / BDNCP ingestion

## Stato

L'integrazione nazionale ANAC è **progettata ma non attivata** finché il trasporto bulk ufficiale non è raggiungibile da un ambiente ETL autorizzato e stabile.

Non introduciamo mirror non verificati, scraping del cruscotto Analytics o dati dimostrativi per aggirare questo limite.

## Fonti ufficiali disponibili

ANAC pubblica nel proprio Portale dei dati aperti dataset della BDNCP in CSV/JSON organizzati per anno e mese. Il catalogo nazionale `dati.gov.it` federa i relativi metadati e permette di verificarne frequenza, distribuzioni e dimensioni.

Per i contratti dal 2024, la BDNCP è anche il punto di pubblicazione del ciclo di vita comunicato attraverso le piattaforme digitali certificate. La pagina ufficiale di dettaglio di un CIG ha il formato documentato da ANAC:

`https://dati.anticorruzione.it/superset/dashboard/dettaglio_cig/?cig=<CIG>`

Questo URL è utile come percorso di provenance verso la fonte originale, ma non viene usato come API dati.

## Bulk OCDS

La pipeline di riferimento verificata nel progetto pubblico `AgID/cruscotto-italia` usa i bulk OCDS mensili e normalizza una riga per award conservando, tra gli altri:

- OCID / release id;
- codice fiscale e denominazione della stazione appaltante;
- categoria e procedura;
- award id, stato, data, importo e valuta;
- CPV e descrizione dell'oggetto;
- aggiudicatari quando presenti nel record.

Questa resta la direzione prevista per Trasparenza Italia perché consente un ETL riproducibile e join esatti con IPA.

## Vincolo osservato il 20 agosto 2026

Due probe temporanee da runner GitHub-hosted hanno verificato il comportamento reale dell'infrastruttura ANAC:

1. i bulk mensili sotto `dati.anticorruzione.it/.../filesystem/bulk/...` rispondono `403 Forbidden` dal WAF F5;
2. gli endpoint OCDS storicamente documentati su `api.anticorruzione.it/opendata/ocds/api/v1/1.0.0/` rispondono oggi `404` dal gateway WSO2 per i path `/version` e `/tender/id/count/active`.

Le probe sono state rimosse subito dopo la diagnosi: la CI ordinaria non deve diventare rossa per una policy di rete dell'upstream.

## Architettura prevista

Il futuro ingestore ANAC deve rispettare queste regole:

1. **bulk-first**, non scraping di Superset/Analytics;
2. esecuzione da una rete dalla quale ANAC consenta il download ufficiale;
3. cache incrementale per mese e validator upstream quando disponibili;
4. parsing streaming / DuckDB o equivalente, senza caricare file multi-GB in memoria;
5. importi e conteggi riconciliati prima della pubblicazione;
6. join primario tra codice fiscale della stazione appaltante e IPA;
7. CIG/OCID mantenuti come chiavi di provenance;
8. snapshot derivati piccoli e versionati, separati dal rendering web;
9. nessun dato ANAC sintetico quando la pipeline non è disponibile;
10. health della fonte distinto dalla disponibilità del nostro ingestore.

## Dataset di prodotto previsti

Quando il trasporto sarà operativo, `/appalti` dovrà offrire almeno:

- volume e valore delle procedure per mese;
- stazioni appaltanti per numero e valore;
- aggiudicatari per numero e valore;
- distribuzione per procedura di scelta del contraente;
- distribuzione CPV / categorie;
- drill-down per CIG e link al dettaglio ufficiale BDNCP;
- concentrazione dei fornitori e altri indicatori descrittivi, sempre etichettati come segnali da verificare e non come accuse.

## Cosa non fare

- non usare proxy terzi per eludere il WAF;
- non simulare l'ultimo mese mancante;
- non trasformare dati Analytics estratti da endpoint interni non documentati in una dipendenza di produzione;
- non presentare importo a base d'asta, importo di aggiudicazione e somme liquidate come se fossero la stessa metrica;
- non attribuire automaticamente anomalie a frode, corruzione o spreco.
