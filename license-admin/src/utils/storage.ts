import fs from 'fs';
import path from 'path';

interface LicenseRecord {
  customerId: string;
  days: number;
  licenseKey: string;
  generatedAt: string;
}

const STORAGE_FILE = path.join(__dirname, '../data/licenses.json');

// Sørg for at data mappen eksisterer
const ensureDataDir = () => {
  const dir = path.dirname(STORAGE_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Indlæs eksisterende licenser
export const loadLicenses = (): LicenseRecord[] => {
  ensureDataDir();
  if (!fs.existsSync(STORAGE_FILE)) {
    return [];
  }
  const data = fs.readFileSync(STORAGE_FILE, 'utf8');
  return JSON.parse(data);
};

// Gem ny licens
export const saveLicense = (record: Omit<LicenseRecord, 'generatedAt'>) => {
  const licenses = loadLicenses();
  const newRecord = {
    ...record,
    generatedAt: new Date().toISOString()
  };
  licenses.push(newRecord);
  ensureDataDir();
  fs.writeFileSync(STORAGE_FILE, JSON.stringify(licenses, null, 2));
  return newRecord;
}; 