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

  // Opret filaments tabel med low_stock_alert kolonne
  await exec(`
    CREATE TABLE IF NOT EXISTS filaments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      color TEXT NOT NULL,
      weight REAL NOT NULL,
      price REAL NOT NULL,
      stock REAL NOT NULL,
      ams_slot INTEGER,
      low_stock_alert REAL DEFAULT 500,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Tilføj low_stock_alert kolonne hvis den ikke findes
  try {
    await exec(`
      ALTER TABLE filaments 
      ADD COLUMN low_stock_alert REAL DEFAULT 500;
    `);
  } catch (err: unknown) {
    const error = err as Error;
    if (!error.message.includes('duplicate column name')) {
      throw err;
    }
  }

  // Opret projects tabel med korrekte kolonne-navne
  await exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      print_time INTEGER NOT NULL,
      post_processing_time INTEGER NOT NULL,
      extra_costs REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Opret project_filaments tabel for at håndtere mange-til-mange relation
  await exec(`
    CREATE TABLE IF NOT EXISTS project_filaments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      filament_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
      FOREIGN KEY (filament_id) REFERENCES filaments (id) ON DELETE CASCADE
    );
  `);

  // Opdater customers tabel med contact_person
  await exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      contact_person TEXT,
      email TEXT,
      phone TEXT,
      address TEXT,
      vat_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Tilføj contact_person kolonne hvis den ikke findes
  try {
    await exec(`
      ALTER TABLE customers 
      ADD COLUMN contact_person TEXT;
    `);
  } catch (err: unknown) {
    const error = err as Error;
    if (!error.message.includes('duplicate column name')) {
      throw err;
    }
  }

  // Tilføj settings tabel
  await exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      printer_hourly_rate REAL DEFAULT 0,
      post_processing_cost REAL DEFAULT 0,
      currency TEXT DEFAULT 'DKK',
      profit_margin REAL DEFAULT 30,
      company_name TEXT,
      company_address TEXT,
      company_phone TEXT,
      company_email TEXT,
      bank_details TEXT,
      vat_id TEXT
    );
  `);

  // Tilføj profit_margin kolonne hvis den ikke findes
  try {
    await exec(`
      ALTER TABLE settings 
      ADD COLUMN profit_margin REAL DEFAULT 30;
    `);
  } catch (err: unknown) {
    const error = err as Error;
    if (!error.message.includes('duplicate column name')) {
      throw err;
    }
  }

  // Tilføj auto_backup kolonne til settings tabellen
  try {
    await exec(`
      ALTER TABLE settings 
      ADD COLUMN auto_backup BOOLEAN DEFAULT 0;
    `);
  } catch (err: unknown) {
    const error = err as Error;
    if (!error.message.includes('duplicate column name')) {
      throw err;
    }
  }

  // Indsæt standard indstillinger hvis tabellen er tom
  const settingsCount = await get('SELECT COUNT(*) as count FROM settings');
  if (settingsCount.count === 0) {
    await exec(`
      INSERT INTO settings (
        printer_hourly_rate,
        post_processing_cost,
        currency,
        dark_mode
      ) VALUES (
        100,
        100,
        'EUR',
        1
      );
    `);
  }

  // Opdater print_jobs tabel
  await exec(`
    CREATE TABLE IF NOT EXISTS print_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      customer_id INTEGER,
      date TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      price_per_unit REAL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
      FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE SET NULL
    );
  `);

  // Først opretter vi sales tabellen
  await exec(`
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      customer_id INTEGER,
      print_job_id INTEGER NOT NULL,
      invoice_number TEXT NOT NULL,
      sale_date TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      total_price REAL NOT NULL,
      payment_status TEXT NOT NULL,
      payment_due_date TEXT NOT NULL,
      notes TEXT,
      project_name TEXT NOT NULL,
      customer_name TEXT,
      material_cost REAL NOT NULL,
      printing_cost REAL NOT NULL,
      processing_cost REAL NOT NULL,
      extra_costs REAL NOT NULL,
      currency TEXT NOT NULL,
      shipping_cost REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects (id),
      FOREIGN KEY (customer_id) REFERENCES customers (id),
      FOREIGN KEY (print_job_id) REFERENCES print_jobs (id)
    );
  `);

  // Tilføj license tabel
  await exec(`
    CREATE TABLE IF NOT EXISTS license (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      installation_date TEXT NOT NULL,
      expiry_date TEXT NOT NULL,
      license_key TEXT,
      installation_id TEXT
    );
  `);

  // Tilføj used_licenses tabel
  await exec(`
    CREATE TABLE IF NOT EXISTS used_licenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      license_key TEXT NOT NULL UNIQUE,
      first_used_date TEXT NOT NULL,
      installation_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Indsæt installations dato hvis tabellen er tom
  const licenseCount = await get('SELECT COUNT(*) as count FROM license');
  if (licenseCount.count === 0) {
    const now = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(now.getDate() + 30);

    await run(  // Brug run i stedet for exec for at håndtere parametre
      `INSERT INTO license (
        installation_date, 
        expiry_date, 
        license_key
      ) VALUES (?, ?, ?)`,
      [
        now.toISOString(),
        expiryDate.toISOString(),
        null
      ]
    );
  }

  // Tilføj installation_id kolonne hvis den ikke findes
  try {
    await exec(`
      ALTER TABLE license ADD COLUMN installation_id TEXT;
    `);
  } catch (err: unknown) {
    const error = err as Error;
    if (!error.message.includes('duplicate column name')) {
      throw err;
    }
  }

  // Tilføj dette efter license tabel oprettelsen
  await exec(`
    CREATE TABLE IF NOT EXISTS used_licenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      license_key TEXT NOT NULL UNIQUE,
      first_used_date TEXT NOT NULL,
      installation_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Tilføj denne SQL til setupDatabase funktionen
  await exec(`
    CREATE TABLE IF NOT EXISTS app_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version TEXT NOT NULL,
      install_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      installation_id TEXT NOT NULL
    );
  `);

  // Tjek om der er nogen version gemt
  const versionCount = await get('SELECT COUNT(*) as count FROM app_versions');
  if (versionCount.count === 0) {
    // Hvis ingen version er gemt, skal vi:
    // 1. Sikre at vi har et installations-id
    const license = await get('SELECT installation_id FROM license WHERE id = 1');
    let installationId = license?.installation_id;
    
    if (!installationId) {
      // Generer nyt installations-id hvis det ikke findes
      installationId = 'inst_' + Math.random().toString(36).substr(2, 9);
      await run(
        'UPDATE license SET installation_id = ? WHERE id = 1',
        [installationId]
      );
    }

    // 2. Indsæt initial version med installations-id
    const now = new Date();
    await run(
      'INSERT INTO app_versions (version, installation_id, install_date) VALUES (?, ?, ?)',
      ['0.2.6', installationId, now.toISOString()]
    );

    console.log('Created initial version record:', {
      version: '0.2.6',
      installationId,
      installDate: now
    });
  }

  // Tilføj resin kolonner hvis de ikke findes
  try {
    await exec(`
      ALTER TABLE filaments 
      ADD COLUMN is_resin BOOLEAN DEFAULT 0;
    `);
    await exec(`
      ALTER TABLE filaments 
      ADD COLUMN resin_exposure REAL DEFAULT NULL;
    `);
    await exec(`
      ALTER TABLE filaments 
      ADD COLUMN resin_bottom_exposure REAL DEFAULT NULL;
    `);
    await exec(`
      ALTER TABLE filaments 
      ADD COLUMN resin_lift_distance REAL DEFAULT NULL;
    `);
    await exec(`
      ALTER TABLE filaments 
      ADD COLUMN resin_lift_speed REAL DEFAULT NULL;
    `);
  } catch (err: unknown) {
    const error = err as Error;
    if (!error.message.includes('duplicate column name')) {
      throw err;
    }
  }

  // Opret sales tabellen med alle nødvendige kolonner
  await exec(`
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      customer_id INTEGER,
      print_job_id INTEGER NOT NULL,
      invoice_number TEXT NOT NULL,
      sale_date TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      total_price REAL NOT NULL,
      payment_status TEXT NOT NULL,
      payment_due_date TEXT NOT NULL,
      notes TEXT,
      project_name TEXT NOT NULL,
      customer_name TEXT,
      material_cost REAL NOT NULL,
      printing_cost REAL NOT NULL,
      processing_cost REAL NOT NULL,
      extra_costs REAL NOT NULL,
      currency TEXT NOT NULL,
      shipping_cost REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects (id),
      FOREIGN KEY (customer_id) REFERENCES customers (id),
      FOREIGN KEY (print_job_id) REFERENCES print_jobs (id)
    );
  `);

  return { run, get, all, exec }
}

export default initializeDatabase