import sqlite3 from 'sqlite3';
import path from 'path';
import { app } from 'electron';
import { hashPassword } from '../src/utils/auth';
import { UserOperations } from '../src/database/operations';

// Speciel version af database setup til scripts
async function initScriptDatabase() {
  // Brug samme sti som applikationen bruger
  const userDataPath = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Application Support' : process.env.HOME + "/.local/share");
  const dbPath = path.join(userDataPath, 'PrintStream', 'database.sqlite');
  
  console.log('Using database path:', dbPath);
  
  const db = new sqlite3.Database(dbPath);
  
  const run = (sql: string, params: any[] = []): Promise<any> => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
  };

  const get = (sql: string, params: any[] = []): Promise<any> => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  };

  const all = (sql: string, params: any[] = []): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  };

  const exec = (sql: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      db.exec(sql, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  };

  // Opret users tabel hvis den ikke findes
  await exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      full_name TEXT,
      email TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    );
  `);

  return { run, get, all, exec };
}

async function createAdminUser() {
  try {
    const db = await initScriptDatabase();
    const userOps = new UserOperations(db);
    
    const password_hash = await hashPassword('admin123');
    await userOps.createUser({
      username: 'admin',
      password_hash,
      full_name: 'System Administrator',
      email: 'admin@printstream.app',
      role: 'admin'
    });
    
    console.log('Admin user created successfully');
  } catch (err) {
    console.error('Failed to create admin user:', err);
  }
}

createAdminUser(); 