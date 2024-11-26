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

  // Opret printer_config tabel hvis den ikke findes
  await exec(`
    CREATE TABLE IF NOT EXISTS printer_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ip_address TEXT NOT NULL,
      access_code TEXT NOT NULL,
      serial TEXT NOT NULL,
      name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Først, tjek om kolonnerne eksisterer
  const tableInfo = await all("PRAGMA table_info(sales)");
  const columns = tableInfo.map(col => col.name);

  // Tilføj manglende kolonner hvis de ikke findes
  if (!columns.includes('coupon_code')) {
    await exec('ALTER TABLE sales ADD COLUMN coupon_code TEXT');
  }
  if (!columns.includes('coupon_amount')) {
    await exec('ALTER TABLE sales ADD COLUMN coupon_amount REAL');
  }
  if (!columns.includes('generated_coupon_code')) {
    await exec('ALTER TABLE sales ADD COLUMN generated_coupon_code TEXT');
  }
  if (!columns.includes('generated_coupon_amount')) {
    await exec('ALTER TABLE sales ADD COLUMN generated_coupon_amount REAL');
  }

  // Opret coupons tabel hvis den ikke findes
  await exec(`
    CREATE TABLE IF NOT EXISTS coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      customer_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL,
      is_used BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers (id)
    );
  `);

  return { run, get, all, exec }
}

export default initializeDatabase