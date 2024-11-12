"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const license_1 = require("./utils/license");
const storage_1 = require("./utils/storage");
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use(express_1.default.static(path_1.default.join(__dirname, 'public')));
const port = 3000;
app.get('/', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, 'public', 'index.html'));
});
app.get('/licenses', (req, res) => {
    const licenses = (0, storage_1.loadLicenses)();
    res.json(licenses);
});
app.post('/generate', (req, res) => {
    const { days, customerId } = req.body;
    try {
        const licenseKey = (0, license_1.generateLicenseKey)(Number(days), customerId);
        const record = (0, storage_1.saveLicense)({
            customerId,
            days: Number(days),
            licenseKey
        });
        res.json(Object.assign({ success: true }, record));
    }
    catch (error) {
        res.status(400).json({ success: false, error: 'Invalid input' });
    }
});
app.listen(port, () => {
    console.log(`License admin tool running at http://localhost:${port}`);
});
