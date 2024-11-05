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

  // Opret tabeller hvis de ikke findes
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS filament_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      filament_id INTEGER,
      amount REAL NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects (id),
      FOREIGN KEY (filament_id) REFERENCES filaments (id)
    );

    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      amount REAL NOT NULL,
      date DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects (id)
    );
  `)

  return { run, get, all, exec }
}

export default initializeDatabase