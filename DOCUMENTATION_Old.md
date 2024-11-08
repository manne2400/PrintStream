# PrintStream Documentation

## 🚀 Project Overview
PrintStream er et Electron-baseret desktop program til styring af 3D print virksomhed, udviklet med React, TypeScript og Chakra UI.

## 💻 Tech Stack
| Kategori            | Teknologi                      |
|---------------------|--------------------------------|
| Frontend Framework  | React 18 med TypeScript        |
| UI Library          | Chakra UI                      |
| Database            | SQLite3 med lokalt filsystem   |
| Desktop Framework   | Electron                       |
| Build Tools         | Webpack, Electron Builder      |
| State Management    | React Hooks og Context         |
| Routing             | React Router v6 med HashRouter |

## 📁 Project Structure

### Core Files
- `package.json` - Project dependencies og scripts
- `webpack.config.js` - Webpack configuration
- `tsconfig.json` - TypeScript configuration
- `.babelrc` - Babel configuration
- `DOCUMENTATION.md` - Denne dokumentation

### 📁 Source Code (/src)
#### Components
- `components/Layout.tsx` - Main application layout
- `components/Header.tsx` - Top navigation bar
- `components/Sidebar.tsx` - Side navigation menu

#### Pages
- `pages/Dashboard.tsx` - Main dashboard
- `pages/Filament.tsx` - Filament management
- `pages/PrintInventory.tsx` - Print job management
- `pages/Projects.tsx` - Project tracking
- `pages/Customers.tsx` - Customer management
- `pages/Sales.tsx` - Sales tracking
- `pages/Reports.tsx` - Business analytics
- `pages/Settings.tsx` - Application settings
- `pages/About.tsx` - About page

### 📁 Public Files (/public)
- `electron.js` - Electron main process
- `index.html` - HTML template
- `manifest.json` - Application manifest

## 📁 Database Schema
### Filaments Table

Other
assets/ - Images og andre statiske filer
types/ - TypeScript type definitions
App.tsx - Root React component
index.tsx - Application entry point
Public Files (/public)
electron.js - Electron main process
index.html - HTML template
manifest.json - Application manifest
Database Schema
Filaments Table

Database
database/setup.ts - Database initialization
database/operations.ts - Database operations

CREATE TABLE filaments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  color TEXT NOT NULL,
  weight REAL NOT NULL,
  price REAL NOT NULL,
  stock REAL NOT NULL,
  ams_slot INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

### Projects Table

CREATE TABLE projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

### Filament Usage Table

CREATE TABLE filament_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER,
  filament_id INTEGER,
  amount REAL NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects (id),
  FOREIGN KEY (filament_id) REFERENCES filaments (id)
);

### Sales Table

CREATE TABLE sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER,
  amount REAL NOT NULL,
  date DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects (id)
);

## Database Schema Tilføjelser

### Print Jobs
- id (PRIMARY KEY)
- project_id (FOREIGN KEY)
- customer_id (FOREIGN KEY, nullable)
- date (TEXT)
- quantity (INTEGER)
- price_per_unit (REAL)
- created_at (DATETIME)

## Nye Database Operationer

### PrintJobOperations
- getAllPrintJobs(): Henter alle print jobs med projekt og kunde info
- addPrintJob(): Opretter nyt print job
- updatePrintJob(): Opdaterer eksisterende print job
- deletePrintJob(): Sletter print job
- calculateProjectCosts(): Beregner omkostninger for et projekt:
  - materialCost: Baseret på filament pris og mængde
  - printingCost: (print_time / 60) * printer_hourly_rate
  - postProcessingCost: (post_processing_time / 60) * post_processing_cost
  - extraCosts: Fra projekt
  - totalCost: Sum af alle omkostninger

## Vigtige Funktioner

### Print Job Håndtering
- Automatisk beregning af omkostninger ved projekt valg
- Gruppering af print jobs efter projekt
- Automatisk fratrækning af filament fra lager ved print
- Real-time opdatering af lager status

