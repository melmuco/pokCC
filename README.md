# pokCC - Pokemon Card Collection Manager

Un'applicazione web per gestire la collezione di carte Pokemon con backend NestJS e frontend Next.js.

## Stack Tecnologico

- **Backend**: NestJS (TypeScript), Prisma, PostgreSQL, Redis
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Autenticazione**: JWT con Passport

## Avvio del Progetto

### Prerequisites

- Node.js 18+
- npm 9+
- Docker & Docker Compose

### Installazione

```bash
# Install dipendenze
npm install

# Avvia container (PostgreSQL + Redis)
docker-compose up -d

# Configura variabili d'ambiente
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local

# Genera client Prisma e migra database
npx prisma generate
npx prisma migrate dev --name init

# Seed del database con 20 carte Base Set
npx prisma db seed

# Install dipendenze aggiuntive per scanner
cd backend && npm install tesseract.js multer sharp natural
cd ../frontend && npm install lucide-react

# Avvia backend
npm run dev:backend

# Avvia frontend
npm run dev:frontend
```

## Struttura del Progetto

```
pokCC/
├── backend/           # NestJS API
│   ├── src/
│   │   ├── auth/      # Autenticazione JWT
│   │   ├── cards/     # CRUD carte catalogo
│   │   ├── collections/   # CRUD collezioni + valutazione
│   │   ├── grading/   # Servizio grading (Sprint 4)
│   │   ├── visual-match/ # Visual matching CLIP (Sprint 4)
│   │   ├── pricing/   # Servizio prezzi, sincronizzazione
│   │   ├── carte-in-collezione/   # Collegamento carte-collezione
│   │   ├── users/     # Gestione utenti
│   │   ├── sets/      # Set di carte
│   │   ├── scansioni/ # Modulo scansione con OCR
│   │   ├── tcg/       # Servizio API TCG
│   │   └── prisma/    # Prisma Client
│   └── prisma/
│       ├── schema.prisma
│       └── seed.ts
├── frontend/          # Next.js App
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx    # Dashboard valutazione
│   │   ├── carte/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── carte/
│   │   │   └── [id]/
│   │   │       └── grading/
│   │   │           └── page.tsx    # Pagina grading (Sprint 4)
│   │   ├── valutazione/
│   │   │   └── [cardId]/page.tsx    # Pagina dettaglio valutazione
│   │   ├── collezioni/
│   │   │   └── page.tsx
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   └── scansione/
│   │       └── page.tsx    # Nuova pagina scanner
│   ├── components/
│   │   ├── ui/            # Componenti shadcn/ui
│   │   ├── grading/         # Componenti grading (Sprint 4)
│   │   │   ├── ConditionSelector.tsx
│   │   │   └── GradingInput.tsx
│   │   ├── CameraCapture.tsx
│   │   ├── ImagePreview.tsx
│   │   └── MatchCard.tsx
│   ├── lib/
│   │   └── api.ts         # Client API
│   └── types/
│       └── index.ts       # Tipi TypeScript
├── docker-compose.yml
└── README.md
```

## API Endpoints

### Auth
- `POST /auth/login` - Login utente
- `POST /auth/register` - Registrazione utente

### Cards
- `GET /cards` - Lista carte (con filtri)
- `GET /cards/:id` - Dettaglio carta
- `PATCH /cards/:cardId/grading/collection/:collectionId` - Aggiorna condizione e grading di una carta

### Collections
- `GET /collections` - Lista collezioni utente
- `POST /collections` - Crea collezione
- `GET /collections/:id` - Dettaglio collezione

### Grading (Sprint 4)
- `PATCH /cards/:cardId/grading/collection/:collectionId` - Aggiorna condizione e grading

### Visual Matching (Sprint 4)
- `POST /visual-match/compare/:cardId` - Calcola similarità visiva tra immagine scansionata e riferimento

### Scansione (Sprint 2)
- `POST /scansioni` - Carica immagine per scansione (multipart form-data con campo `image`)
- `GET /scansioni/:id` - Recupera stato e risultato della scansione

