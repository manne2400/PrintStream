# PrintStream Dokumentation

## 🚀 Projektoversigt

PrintStream er et Electron-baseret desktopprogram til styring af 3D-printvirksomheder, udviklet med React, TypeScript og Chakra UI.

## 💻 Teknologistak

| Kategori            | Teknologi                      |
|---------------------|--------------------------------|
| Frontend Framework  | React 18 med TypeScript        |
| UI Bibliotek        | Chakra UI                      |
| Database            | SQLite3 med lokalt filsystem   |
| Desktop Framework   | Electron                       |
| Build Værktøjer     | Webpack, Electron Builder      |
| State Management    | React Hooks og Context         |
| Routing             | React Router v6 med HashRouter |

## 📁 Projektstruktur

### Core Filer

- `package.json` - Projektafhængigheder og scripts
- `webpack.config.js` - Webpack-konfiguration
- `tsconfig.json` - TypeScript-konfiguration
- `.babelrc` - Babel-konfiguration
- `DOCUMENTATION.md` - Denne dokumentation

### Kildekode (/src)

#### Komponenter

- `components/Layout.tsx` - Hovedlayout for applikationen
- `components/Header.tsx` - Top navigationsbjælke
- `components/Sidebar.tsx` - Side navigationsmenu
- `components/ProtectedRoute.tsx` - Route-beskyttelse for autentifikation

#### Sider

- `pages/Dashboard.tsx` - Hoveddashboard
- `pages/Filament.tsx` - Filamentstyring
- `pages/PrintInventory.tsx` - Print job management
- `pages/Projects.tsx` - Projektstyring
- `pages/Customers.tsx` - Kundehåndtering
- `pages/Sales.tsx` - Salgsovervågning
- `pages/Reports.tsx` - Forretningsanalyse
- `pages/Settings.tsx` - Applikationsindstillinger
- `pages/About.tsx` - Om applikationen

#### Database

- `database/setup.ts` - Databaseinitialisering
- `database/operations.ts` - Databaseoperationer

#### Kontekst

- `context/` - React Context Providers til global state

#### Utils

- `utils/` - Hjælpefunktioner og værktøjer

#### Assets

- `assets/` - Billeder og andre statiske filer

#### Indgangspunkter

- `App.tsx` - Root React komponent
- `index.tsx` - Applikations indgangspunkt

### Offentlige Filer (/public)

- `electron.js` - Electron hovedproces (håndterer vinduer og IPC)
- `index.html` - HTML-skabelon
- `manifest.json` - Applikationsmanifest

### Projektstruktur Oversigt

```
/ (projektrod)
├── src/
│   ├── components/
│   ├── pages/
│   ├── database/
│   ├── context/
│   ├── utils/
│   ├── assets/
│   ├── App.tsx
│   └── index.tsx
├── public/
│   ├── electron.js
│   ├── index.html
│   └── manifest.json
├── package.json
├── webpack.config.js
├── tsconfig.json
├── .babelrc
└── DOCUMENTATION.md
```

## 📁 Databaseskema

Databasen bruger SQLite3 med følgende tabeller:

### Filaments

```sql
CREATE TABLE filaments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  color TEXT NOT NULL,
  weight REAL NOT NULL,
  price REAL NOT NULL,
  stock REAL NOT NULL,
  ams_slot INTEGER,
  low_stock_alert REAL DEFAULT 500,
  is_resin BOOLEAN DEFAULT FALSE,
  resin_exposure REAL,
  resin_bottom_exposure REAL,
  resin_lift_distance REAL,
  resin_lift_speed REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Filament Typer
- **FDM Filamenter**: PLA, PLA+, PETG, ABS, TPU, ASA, PC, Nylon, HIPS, PVA
- **Resin Typer**: Standard, Tough, Flexible, Casting, Water-Washable

#### Måleenheder
- **FDM Filament**: Gram (g)
- **Resin**: Milliliter (mL)

#### Særlige Funktioner
1. **AMS Integration**
   - Slots 1-16 tilgængelige
   - Kun for FDM filamenter
   - Unikke slot-numre påkrævet

2. **Resin Håndtering**
   - Separate print indstillinger
   - Specialiserede måleenheder
   - Deaktiveret AMS funktionalitet

3. **Lager Advarsler**
   - Automatisk notifikation ved lav beholdning
   - Justerbar advarselsgrænse
   - Standard grænse: 500g/mL

4. **Print Integration**
   - Automatisk lageropdatering
   - Materialeforbrugsberegning
   - Kostprisberegning

### Projects

```sql
CREATE TABLE projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Filament Usage

