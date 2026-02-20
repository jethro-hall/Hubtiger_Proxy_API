import express from 'express';
import axios from 'axios';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const app = express();
app.use(cors());
app.use(express.json());

// Resolve paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = __dirname;

// Hubtiger Config
const HUBTIGER_BASE_URL = 'https://api.hubtiger.com/v1'; 
const HUBTIGER_API_KEY = process.env.HUBTIGER_API_KEY;
const INTERNAL_KEY = process.env.INTERNAL_KEY || 'ride-ai-secret-2024';

// Middleware: Console Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// Middleware: Auth
const authCheck = (req, res, next) => {
  const clientKey = req.headers['x-internal-key'];
  if (!clientKey || clientKey !== INTERNAL_KEY) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }
  next();
};

// --- PROXY ENDPOINTS ---

app.post('/jobs/search', authCheck, async (req, res) => {
  try {
    const { phone, email, firstName, lastName } = req.body;
    const query = phone || email || `${firstName || ''} ${lastName || ''}`.trim();
    
    if (!query) return res.status(400).json({ ok: false, error: 'Query required' });

    // In a real scenario, we'd hit Hubtiger. For this boilerplate, we'll return a sample or hit the API if configured.
    if (HUBTIGER_API_KEY) {
      const response = await axios.get(`${HUBTIGER_BASE_URL}/jobs/search`, {
        params: { q: query, all_stores: true },
        headers: { 'Authorization': `Bearer ${HUBTIGER_API_KEY}` }
      });
      const matches = response.data.map(job => ({
        id: job.id,
        jobCardNo: job.job_card_number,
        customerName: job.customer ? `${job.customer.first_name} ${job.customer.last_name}` : 'Unknown',
        bike: job.bike ? `${job.bike.make} ${job.bike.model}` : 'Unknown',
        status: job.status?.name || 'Unknown'
      }));
      return res.json({ ok: true, matches });
    }

    // Mock response if no API key present for testing the UI
    res.json({ ok: true, matches: [
      { id: 12345, jobCardNo: '031-A', customerName: 'Demo Customer', bike: 'Specialized Tarmac', status: 'Awaiting Parts' }
    ]});
  } catch (error) {
    console.error('Search Error:', error.message);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// --- STATIC FILES ---

// Serve everything in the root
app.use(express.static(ROOT, {
  setHeaders: (res, filePath) => {
    // Ensure TSX files are treated as JS for the browser
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

// SPA Catch-all
app.get('*', (req, res) => {
  res.sendFile(path.join(ROOT, 'index.html'));
});

const PORT = process.env.PORT || 8095;
app.listen(PORT, '0.0.0.0', () => {
  console.log('---------------------------------------------');
  console.log(`🚀 RIDEAI PROXY HUB IS LIVE`);
  console.log(`🌍 URL: http://agents.rideai.com.au:${PORT}`);
  console.log('---------------------------------------------');
});