# Trasparenza Italia — Design System

<!-- SEED: documento iniziale, da aggiornare insieme al prodotto. -->

## Modalità

**Product UI**, non landing page. La piattaforma deve funzionare come uno strumento di consultazione quotidiano: gerarchia forte, densità informativa controllata, navigazione prevedibile e grafici leggibili prima di essere decorativi.

## Direzione visiva

Trasparenza Italia deve sembrare un'infrastruttura civica contemporanea, non un portale ministeriale legacy e non una dashboard “cyber”.

- fondo blu notte istituzionale, non nero puro;
- accenti freddi desaturati, non neon;
- tricolore usato come firma del brand, non come palette di ogni grafico;
- superfici piatte con separatori sottili;
- pochi raggi, coerenti e piccoli;
- niente gradient text, glow, glassmorphism pesante o card decorative senza funzione;
- dati e provenienza hanno precedenza sull'ornamento.

## Gerarchia

Ogni schermata deve rispondere in pochi secondi a tre domande:

1. **Che cosa sto guardando?**
2. **Qual è il dato principale?**
3. **Da dove viene e quanto è fresco?**

Le metriche principali non devono avere tutte lo stesso peso. Una sola metrica può dominare la superficie; le altre diventano metadati, confronti o dettagli.

## Colore

Token base nel CSS:

- `--bg`, `--bg-deep`: fondi istituzionali;
- `--text`: testo principale;
- `--muted`: testo secondario;
- `--blue`: azione e dato primario;
- `--green`: stato verificato / fonte attiva;
- `--amber`: attenzione / integrazione incompleta;
- `--red`: errore o dato negativo, mai per creare sensazionalismo;
- `--chart-primary`, `--chart-secondary`, `--chart-tertiary`, `--chart-negative`: serie dati.

Nei grafici multisere, le tinte devono avere luminosità comparabile. Il colore comunica una relazione o uno stato; non viene aggiunto solo per riempire spazio.

## Tipografia

Usare il font stack di sistema per velocità, neutralità e leggibilità. Evitare dipendenze tipografiche non necessarie.

- headline: peso medio, tracking negativo controllato;
- numeri: grandi ma non “hero card” ripetuti;
- body: minimo 12 px, preferenza 13–16 px;
- label tecniche: 11 px minimo, uppercase solo per metadata brevi;
- identificativi: monospace solo quando aiuta a riconoscere CIG, CUP, Codice IPA, codici fiscali o endpoint.

## Grafici

Libreria: **Recharts** per dashboard statiche/interattive. Un grafico deve esistere perché rende un confronto più rapido di una tabella.

### Regole

- nessun grafico senza fonte, data di osservazione e unità;
- niente animazioni decorative dei dati all'apertura;
- grid line sottili e secondarie;
- tooltip con valore esatto e descrizione completa;
- assi abbreviati, tooltip non abbreviato;
- legenda solo quando esistono più serie reali;
- palette limitata;
- valori economici sempre distinguono euro correnti, cumulati, competenza/cassa quando applicabile;
- se il dato manca, mostrare uno stato vuoto esplicito: mai generare serie dimostrative in produzione.

## Mappe

Le mappe devono permettere drill-down territoriale. Non usare punti luminosi decorativi come sostituto dei dati. Ogni colore o marker deve corrispondere a una misura reale o a uno stato di copertura.

## Motion

Principi ispirati al design engineering di Emil Kowalski:

- animare solo quando migliora feedback, continuità spaziale o comprensione;
- niente animazione per azioni ad alta frequenza;
- enter/exit: `ease-out` forte;
- movimento sullo schermo: `ease-in-out`;
- press state: `scale(.97)` sui bottoni;
- transizioni UI normalmente sotto 300 ms;
- rispettare `prefers-reduced-motion`;
- mai `transition: all`;
- mai `ease-in` per feedback UI.

## Componenti

Preferire primitive accessibili e librerie curate invece di ricostruire comportamenti complessi a mano.

- grafici: Recharts;
- animazioni complesse future: Motion, solo se necessarie;
- liste molto grandi future: Virtuoso;
- toast futuri: Sonner;
- dialog/menu/select futuri: Base UI.

## Stati

Ogni integrazione dati usa stati leggibili e non sensazionalistici:

- **Fonte attiva**: connettore funzionante e provenienza disponibile;
- **In integrazione**: sorgente identificata, pipeline non completa;
- **Dato non disponibile**: la fonte non espone o non risponde;
- **Da verificare**: indicatore o anomalia che richiede contesto umano.

Non usare “corrotto”, “illecito”, “spreco” o equivalenti come risultato automatico di un modello o di una soglia statistica.

## Accessibilità

- focus visibile per tastiera;
- contrasto sufficiente anche per testo secondario;
- touch target minimo circa 44 px per controlli principali;
- grafici con accessibility layer e spiegazione testuale;
- il colore non deve essere l'unico mezzo per comunicare uno stato;
- responsive senza eliminare funzioni essenziali.

## Anti-pattern da evitare

Il quality gate Impeccable deve aiutarci a intercettare:

- nested cards non necessarie;
- “status chip soup”;
- tiny text;
- palette cyan/neon su dark mode;
- gradient text;
- gerarchia piatta dove tutto ha lo stesso peso;
- bordi e radius applicati a ogni elemento;
- micro-animazioni continue;
- copy generico o celebrativo;
- dashboard piene di KPI senza una domanda chiara.

## Principio finale

**La bellezza della piattaforma deve rendere il dato più facile da verificare, non più facile da spettacolarizzare.**
