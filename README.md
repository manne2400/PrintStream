# PrintStream Documentation

## Database Schema

### Tables

#### customers
- id: INTEGER PRIMARY KEY AUTOINCREMENT
- name: TEXT NOT NULL
- email: TEXT
- phone: TEXT
- address: TEXT
- vat_number: TEXT
- notes: TEXT
- created_at: DATETIME DEFAULT CURRENT_TIMESTAMP

#### filaments
- id: INTEGER PRIMARY KEY AUTOINCREMENT
- name: TEXT NOT NULL
- type: TEXT NOT NULL
- color: TEXT NOT NULL
- weight: REAL NOT NULL
- price: REAL NOT NULL
- stock: REAL NOT NULL
- ams_slot: INTEGER
- low_stock_alert: REAL DEFAULT 500
- is_resin: BOOLEAN DEFAULT FALSE
- resin_exposure: REAL
- resin_bottom_exposure: REAL
- resin_lift_distance: REAL
- resin_lift_speed: REAL
- created_at: DATETIME DEFAULT CURRENT_TIMESTAMP

#### projects
- id: INTEGER PRIMARY KEY AUTOINCREMENT
- name: TEXT NOT NULL
- description: TEXT
- print_time: INTEGER
- post_processing_time: INTEGER
- extra_costs: REAL
- customer_id: INTEGER (FOREIGN KEY)
- status: TEXT DEFAULT 'pending'
- created_at: DATETIME DEFAULT CURRENT_TIMESTAMP

#### print_jobs
- id: INTEGER PRIMARY KEY AUTOINCREMENT
- project_id: INTEGER (FOREIGN KEY)
- customer_id: INTEGER (FOREIGN KEY)
- date: TEXT
- quantity: INTEGER
- price_per_unit: REAL
- status: TEXT DEFAULT 'pending'
- created_at: DATETIME DEFAULT CURRENT_TIMESTAMP

#### sales
- id: INTEGER PRIMARY KEY AUTOINCREMENT
- invoice_number: TEXT NOT NULL
- customer_id: INTEGER (FOREIGN KEY)
- total_amount: REAL NOT NULL
- payment_status: TEXT DEFAULT 'pending'
- sale_date: DATETIME DEFAULT CURRENT_TIMESTAMP
- due_date: DATETIME
- notes: TEXT
- shipping_cost: REAL DEFAULT 0
- coupon_code: TEXT
- coupon_amount: REAL
- generated_coupon_code: TEXT
- generated_coupon_amount: REAL

## Core Components

### src/App.tsx
- Root application component
- Implements React Router setup
- Theme provider configuration
- Global layout management
- Key components:
  - ThemeProvider
  - RouterProvider
  - GlobalStyles

### src/database/setup.ts
- Database initialization and connection
- Table creation and updates
- Schema management
- Migration handling

### src/database/operations.ts
- Database CRUD operations
- Business logic implementation
- Data validation
- Transaction handling

## Features

### Printer Monitoring
- Real-time status updates
- Temperature monitoring
- Print progress tracking
- Error detection
- Remote control capabilities

### Sales Management
- Invoice generation
- Payment tracking
- Coupon system
- Customer management
- Stock updates

### Inventory Control
- Filament tracking
- Stock alerts
- Usage history
- Resin management
- AMS integration

## Development

### Setup Requirements
- Node.js 18+
- Python 3.8+
- SQLite3
- Required npm packages:
  - electron
  - react
  - chakra-ui
  - sqlite3

### Build Commands
- npm start: Development mode
- npm run build: Production build
- npm run dist: Create installer
- npm run dist:linux: Linux build

### Important Paths
- Database: userData/database.sqlite
- Backups: userData/backups
- Logs: userData/logs/main.log
- Printer status: userData/printer_status.json

## License System
- 30-day trial period
- License key validation
- Online activation
- Version tracking
- Installation ID management

## Notes
- Always backup database before updates
- Python environment required for printer monitoring
- Internet connection needed for license validation
- Regular backups recommended
- Check logs for troubleshooting

## Vigtige Interfaces og Types

### PrinterStatusData
- connected: boolean
- error?: string
- last_update: number
- gcode_state: string | null
- nozzle_temper: number | null
- bed_temper: number | null
- subtask_name: string | null
- mc_percent: number | null
- mc_remaining_time: number | null
- ams_humidity: string | null

### PrinterConfig
- ip_address: string
- access_code: string
- serial: string
- name?: string
- type: 'bambu' | 'other'
- default_settings?: PrinterSettings

### Database Error Codes
- DB_001: Database connection error
- DB_002: Table creation failed
- DB_003: Query execution failed
- DB_004: Transaction failed
- DB_005: Backup failed

### IPC Channels
- get-user-data-path
- get-printer-status
- start-printer-monitor
- stop-printer-monitor
- create-backup
- restore-backup
- generate-invoice
- validate-license

### Environment Variables
- PRINTSTREAM_DATA_PATH: Sti til applikationsdata
- LOG_LEVEL: debug | info | warn | error
- PRINTER_MONITOR_PORT: Default 3000
- DB_BACKUP_INTERVAL: Timer mellem backups
- NODE_ENV: development | production

### API Endpoints
- Time API URLs:
  - timeapi.io/api/Time/current/zone
  - api.timezonedb.com/v2.1/get-time-zone
  - showcase.api.linx.twenty57.net/UnixTime/tounix
  - currentmillis.com/time/minutes-since-unix-epoch.php

### Filstier
- Database: userData/database.sqlite
- Printer Status: userData/printer_status.json
- Logs: userData/logs/main.log
- Backups: userData/backups/
- Python Tools: py_tools/

### Vigtige Konstanter
- INVOICE_MARGIN: 40
- TABLE_POS: { x: 40, y: 330 }
- ROW_HEIGHT: 30
- DEFAULT_VAT_RATE: 0.25
- MAX_BACKUP_FILES: 10
- LICENSE_CHECK_INTERVAL: 24 * 60 * 60 * 1000
- PRINTER_CHECK_INTERVAL: 2000

### Regex Patterns
- EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
- PHONE_REGEX: /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/
- VAT_REGEX: /^[A-Z]{2}[0-9A-Z]+$/
- LICENSE_KEY_REGEX: /^[A-Z0-9]{4}-[A-Z0-9]{8}-[A-Z0-9]{4}-[A-Z0-9]{4}$/

### Database Tabeller (Yderligere Detaljer)
- settings:
  - theme: 'light' | 'dark'
  - language: 'en' | 'da'
  - currency: 'DKK' | 'EUR' | 'USD'
  - vat_rate: number
  - company_info: CompanyInfo object

### Python Script Arguments
- --ip: Printer IP address
- --code: Access code
- --serial: Printer serial number
- --port: Monitor port (optional)
- --log: Log level (optional)