### Projekt Integration
- Direkte kobling mellem projekter og print jobs
- Automatisk omkostningsberegning baseret på:
  - Materialeforbrug
  - Print tid
  - Efterbehandlingstid
  - Ekstra omkostninger

### Lager Håndtering
- Automatisk lagertræk ved print job oprettelse
- Validering af tilgængelig filament
- Gruppering af identiske prints

## Nye TypeScript Interfaces

## 🛠 Development Setup
### Prerequisites
Node.js (version 18+)
npm eller yarn
Git

### Installation

# Clone repository
git clone [repository-url]

# Installer dependencies
npm install

# Rebuild native modules
npm run rebuild

# Start development server
npm start

### Build Commands

# Build for production
npm run build

# Build for development
npm run dev

# Package application
npm run dist

## 🔥 Key Features

### Filament Management
Tracking af filament beholdning
AMS slot håndtering (1-16 eller None)
Pris og vægt tracking
Lager status

### Print/Inventory System
Print job management
Printer status tracking
Material usage monitoring

### Project Management
Project tracking
Status updates
Material allocation

### Customer Relations
Customer database
Order history

### Contact management
Contact & Support
Developer: Jacob Manscher
Email: jacobm@printstream.app
Discord: https://discord.gg/utXE9ER5yK

## 🐛 Common Issues & Solutions

### SQLite3 Bindings Error
Kør npm run rebuild
Tjek electron-rebuild installation
Verificer sqlite3 version

### Blank Screen
Tjek console (Ctrl+Shift+I)
Verificer webpack build
Tjek route definitions

### Database Errors
Tjek file permissions
Verificer SQL queries
Tjek database connection


## Database Schema
Databasen bruger SQLite3 med følgende tabeller:

### Filaments
- `id` (PRIMARY KEY)
- `name` (TEXT)
- `type` (TEXT)
- `color` (TEXT)
- `weight` (REAL)
- `price` (REAL)
- `stock` (REAL)
- `ams_slot` (INTEGER, nullable)
- `created_at` (DATETIME)

### Projects
- `id` (PRIMARY KEY)
- `name` (TEXT)
- `description` (TEXT)
- `status` (TEXT)
- `created_at` (DATETIME)

### Print Jobs
- `id` (PRIMARY KEY)
- `project_id` (FOREIGN KEY)
- `customer_id` (FOREIGN KEY)
- `date` (TEXT)
- `quantity` (INTEGER)
- `price_per_unit` (REAL)
- `created_at` (DATETIME)

### Sales
- `id` (PRIMARY KEY)
- `project_id` (FOREIGN KEY)
- `amount` (REAL)
- `date` (DATETIME)
- `status` (TEXT)

## Vigtige Filer og Deres Formål

### Electron Setup
- `public/electron.js`: Hovedproces, håndterer vindue og IPC
- Bruger `nodeIntegration: true` og `contextIsolation: false`

### React Router
- Bruger HashRouter for Electron kompatibilitet
- Routes defineret i `App.tsx`
- Sidebar navigation i `Sidebar.tsx`

### Database Operationer
- Database initialisering i `setup.ts`
- CRUD operationer i `operations.ts`
- Bruger Electron IPC for filsti håndtering

### Hovedmappestruktur/
├── src/
│   ├── components/
│   │   ├── Layout.tsx
│   │   ├── Header.tsx
│   │   └── Sidebar.tsx
│   │
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Filament.tsx
│   │   ├── PrintInventory.tsx
│   │   ├── Projects.tsx
│   │   ├── Customers.tsx
│   │   ├── Sales.tsx
│   │   ├── Reports.tsx
│   │   ├── Settings.tsx
│   │   └── About.tsx
│   │
│   ├── database/
│   │   ├── setup.ts
│   │   └── operations.ts
│   │
│   ├── types/
│   │   └── (TypeScript definitioner)
│   │
│   ├── assets/
│   │   └── (Statiske filer)
│   │
│   ├── App.tsx
│   └── index.tsx
│
├── public/
│   ├── electron.js
│   ├── index.html
│   └── manifest.json
│
└── (Konfigurationsfiler i roden)
    ├── package.json
    ├── webpack.config.js
    ├── tsconfig.json
    ├── .babelrc
    └── DOCUMENTATION.md

