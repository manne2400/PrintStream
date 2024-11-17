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
Formatet for en licensnøgle er: `XXXX-YYYYYYYY-ZZZZ-WWWW`

Hvor:
- `XXXX` = Hash af kundeID (4 tegn)
- `YYYYYYYY` = Krypteret antal dage (8 tegn)
- `ZZZZ-WWWW` = Validerings checksum (8 tegn total)

## Hash Algoritme
Systemet bruger en MurmurHash3-lignende algoritme:
```typescript
const hashString = (str: string): string => {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    let h1 = 0xdeadbeef;
    let h2 = 0x41c6ce57;
    
    for (let i = 0; i < data.length; i++) {
        const byte = data[i];
        h1 = Math.imul(h1 ^ byte, 2654435761);
        h2 = Math.imul(h2 ^ byte, 1597334677);
    }
    
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    
    return (h1 >>> 0).toString(16).slice(-8).padStart(8, '0');
};
```

### Nøglekomponenter

1. **Kunde Hash (XXXX)**
   - Genereres fra kundeID ved hjælp af MurmurHash3
   - Case-sensitiv (forskellige resultater for "ABC" og "abc")
   - Altid 4 tegn hex

2. **Dage Kryptering (YYYYYYYY)**
   - Input: Antal dage (1-3650)
   - Krypteres ved multiplikation med primtallet 7919
   - Konverteres til hex med 8 tegn padding

3. **Checksum (ZZZZ-WWWW)**
   - Genereres fra kundeHash + krypterede dage
   - Inkluderer hemmelig nøgle for sikkerhed
   - Altid 8 tegn total (4-4 format)

### Sikkerhedsfeatures
- Unicode-sikker gennem TextEncoder
- Kollisionsresistent hash-funktion
- Case-sensitiv validering
- Konsistent nøglelængde
- Offline validering mulig

### Begrænsninger
- Maksimum 10 års licens (3650 dage)
- Licensnøgler kan ikke genbruges
- Installation-specifik tracking

### Særlige Funktioner
1. **Versionshåndtering**
   - Prøvelicenser nulstilles ved ny version
   - Automatisk forlængelse af udløbende licenser

2. **Installations Tracking**
   - Unikt installations-id pr. system
   - Forhindrer uautoriseret genbrug

3. **Offline Validering**
   - Komplet offline validering mulig
   - Ingen internetforbindelse påkrævet

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

Præcist Format:
Nøjagtig struktur (XXXX-YYYYYYYY-ZZZZ-WWWW)
Længde og format for hver del
Komplet Hash Algoritme:
Fuld kildekode for MurmurHash3-implementationen
Alle konstanter og matematiske operationer
Præcis håndtering af Unicode gennem TextEncoder
Kryptering af Dage:
Det specifikke primtal (7919)
Padding-detaljer (8 tegn)
Konvertering til hex
Validering:
Checksum generering
Brug af hemmelig nøgle
Format validering
Database Integration:
Struktur for licenslagring
Installations-ID håndtering
Versionshåndtering

## Komplet Implementation

### Licensgenerering
```typescript
export const generateLicenseKey = (days: number, customerId: string): string => {
    if (days < 1 || days > 3650) {
        throw new Error("Days must be between 1 and 3650");
    }
    
    const customerHash = hashString(customerId).slice(0, 4);
    const daysEncoded = encodeDays(days);
    const checksum = generateChecksum(customerHash + daysEncoded);
    
    return `${customerHash}-${daysEncoded}-${checksum.slice(0, 4)}-${checksum.slice(4, 8)}`;
};

const encodeDays = (days: number): string => {
    return (days * 7919).toString(16).padStart(8, '0');
};

const generateChecksum = (str: string): string => {
    return hashString(str + 'PrintStream-Secret-Key');
};
```

### Licensvalidering
```typescript
export const validateLicenseKey = (key: string): { isValid: boolean; days?: number } => {
    try {
        const parts = key.trim().toLowerCase().split('-');
        if (parts.length !== 4) return { isValid: false };

        const [customerHash, daysEncoded, checksum1, checksum2] = parts;
        
        // Validér formater
        if (!customerHash.match(/^[0-9a-f]{4}$/) ||
            !daysEncoded.match(/^[0-9a-f]{8}$/) ||
            !checksum1.match(/^[0-9a-f]{4}$/) ||
            !checksum2.match(/^[0-9a-f]{4}$/)) {
            return { isValid: false };
        }

        // Validér checksum
        const expectedChecksum = generateChecksum(customerHash + daysEncoded);
        if (checksum1 + checksum2 !== expectedChecksum.slice(0, 8)) {
            return { isValid: false };
        }

        // Dekrypter dage
        const days = decodeDays(daysEncoded);
        if (days <= 0 || days > 3650) {
            return { isValid: false };
        }

        return { isValid: true, days };
    } catch (err) {
        return { isValid: false };
    }
};

const decodeDays = (encoded: string): number => {
    return Math.floor(parseInt(encoded, 16) / 7919);
};
```