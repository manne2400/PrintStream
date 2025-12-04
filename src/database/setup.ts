import sqlite3 from 'sqlite3'
import { ipcRenderer } from 'electron'
import path from 'path'

export interface Database {
  run: (sql: string, params?: any[]) => Promise<any>
  get: (sql: string, params?: any[]) => Promise<any>
  all: (sql: string, params?: any[]) => Promise<any[]>
  exec: (sql: string) => Promise<void>
}

const initializeDatabase = async (): Promise<Database> => {
  const userDataPath = await ipcRenderer.invoke('get-user-data-path');
  const dbPath = path.join(userDataPath, 'database.sqlite')
  
  const db = new sqlite3.Database(dbPath)
  
  // Wrap sqlite3 methods i promises
  const run = (sql: string, params: any[] = []): Promise<any> => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) reject(err)
        else resolve(this)
      })
    })
  }

  const get = (sql: string, params: any[] = []): Promise<any> => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err)
        else resolve(row)
      })
    })
  }

  const all = (sql: string, params: any[] = []): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err)
        else resolve(rows)
      })
    })
  }

  const exec = (sql: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      db.exec(sql, (err) => {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  // Opret alle basis tabeller
  await exec(`
    CREATE TABLE IF NOT EXISTS app_versions (
      id              INTEGER  PRIMARY KEY AUTOINCREMENT,
      version         TEXT     NOT NULL,
      install_date    DATETIME DEFAULT CURRENT_TIMESTAMP,
      installation_id TEXT     NOT NULL
    );

    CREATE TABLE IF NOT EXISTS coupons (
      id          INTEGER  PRIMARY KEY AUTOINCREMENT,
      code        TEXT     UNIQUE
                           NOT NULL,
      customer_id INTEGER  NOT NULL,
      amount      REAL     NOT NULL,
      currency    TEXT     NOT NULL,
      is_used     BOOLEAN  DEFAULT FALSE,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (
      customer_id
      )
      REFERENCES customers (id) 
    );

    CREATE TABLE IF NOT EXISTS custom_material_types (
    id         INTEGER  PRIMARY KEY AUTOINCREMENT,
    name       TEXT     NOT NULL
                        UNIQUE,
    is_resin   BOOLEAN  NOT NULL
                        DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS customers (
    id             INTEGER  PRIMARY KEY AUTOINCREMENT,
    name           TEXT     NOT NULL,
    contact_person TEXT,
    email          TEXT,
    phone          TEXT,
    address        TEXT,
    vat_id         TEXT,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS filaments (
      id                    INTEGER  PRIMARY KEY AUTOINCREMENT,
      name                  TEXT     NOT NULL,
      type                  TEXT     NOT NULL,
      color                 TEXT     NOT NULL,
      weight                REAL     NOT NULL,
      price                 REAL     NOT NULL,
      stock                 REAL     NOT NULL,
      ams_slot              INTEGER,
      low_stock_alert       REAL     DEFAULT 500,
      created_at            DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_resin              BOOLEAN  DEFAULT 0,
      resin_exposure        REAL     DEFAULT NULL,
      resin_bottom_exposure REAL     DEFAULT NULL,
      resin_lift_distance   REAL     DEFAULT NULL,
      resin_lift_speed      REAL     DEFAULT NULL
    );

    CREATE TABLE IF NOT EXISTS license (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      installation_date TEXT    NOT NULL,
      expiry_date       TEXT    NOT NULL,
      license_key       TEXT,
      installation_id   TEXT
    );

    CREATE TABLE IF NOT EXISTS print_jobs (
      id             INTEGER  PRIMARY KEY AUTOINCREMENT,
      project_id     INTEGER  NOT NULL,
      customer_id    INTEGER,
      date           TEXT     NOT NULL,
      quantity       INTEGER  NOT NULL,
      price_per_unit REAL,
      status         TEXT     NOT NULL
                            DEFAULT 'pending',
      created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (
          project_id
      )
      REFERENCES projects (id) ON DELETE CASCADE,
      FOREIGN KEY (
          customer_id
      )
      REFERENCES customers (id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS printer_config (
      id          INTEGER  PRIMARY KEY AUTOINCREMENT,
      ip_address  TEXT     NOT NULL,
      access_code TEXT     NOT NULL,
      serial      TEXT     NOT NULL,
      name        TEXT,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS project_filaments (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id  INTEGER NOT NULL,
      filament_id INTEGER NOT NULL,
      amount      REAL    NOT NULL,
      FOREIGN KEY (
          project_id
      )
      REFERENCES projects (id) ON DELETE CASCADE,
      FOREIGN KEY (
          filament_id
      )
      REFERENCES filaments (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS projects (
      id                   INTEGER  PRIMARY KEY AUTOINCREMENT,
      name                 TEXT     NOT NULL,
      description          TEXT,
      print_time           INTEGER  NOT NULL,
      post_processing_time INTEGER  NOT NULL,
      extra_costs          REAL     DEFAULT 0,
      created_at           DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sales (
      id                      INTEGER  PRIMARY KEY AUTOINCREMENT,
      project_id              INTEGER,
      customer_id             INTEGER,
      print_job_id            INTEGER,
      invoice_number          TEXT     NOT NULL,
      sale_date               DATETIME,
      quantity                INTEGER,
      unit_price              REAL,
      total_price             REAL,
      payment_status          TEXT,
      payment_due_date        DATETIME,
      notes                   TEXT,
      project_name            TEXT,
      customer_name           TEXT,
      material_cost           REAL,
      printing_cost           REAL,
      processing_cost         REAL,
      extra_costs             REAL,
      currency                TEXT,
      shipping_cost           REAL,
      coupon_code             TEXT,
      coupon_amount           REAL,
      generated_coupon_code   TEXT,
      generated_coupon_amount REAL,
      FOREIGN KEY (
          project_id
      )
      REFERENCES projects (id),
      FOREIGN KEY (
          customer_id
      )
      REFERENCES customers (id),
      FOREIGN KEY (
          print_job_id
      )
      REFERENCES print_jobs (id) 
    );
    
    CREATE TABLE IF NOT EXISTS settings (
      id                   INTEGER PRIMARY KEY AUTOINCREMENT,
      printer_hourly_rate  REAL    DEFAULT 0,
      post_processing_cost REAL    DEFAULT 0,
      currency             TEXT    DEFAULT 'DKK',
      profit_margin        REAL    DEFAULT 30,
      company_name         TEXT,
      company_address      TEXT,
      company_phone        TEXT,
      company_email        TEXT,
      bank_details         TEXT,
      vat_id               TEXT,
      auto_backup          BOOLEAN DEFAULT 0,
      dark_mode            BOOLEAN DEFAULT 1,
      invoice_logo_path    TEXT
    );

    CREATE TABLE IF NOT EXISTS used_licenses (
      id              INTEGER  PRIMARY KEY AUTOINCREMENT,
      license_key     TEXT     NOT NULL
                               UNIQUE,
      first_used_date TEXT     NOT NULL,
      installation_id TEXT     NOT NULL,
      created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
    );


  `);

  // Indsæt standard settings og initial licens hvis de ikke findes
  await run(`
    INSERT OR IGNORE INTO settings (id) VALUES (1);
  `);

  // Tilføj initial trial licens hvis der ikke findes nogen
  const currentDate = new Date();
  const expiryDate = new Date();
  expiryDate.setDate(currentDate.getDate() + 3650); // 10 års gratis licens

  await run(`
    INSERT OR IGNORE INTO license (
      id, 
      installation_date, 
      expiry_date, 
      installation_id
    ) 
    VALUES (
      1, 
      ?, 
      ?, 
      ?
    )
  `, [
    currentDate.toISOString(),
    expiryDate.toISOString(),
    Math.random().toString(36).substring(7)
  ]);

  // Tjek først om kolonnerne eksisterer
  const columns = await all(`
    PRAGMA table_info(sales)
  `);

  const columnNames = columns.map(col => col.name);
  const missingColumns = [];

  if (!columnNames.includes('coupon_code')) {
    missingColumns.push('coupon_code TEXT');
  }
  if (!columnNames.includes('coupon_amount')) {
    missingColumns.push('coupon_amount REAL');
  }
  if (!columnNames.includes('generated_coupon_code')) {
    missingColumns.push('generated_coupon_code TEXT');
  }
  if (!columnNames.includes('generated_coupon_amount')) {
    missingColumns.push('generated_coupon_amount REAL');
  }

  // Tilføj manglende kolonner én ad gangen
  for (const column of missingColumns) {
    try {
      await run(`ALTER TABLE sales ADD COLUMN ${column}`);
    } catch (error) {
      console.error(`Fejl ved tilføjelse af kolonne ${column}:`, error);
    }
  }

  return { run, get, all, exec }
}

export default initializeDatabase