## 🔑 License Key Generation

### License Key Format
- Format: `XXXX-YYYY-ZZZZ-WWWW`
  - `XXXX`: Hash af kundeID
  - `YYYY`: Antal dage krypteret
  - `ZZZZ-WWWW`: Validerings checksum

### License Key Generation
- Funktion: `generateLicenseKey(days: number, customerId: string): string`
  - `days`: Antal dage licensen er gyldig
  - `customerId`: Unikt ID for kunden

### License Key Validation
- Funktion: `validateLicenseKey(key: string): { isValid: boolean, days?: number }`
  - Validerer nøglen og dekrypterer antal dage

### Hjælpefunktioner
- `hashString(str: string): string`: Genererer en hash fra en streng
- `encodeDays(days: number): string`: Krypterer antal dage
- `decodeDays(encoded: string): number`: Dekrypterer antal dage
- `generateChecksum(str: string): string`: Genererer en checksum for validering

### License Administration
- Licensnøgler genereres og administreres via et Express-baseret API
- Licenshistorik gemmes i en JSON-fil (`licenses.json`) i `license-admin` projektet
- Licensnøgler kan genereres via en webgrænseflade (`index.html` i `license-admin/src/public`)


Build Process
Development: npm run dev - Starter udviklingsserveren med hot-reloading.
Production: npm run build - Bygger applikationen til produktion.
Packaging: npm run dist - Pakker applikationen til distribution.
Error Handling
Database Validering: Sørg for at alle database operationer håndterer fejl korrekt.
Transaction Rollback: Implementer rollback for at sikre data integritet ved fejl.
UI Error States: Vis brugervenlige fejlmeddelelser i UI.
Logging System: Brug et logging system til at spore fejl og advarsler.
Common Issues & Solutions
SQLite3 Bindings Error: Kør npm run rebuild for at genopbygge native moduler.
Blank Screen: Tjek console (Ctrl+Shift+I) for fejl og verificer webpack build.
Database Errors: Tjek filrettigheder og SQL forespørgsler.
License Admin Tool
Installation: Kør npm install i license-admin mappen.
Start: Kør npm start for at starte værktøjet.
Port: Værktøjet kører på port 3000 som standard.
License Key Management
Generering: Brug generateLicenseKey funktionen til at oprette nøgler.
Validering: Brug validateLicenseKey til at sikre gyldighed.
Opbevaring: Licensnøgler gemmes i licenses.json.
Disse punkter kan hjælpe med at sikre en glat udviklings- og vedligeholdelsesproces. Hvis der er noget specifikt du vil have uddybet, så lad mig vide det!

## Project Structure
- `/src`: Source code
  - `/components`: Reusable React components
  - `/pages`: Page components
  - `/context`: React context providers
  - `/database`: Database operations and setup
  - `/utils`: Utility functions
- `/public`: Static files
- `/scripts`: Build and utility scripts

## Key Components
- `Layout.tsx`: Main layout component with sidebar and header
- `Sidebar.tsx`: Navigation sidebar
- `Header.tsx`: Top header with notifications
- `ProtectedRoute.tsx`: Route protection for authentication

## Database Structure
- `filaments`: Stores filament information
- `projects`: Stores project information
- `project_filaments`: Many-to-many relation between projects and filaments
- `customers`: Customer information
- `print_jobs`: Print job tracking
- `sales`: Sales records
- `settings`: Application settings
- `license`: License information
- `used_licenses`: Tracks used license keys

## Theme System
- Uses Chakra UI for theming
- Custom theme configuration in `theme.ts`
- Dark mode support via `useColorMode` hook
- Custom variants like `stats-card` for consistent styling
- Color mode toggle in Settings page

### Dark Mode Implementation
- Use `useColorModeValue` for dynamic colors
- Define colors in theme configuration
- Create consistent component variants
- Handle background, text, and border colors
- Consider contrast and readability