```sql
CREATE TABLE filament_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER,
  filament_id INTEGER,
  amount REAL NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects (id),
  FOREIGN KEY (filament_id) REFERENCES filaments (id)
);
```

### Print Jobs

```sql
CREATE TABLE print_jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER,
  customer_id INTEGER,
  date TEXT,
  quantity INTEGER,
  price_per_unit REAL,
  created_at DATETIME,
  FOREIGN KEY (project_id) REFERENCES projects (id),
  FOREIGN KEY (customer_id) REFERENCES customers (id)
);
```

### Sales

```sql
CREATE TABLE sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER,
  amount REAL NOT NULL,
  date DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects (id)
);
```

### Yderligere Tabeller

- `project_filaments`: Mange-til-mange relation mellem projekter og filaments
- `customers`: Kundedata
- `settings`: Applikationsindstillinger
- `license`: Licensinformation
- `used_licenses`: Sporer brugte licensnøgler

## 🛠 Udviklingsopsætning

### Forudsætninger

- Node.js (version 18+)
- npm eller yarn
- Git

### Installation

```bash
# Klon repository
git clone [repository-url]

# Installer afhængigheder
npm install

# Rebuild native modules (hvis nødvendigt)
npm run rebuild

# Start udviklingsserveren
npm start
```

### Build Kommandoer

```bash
# Build til produktion
npm run build

# Build til udvikling
npm run dev

# Pak applikationen
npm run dist
```

### Build Proces

- **Development**: `npm run dev` - Starter udviklingsserveren med hot-reloading.
- **Production**: `npm run build` - Bygger applikationen til produktion.
- **Packaging**: `npm run dist` - Pakker applikationen til distribution.

### Fejlhåndtering

- **Database Validering**: Sørg for at alle databaseoperationer håndterer fejl korrekt.
- **Transaction Rollback**: Implementer rollback for at sikre dataintegritet ved fejl.
- **UI Fejltilstande**: Vis brugervenlige fejlmeddelelser i UI.
- **Loggingsystem**: Brug et loggingsystem til at spore fejl og advarsler.

## 🔥 Nøglefunktioner

### Filamentstyring

- Tracking af filamentbeholdning
- AMS-slot håndtering (1-16 eller None)
- Pris- og vægttracking
- Lagerstatus

### Print/Inventar System

- Print job management
- Printer statusovervågning
- Materialeforbrugsmonitorering

### Projektstyring

- Projekttracking
- Statusopdateringer
- Materialeallokering

### Kunde Relationer

- Kundedatabase
- Ordrehistorik

### Lagerhåndtering

- Automatisk lagertræk ved print job oprettelse
- Validering af tilgængelig filament
- Gruppering af identiske prints

### Kontakt & Support

- **Udvikler**: Jacob Manscher
- **Email**: jacobm@printstream.app
- **Discord**: https://discord.gg/utXE9ER5yK

## 🐛 Almindelige Problemer & Løsninger

### SQLite3 Bindings Error

- Kør `npm run rebuild` for at genopbygge native moduler.
- Tjek `electron-rebuild` installation.
- Verificer `sqlite3` version.

### Blank Skærm

- Tjek console (`Ctrl+Shift+I`) for fejl.
- Verificer webpack build.
- Tjek route definitions.

### Database Fejl

- Tjek filrettigheder.
- Verificer SQL-forespørgsler.
- Tjek databaseforbindelse.

