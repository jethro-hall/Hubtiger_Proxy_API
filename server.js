import express from 'express';
import axios from 'axios';
import cors from 'cors';
import 'dotenv/config';

const app = express();
app.use(cors());
app.use(express.json());

const HUBTIGER_BASE_URL = process.env.HUBTIGER_BASE_URL || 'https://api.hubtiger.com/v1';
const HUBTIGER_API_KEY = process.env.HUBTIGER_API_KEY;
const INTERNAL_KEY = process.env.INTERNAL_KEY;

if (!INTERNAL_KEY) {
  console.error('FATAL: INTERNAL_KEY must be set');
  process.exit(1);
}

const authCheck = (req, res, next) => {
  if (req.headers['x-internal-key'] !== INTERNAL_KEY) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }
  next();
};

const hub = axios.create({
  baseURL: HUBTIGER_BASE_URL,
  headers: { Authorization: `Bearer ${HUBTIGER_API_KEY}` }
});

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'hubtiger-proxy', ts: Date.now() });
});

const safe = (p) => p.replace(/[^a-zA-Z0-9_/.-]/g, '');

const proxy = (method, path) => async (req, res) => {
  try {
    const r = await hub.request({
      method,
      url: safe(path),
      params: method === 'get' ? req.query : undefined,
      data: method !== 'get' ? req.body : undefined
    });
    res.json({ ok: true, data: r.data });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'Hubtiger upstream error' });
  }
};

// Jobs
app.post('/jobs/search', authCheck, proxy('get', '/jobs/search'));
app.post('/job/get', authCheck, proxy('get', '/jobs'));
app.post('/job/note/add', authCheck, proxy('post', '/jobs/notes'));

// Booking
app.post('/booking/availability', authCheck, proxy('get', '/bookings/availability'));
app.post('/booking/create', authCheck, proxy('post', '/bookings'));
app.post('/booking/edit', authCheck, proxy('put', '/bookings'));

// Quotes
app.post('/quote/preview-price', authCheck, proxy('post', '/quotes/preview'));
app.post('/quote/add-line-item', authCheck, proxy('post', '/quotes/items'));
app.post('/quote/request-approval-sms', authCheck, proxy('post', '/quotes/send'));

// Products
app.post('/products/search', authCheck, proxy('get', '/products'));

const PORT = process.env.PORT || 8095;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`proxy running on ${PORT}`);
});
