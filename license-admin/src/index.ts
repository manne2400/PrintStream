import { generateLicenseKey } from './utils/license';
import { saveLicense, loadLicenses } from './utils/storage';
import express from 'express';
import path from 'path';

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const port = 3000;

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/licenses', (req, res) => {
  const licenses = loadLicenses();
  res.json(licenses);
});

app.post('/generate', (req, res) => {
  const { days, customerId } = req.body;
  
  try {
    const licenseKey = generateLicenseKey(Number(days), customerId);
    const record = saveLicense({
      customerId,
      days: Number(days),
      licenseKey
    });
    res.json({ success: true, ...record });
  } catch (error) {
    res.status(400).json({ success: false, error: 'Invalid input' });
  }
});

app.listen(port, () => {
  console.log(`License admin tool running at http://localhost:${port}`);
}); 