### Licensvalidering

- Verificer nøgleformat.
- Tjek udløbsdatoer.
- Håndter netværksfejl.

### Mørk Tilstand Inkonsekvenser

- Brug tema-varianter konsekvent.
- Test alle komponenter i begge tilstande.
- Tjek kontrastforhold.
- Verificer komponentovergange.

### Ydelsesproblemer

- Implementer korrekte indekser.
- Brug paginering for store datasæt.
- Optimer databaseforespørgsler.
- Implementer caching hvor det er passende.

### Backup og Gendannelse

- Lav sikkerhedskopi før gendannelse.
- Brug unikke filnavne med tidsstempel.
- Håndter diskplads ved at begrænse antal backups.
- Implementer fejlhåndtering for filsystemoperationer.

### Brugergrænseflade

- Tilbyd fleksible inputmuligheder (timer/minutter).
- Understøt brugerdefinerede valutakoder.
- Giv tydelig feedback

### Licensnøgler
## Sådan Genereres PrintStream Licensnøgler

## Licensnøgle Format
Formatet for en licensnøgle er: `XXXX-YYYY-ZZZZ-WWWW`

Hvor:
- `XXXX` = Hash af kundeID (4 tegn)
- `YYYY` = Krypteret antal dage (op til 8 tegn)
- `ZZZZ-WWWW` = Validerings checksum (8 tegn total)

## Generering af Dele

### 1. Kunde Hash (XXXX)
- Input: KundeID (string)
- Process:
  1. Konverter hver karakter til ASCII værdi
  2. Brug rolling hash algoritme: `hash = ((hash << 5) - hash) + char`
  3. Tag absolut værdi og konverter til hex
  4. Tag de første 4 tegn
- Output: 4 tegn hex string

### 2. Dage Kryptering (YYYY)
- Input: Antal dage (1-3650)
- Process:
  1. Multiplicer dage med 7919 (primtal)
  2. Konverter til hex
  3. Pad med nuller til 8 tegn
- Output: Op til 8 tegn hex string

### 3. Checksum (ZZZZ-WWWW)
- Input: KundeHash + KrypteretDage
- Process:
  1. Konkatenér input med "PrintStream-Secret-Key"
  2. Brug samme hash algoritme som for kundeID
  3. Tag de første 8 tegn af resultatet
- Output: 8 tegn hex string (delt i 4-4)

## Validering
Ved validering tjekkes:
1. Korrekt format (4 dele adskilt af bindestreger)
2. Hver del er valid hex
3. Checksum matcher
4. Dekrypteret antal dage er mellem 1-3650

## Begrænsninger
- Maksimum 10 års licens (3650 dage)
- Licensnøgler er case-insensitive
- Mellemrum trimmes automatisk

## Eksempel på Brug
```python
# Pseudokode for licensgenerering
def generate_license(customer_id: str, days: int) -> str:
    if not (1 <= days <= 3650):
        raise ValueError("Days must be between 1 and 3650")
        
    customer_hash = hash_customer_id(customer_id)[:4]
    days_encoded = encode_days(days)
    checksum = generate_checksum(customer_hash + days_encoded)
    
    return f"{customer_hash}-{days_encoded}-{checksum[:4]}-{checksum[4:]}"
```

## Sikkerhedsovervejelser
- Primtallet 7919 bruges som krypteringsnøgle for dage
- Checksummen inkluderer en hemmelig nøgle
- Kundens ID er hashet for at skjule den oprindelige værdi
- Systemet er designet til offline validering

## Database Integration
- Brugte licenser gemmes i `used_licenses` tabellen
- Hver installation har et unikt `installation_id`
- Systemet holder styr på brugte licenser for at forhindre genbrug

## Særlige Noter
- Licensnøgler kan ikke genbruges
- Ved ny version af softwaren:
  - Prøvelicenser nulstilles til 30 dage
  - Fulde licenser med mindre end 30 dage tilbage forlænges
