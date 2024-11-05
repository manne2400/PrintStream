# PrintStream Documentation

## 🚀 Project Overview
PrintStream er et Electron-baseret desktop program til styring af 3D print virksomhed, udviklet med React, TypeScript og Chakra UI.

## 💻 Tech Stack
| Kategori | Teknologi |
|----------|-----------|
| Frontend Framework | React 18 med TypeScript |
| UI Library | Chakra UI |
| Database | SQLite3 med lokalt filsystem |
| Desktop Framework | Electron |
| Build Tools | Webpack, Electron Builder |
| State Management | React Hooks og Context |
| Routing | React Router v6 med HashRouter |

## 📁 Project Structure
### Core Files
package.json - Project dependencies og scripts
webpack.config.js - Webpack configuration
tsconfig.json - TypeScript configuration
.babelrc - Babel configuration
DOCUMENTATION.md - Denne dokumentation

## 📁 Source Code (/src)
### Components
components/Layout.tsx - Main application layout
components/Header.tsx - Top navigation bar
components/Sidebar.tsx - Side navigation menu

### Pages
pages/Dashboard.tsx - Main dashboard
pages/Filament.tsx - Filament management
pages/PrintInventory.tsx - Print job management
pages/Projects.tsx - Project tracking
pages/Customers.tsx - Customer management
pages/Sales.tsx - Sales tracking
pages/Reports.tsx - Business analytics
pages/Settings.tsx - Application settings
pages/About.tsx - About page

## 📁 Public Files (/public)
electron.js - Electron main process
index.html - HTML template
manifest.json - Application manifest

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
- id (PRIMARY KEY)
- name (TEXT)
- type (TEXT)
- color (TEXT)
- weight (REAL)
- price (REAL)
- stock (REAL)
- ams_slot (INTEGER, nullable)
- created_at (DATETIME)

### Projects
- id (PRIMARY KEY)
- name (TEXT)
- description (TEXT)
- status (TEXT)
- created_at (DATETIME)

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

### Hovedmappestruktur
/
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