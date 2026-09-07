# 🎵 Musa Bot

Bot Discord musicale custom, multi-server, con playlist personalizzate e pannelli con bottoni.

## Comandi

| Comando | Descrizione |
|---|---|
| `/play <brano>` | Riproduce un brano (link YouTube o ricerca) o lo aggiunge alla coda |
| `/playing` | Mostra il pannello del brano in riproduzione con i controlli |
| `/skip` | Salta al brano successivo |
| `/pause` / `/resume` | Mette in pausa / riprende |
| `/stop` | Ferma tutto e disconnette il bot |
| `/queue` | Mostra la coda |
| `/volume <0-100>` | Imposta il volume |
| `/loop <modalità>` | Disattivo / brano singolo / coda intera |
| `/playlists create` | Crea una playlist (pubblica o privata) |
| `/playlists delete` | Elimina una tua playlist |
| `/playlists view` | Visualizza il contenuto di una playlist |
| `/playlists edit add` | Aggiunge un brano a una playlist |
| `/playlists edit remove` | Rimuove un brano da una playlist |
| `/playlists play own` | Riproduce una tua playlist |
| `/playlists play from` | Riproduce la playlist pubblica di un altro utente |
| `/stats` | Mostra il totale di canzoni riprodotte su tutti i server e il numero di server attivi |
| `/help` | Mostra l'elenco completo dei comandi con le rispettive spiegazioni |

## Perché funziona bene su più server

Il bot usa [DisTube](https://distube.js.org/), che mantiene una coda (`Queue`) **indipendente per ogni server** (una `Map` interna indicizzata per `guildId`). Ogni server ha quindi la propria connessione vocale, la propria coda, il proprio volume e il proprio stato di pausa: non c'è nessun rischio che la musica di un server influenzi un altro.

## Contatore globale ("Ascolta X canzoni riprodotte")

Sotto il nome di Musa Bot, nella lista membri di Discord, compare la scritta "Ascolta N canzoni riprodotte". È un contatore **unico e condiviso su tutti i server** dove gira il bot (una riga nel database, tabella `BotStats`): ogni volta che parte un nuovo brano su un qualsiasi server, il contatore si incrementa di 1 e la scritta si aggiorna sul momento. Puoi controllarlo anche manualmente con `/stats`, che mostra anche il numero di server su cui il bot è attivo.

## Setup in locale

1. **Requisiti**: Node.js 18+, un database PostgreSQL (anche gratuito, es. [Neon](https://neon.tech) o [Railway](https://railway.app)).
2. Clona il repo e installa le dipendenze:
   ```bash
   npm install
   ```
3. Copia `.env.example` in `.env` e compila:
   - `DISCORD_TOKEN`: dalla [Developer Portal](https://discord.com/developers/applications) → tuo bot → Bot → Reset Token
   - `CLIENT_ID`: già impostato a `1546444444549775380`
   - `GUILD_ID`: (opzionale, per test) ID del tuo server, per registrare i comandi istantaneamente
   - `DATABASE_URL`: connection string Postgres
4. Crea le tabelle nel database:
   ```bash
   npm run db:push
   ```
5. Registra gli slash command su Discord:
   ```bash
   npm run deploy-commands
   ```
6. Avvia il bot:
   ```bash
   npm start
   ```

## Invitare il bot sul server

Nella Developer Portal → OAuth2 → URL Generator, seleziona lo scope `bot` e `applications.commands`, con i permessi: `Connect`, `Speak`, `Send Messages`, `Embed Links`, `Use Slash Commands`. Apri il link generato e invita il bot.

## Pubblicare su GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<tuo-utente>/<tuo-repo>.git
git push -u origin main
```

Il file `.gitignore` esclude già `.env` e `node_modules`, quindi il token non verrà mai pubblicato.

## Deploy su Railway

1. Su [railway.app](https://railway.app), crea un nuovo progetto → **Deploy from GitHub repo** → seleziona il repo appena creato.
2. Aggiungi un database: **+ New** → **Database** → **PostgreSQL**. Railway crea automaticamente la variabile `DATABASE_URL`.
3. Nel servizio del bot, vai su **Variables** e aggiungi:
   - `DISCORD_TOKEN`
   - `CLIENT_ID` (`1546444444549775380`)
   - `DATABASE_URL` → puoi referenziare quella del plugin Postgres con `${{Postgres.DATABASE_URL}}`
   - lascia `GUILD_ID` vuoto per il deploy globale dei comandi
4. Railway rileva Node.js automaticamente e lancia `npm install` seguito da `npm start` (che a sua volta applica lo schema del DB e avvia il bot).
5. Registra gli slash command una volta, dal tab **Shell** del servizio su Railway (o dal tuo terminale in locale con lo stesso `.env`):
   ```bash
   npm run deploy-commands
   ```

Ad ogni push su `main`, Railway ridistribuisce automaticamente il bot.

## Struttura del progetto

```
src/
  index.js              → avvio del client Discord e caricamento comandi/eventi
  deploy-commands.js     → registrazione degli slash command su Discord
  commands/               → un file per ogni comando (o gruppo, es. playlists.js)
  events/                 → eventi discord.js (ready, interactionCreate)
  structures/             → setup DisTube ed eventi DisTube (playSong, finish, error...)
  utils/                  → embed dei pannelli, gestione bottoni
  db/                     → client Prisma condiviso
prisma/schema.prisma      → modelli Playlist, Track, GuildSettings, BotStats
assets/logo.png            → logo di Musa Bot, usato come thumbnail in /help
```

## Estendere il bot

- Nuovo comando: crea un file in `src/commands/`, esporta `{ data, execute }`, riavvia e rilancia `npm run deploy-commands`.
- Nuovo pulsante sul pannello: aggiungilo in `src/utils/embeds.js` (funzione `controlsRow`) e gestiscilo in `src/utils/buttonHandler.js`.
