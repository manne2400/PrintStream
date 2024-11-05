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

  return { run, get, all, exec }
}

export default initializeDatabase