### Valutazione economica (Sprint 3)
- `GET /pricing/card/:id` - Prezzo corrente e trend per una carta
- `POST /pricing/card/:id/snapshot` - Crea snapshot manuale del prezzo
- `POST /pricing/sync/all` - Sincronizza prezzi per tutte le carte
- `POST /pricing/sync/collection/:id` - Sincronizza prezzi per una collezione
- `GET /valuation/collection/:id` - Valore stimato di una collezione
- `GET /valuation/user/total` - Valore totale della collezione dell'utente con breakdown per set

## Sincronizzazione dei Prezzi

La sincronizzazione dei prezzi avviene automaticamente ogni giorno alle ore 02:00 tramite un cron job (`PriceSyncService`) che chiama l'API Pokemon TCG (`/v2/cards/{id}/prices`) per ogni carta con un `tcgplayerId` impostato. I dati storici vengono salvati nella tabella `PriceSnapshot`.

### Sincronizzazione manuale

Puoi sincronizzare i prezzi manualmente tramite l'endpoint API o tramite l'interfaccia grafica:

**API (richiesta autenticata):**
```bash
# Sincronizza tutte le carte
curl -X POST http://localhost:4000/pricing/sync/all \
  -H "Authorization: Bearer <TOKEN>"

# Sincronizza una singola carta
curl -X POST http://localhost:4000/pricing/card/{cardId}/snapshot \
  -H "Authorization: Bearer <TOKEN>"

# Sincronizza una collezione specifica
curl -X POST http://localhost:4000/pricing/sync/collection/{collectionId} \
  -H "Authorization: Bearer <TOKEN>"
```

**Interfaccia grafica:**
- Accedi alla **Dashboard** (`/dashboard`) per vedere il valore totale della collezione e il breakdown per set
- Clicca sul pulsante "Aggiorna" per ricaricare i dati di valutazione
- Accedi alla pagina di **Valutazione** di una carta (`/valutazione/[cardId]`) per vedere il prezzo corrente, il trend e lo storico

### Configurazione API TCG

Per abilitare il recupero dei prezzi reali, imposta la chiave API di Pokemon TCG nella variabile d'ambiente `TCG_API_KEY`:

```bash
# backend/.env
TCG_API_KEY=your-tcg-api-key-here
```

La chiave è facoltativa ma consigliata per evitare limitazioni di rate limiting. Senza la chiave, l'API restituisce un errore e la sincronizzazione non verrà eseguita.

## Grading e Visual Matching (Sprint 4)

### Grading

Il modulo grading permette di impostare la condizione e lo stato di grading di una carta nella collezione, influenzando il prezzo di valutazione.

**Condizioni disponibili:**
- `NearMint` (1.0x) - NM-M
- `LightPlay` (0.7x) - LP-
- `Play` (0.5x) - MP
- `Moderate` (0.3x) - PD
- `Heavy` (0.2x) - HP
- `Damaged` (0.1x) - DM

**Grading:**
- **PSA**: 10=5x, 9=3x, 8=2x, 7=1.5x, 6=1.2x
- **BGS**: 10=4.5x, 9=2.5x, 8=1.8x, 7=1.3x, 6=1.1x
- **CGC**: 10=4x, 9=2.5x, 8=1.5x, 7=1.1x, 6=1x

**Formula valutazione:**
```
prezzo_finale = prezzo_mercato × condition_multiplier × grade_multiplier × rarity_multiplier
```

**Interfaccia utente:**
1. Vai alla pagina di dettaglio di una carta: `/carte/[id]`
2. Clicca "Modifica Grading" per aprire la pagina di gradazione
3. Seleziona la condizione e il grading (se applicabile)
4. Salva i cambiamenti

**API:**
```bash
# Aggiorna grading di una carta in una collezione
PATCH /cards/:cardId/grading/collection/:collectionId
{
  "condition": "NearMint",
  "graded_company": "PSA",
  "graded_grade": 10
}
```

### Visual Matching (Fallback CLIP)

Il visual matching usa modelli CLIP per confrontare immagini di carte scansionate con riferimenti, agendo come fallback quando OCR e TCG API non trovano corrispondenze.

