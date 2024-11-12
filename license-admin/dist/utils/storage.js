"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveLicense = exports.loadLicenses = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const STORAGE_FILE = path_1.default.join(__dirname, '../data/licenses.json');
// Sørg for at data mappen eksisterer
const ensureDataDir = () => {
    const dir = path_1.default.dirname(STORAGE_FILE);
    if (!fs_1.default.existsSync(dir)) {
        fs_1.default.mkdirSync(dir, { recursive: true });
    }
};
// Indlæs eksisterende licenser
const loadLicenses = () => {
    ensureDataDir();
    if (!fs_1.default.existsSync(STORAGE_FILE)) {
        return [];
    }
    const data = fs_1.default.readFileSync(STORAGE_FILE, 'utf8');
    return JSON.parse(data);
};
exports.loadLicenses = loadLicenses;
// Gem ny licens
const saveLicense = (record) => {
    const licenses = (0, exports.loadLicenses)();
    const newRecord = Object.assign(Object.assign({}, record), { generatedAt: new Date().toISOString() });
    licenses.push(newRecord);
    ensureDataDir();
    fs_1.default.writeFileSync(STORAGE_FILE, JSON.stringify(licenses, null, 2));
    return newRecord;
};
exports.saveLicense = saveLicense;