### Common Dark Mode Patterns
1. Box components: Use `variant="stats-card"` for consistent styling
2. Text colors: Use `useColorModeValue` for dynamic text colors
3. Background colors: Define in theme for light/dark modes
4. Border colors: Adjust for better contrast in dark mode

### Lessons Learned
1. Always test dark mode on all components
2. Use theme variants for consistent styling
3. Consider accessibility and contrast
4. Test all interactive elements in both modes
5. Keep color definitions centralized in theme
6. Use semantic color names in theme
7. Test transitions between modes

## License System
- 30-day trial period
- License key validation
- Installation tracking
- Used license keys database
- Automatic expiry check

## Error Handling
- Toast notifications for user feedback
- Console logging for debugging
- Try-catch blocks for database operations
- Graceful error recovery

## State Management
- React Context for global state
- Local state for component-specific data
- Database for persistent storage

## Currency Handling
- Supports multiple currencies
- Currency selection in settings
- Consistent formatting across app

## Best Practices
1. Use TypeScript for type safety
2. Implement proper error handling
3. Follow consistent naming conventions
4. Keep components modular and reusable
5. Document complex functionality
6. Use proper database indexing
7. Implement proper validation
8. Follow security best practices
9. Test thoroughly before deployment
10. Keep dependencies updated

## Common Issues and Solutions
1. Database connection issues:
   - Check file permissions
   - Verify path to database file
   - Ensure proper initialization

2. License validation:
   - Verify key format
   - Check expiration dates
   - Handle network errors

3. Dark mode inconsistencies:
   - Use theme variants consistently
   - Test all components in both modes
   - Check contrast ratios
   - Verify component transitions

4. Performance issues:
   - Implement proper indexing
   - Use pagination for large datasets
   - Optimize database queries
   - Implement caching where appropriate

## Development Guidelines
1. Follow TypeScript best practices
2. Use consistent code formatting
3. Write clear documentation
4. Implement proper testing
5. Use meaningful commit messages
6. Review code before merging
7. Keep dependencies updated
8. Monitor performance
9. Follow security guidelines
10. Maintain backup procedures

## Future Improvements
1. Add more currency options
2. Implement advanced reporting
3. Add data export features
4. Enhance user interface
5. Add more customization options
6. Implement backup system
7. Add multi-language support
8. Enhance security features
9. Add more analytics
10. Implement automated testing

### Backup System
- Automatisk backup ved opstart (konfigurerbart)
- Manuel backup funktion
- Backup filnavne inkluderer tidsstempel (YYYY-MM-DD_HH-mm-ss)
- Backup placering: `%APPDATA%/PrintStream/backups/`
- Behold kun de 5 seneste auto-backups
- Sikker restore funktion med pre-restore backup
- Backup indeholder alle database tabeller og data

### Lessons Learned (Tilføjet)
11. Implementer tidsstempel i backup filnavne for bedre sporing
12. Lav sikkerhedskopi før restore operation
13. Begræns antal auto-backups for at spare diskplads
14. Brug konsistente måleenheder (timer/minutter) i brugergrænsefladen
15. Tillad brugerdefinerede valutakoder for bedre fleksibilitet
16. Implementer bekræftelsesdialoger for kritiske operationer

### Best Practices (Tilføjet)
11. Brug tidsstempler i filnavne for unikke backups
12. Implementer rollback mekanismer for kritiske operationer
13. Begræns automatisk genererede filer
14. Giv brugeren kontrol over automatiserede processer
15. Tillad brugerdefinerede værdier hvor det giver mening

### Common Issues and Solutions (Tilføjet)
5. Backup og Restore:
   - Lav sikkerhedskopi før restore
   - Brug unikke filnavne med tidsstempel
   - Håndter diskplads ved at begrænse antal backups
   - Implementer fejlhåndtering for filsystem operationer

6. Brugergrænsefladen:
   - Tilbyd fleksible input muligheder (timer/minutter)
   - Understøt brugerdefinerede valutakoder
   - Giv tydelig feedback ved kritiske operationer
   - Behold konsistent styling på tværs af temaer