**Funzionamento:**
1. Carica un'immagine della carta tramite la scansione
2. Se l'OCR non trova corrispondenza, il sistema utilizza CLIP
3. Vengono generati embedding vettoriali dell'immagine scansionata
4. Si calcola la similarità coseno con le immagini di riferimento
5. Se la similarità super la soglia (0.6), viene restituita la corrispondenza

**API:**
```bash
# Confronta immagine con riferimento per una specifica carta
POST /visual-match/compare/:cardId
Content-Type: multipart/form-data
File: image

Response:
{
  "similarity": 0.85,
  "match": true,
  "cardId": 123
}
```

**Implementazione tecnica:**
- Modello CLIP: `openai/clip-vit-base-patch16`
- Similarità: prodotto scalare normalizzato dei vettori embedding
- Soglia default: 0.6 (configurabile)

## Funzionalità Scansione

La pagina di scansione è disponibile su `/scansione` e permette di:

1. **Scatta foto**: Apri la fotocamera della scrivania e cattura l'immagine della carta
2. **Live preview**: Vedere l'immagine catturata con pulsanti per modificare o ripetere
3. **Elaborazione**: IL backend utilizza Tesseract OCR per estrarre testo dall'immagine
4. **Matching**: Confronta la carta estratta con il database usando algoritmi di similarità
5. **Review**: Mostra la corrispondenza trovata con punteggio e pulsanti di conferma/rifiuto

### WebSocket e Notifiche di Progresso

Il servizio scansione utilizza WebSocket per inviare aggiornamenti in tempo reale del progresso:
- Evento `scansione:progress`: Invia percentuale di avanzamento durante l'elaborazione
- Evento `scansione:completed`: Notifica quando la scansione è completata
- Evento `scansione:failed`: Notifica se la scansione è fallita

**Hook frontend**: `useScanSocket` per ascoltare gli eventi WebSocket

### Testare la Scansione

1. Avvia entrambi i server (backend e frontend)
2. Accedi alla pagina `/scansione`
3. Clicca "InviaFoto" per aprire la fotocamera
4. Scatta una foto di una carta Pokemon
5. L'immagine verrà elaborata automaticamente
6. Se trovata una corrispondenza, potrai confermare o rifiutare il risultato

## Export CSV

Endpoint per esportare una collezione in formato CSV:

```bash
GET /collections/:id/export
```

**Frontend**: Nella pagina dettaglio di una collezione, trovi il pulsante "Esporta CSV" per scaricare tutte le carte in formato CSV.

## Sicurezza

### Rate Limiting

L'API utilizza `@nestjs/throttler` per limitare le richieste a **60 richieste/minuto per IP**:
- Protezione contro attacchi DoS
- Configurazione globale tramite `ThrottlerGuard`

### Validazione Input

Tutti gli endpoint utilizzano `class-validator` con:
- `ValidationPipe` globale abilitato
- `whitelist: true` e `forbidNonWhitelisted: true`
- Validazione DTO su tutti i parametri di input

### CSRF Protection

Il backend utilizza token CSRF per protezione form:
- Header `X-CSRF-Token` su ogni richiesta
- Cors policy configurati per `FRONTEND_URL`

### Protezione Upload

Gli upload di immagini sono protetti da:
- **Whitelist estensioni**: Solo `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`
- **Path traversal protection**: I nomi file vengono generati casualmente con `crypto.randomBytes()`
- **Validazione MIME type**: I file vengono verificati prima del salvataggio

### Password Hashing

Tutte le password vengono hashate con **bcrypt** (12 rounds) prima del salvataggio nel database.

## Test E2E

I test end-to-end utilizzano Playwright e si trovano in `frontend/e2e/`.

### Struttura Test

```
frontend/e2e/
├── playwright.config.ts
└── tests/
    ├── login.e2e.ts       # Test login e registrazione
    ├── add-card.e2e.ts    # Test aggiunta carte e visualizzazione
    ├── scan.e2e.ts        # Test scanner con WebSocket
    └── export-csv.e2e.ts  # Test download CSV
```

### Esecuzione Test

```bash
# Installazione dipendenze Playwright
cd frontend
npx playwright install

# Esecuzione tests
npx playwright test

# Video e trace
npx playwright test --trace on
```

## Licenza

MIT