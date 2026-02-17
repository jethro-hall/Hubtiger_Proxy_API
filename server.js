import express from 'express';
import axios from 'axios';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const app = express();
app.use(cors());
app.use(express.json());
app.set('json spaces', 2);

// Handle __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const HUBTIGER_BASE_URL = 'https://api.hubtiger.com/v1'; 
const HUBTIGER_API_KEY = process.env.HUBTIGER_API_KEY;
const INTERNAL_KEY = process.env.INTERNAL_KEY || 'ride-ai-secret-2024';

// Log every request
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Serve frontend files from current directory
app.use(express.static(__dirname));

// Middleware: Security Check
const authCheck = (req, res, next) => {
  const clientKey = req.headers['x-internal-key'];
  if (!clientKey || clientKey !== INTERNAL_KEY) {
    console.warn(`[AUTH] Unauthorized access from ${req.ip}`);
    return res.status(401).json({ ok: false, error: 'Unauthorized: Missing or invalid X-Internal-Key' });
  }
  next();
};

// API: Search
app.post('/jobs/search', authCheck, async (req, res) => {
  try {
    const { firstName, lastName, email, phone, allStores = true } = req.body;
    const query = phone || email || `${firstName || ''} ${lastName || ''}`.trim();

    if (!query) {
      return res.status(400).json({ ok: false, error: 'No search parameters provided' });
    }

    const response = await axios.get(`${HUBTIGER_BASE_URL}/jobs/search`, {
      params: { q: query, all_stores: allStores },
      headers: { 'Authorization': `Bearer ${HUBTIGER_API_KEY}` }
    });

    const matches = response.data.map(job => ({
      id: job.id,
      jobCardNo: job.job_card_number,
      customerName: job.customer ? `${job.customer.first_name} ${job.customer.last_name}` : 'Unknown',
      bike: job.bike ? `${job.bike.make} ${job.bike.model}` : 'Unknown Bike',
      status: job.status?.name || 'Unknown',
      lastUpdated: job.updated_at
    }));

    res.json({ ok: true, matches, count: matches.length });
  } catch (error) {
    console.error('[ERROR] Search Failed:', error.message);
    res.status(500).json({ ok: false, error: 'Hubtiger API search failed' });
  }
});

// API: Detail
app.get('/jobs/:id', authCheck, async (req, res) => {
  const { id } = req.params;
  try {
    const response = await axios.get(`${HUBTIGER_BASE_URL}/jobs/${id}`, {
      headers: { 'Authorization': `Bearer ${HUBTIGER_API_KEY}` }
    });
    const job = response.data;
    res.json({
      ok: true,
      data: {
        id: job.id,
        jobCardNo: job.job_card_number,
        status: job.status?.name,
        technician: job.technician?.name || 'Unassigned',
        estimatedReady: job.estimated_completion_date,
        totalCost: job.total_price,
        mechanicNotes: job.internal_notes || 'No notes found.',
        isReadyForCollection: job.status?.is_completed || false,
        bike: job.bike ? `${job.bike.make} ${job.bike.model}` : 'Unknown'
      }
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'Could not fetch job details' });
  }
});

// API: Message History (Chat History)
app.get('/jobs/:id/messages', authCheck, async (req, res) => {
  const { id } = req.params;
  try {
    const response = await axios.get(`${HUBTIGER_BASE_URL}/jobs/${id}/messages`, {
      headers: { 'Authorization': `Bearer ${HUBTIGER_API_KEY}` }
    });
    
    // Transform to a cleaner format for the AI agent
    const messages = response.data.map(m => ({
      id: m.id,
      type: m.type, // 'sms', 'email', etc.
      sender: m.sender_name || (m.is_inbound ? 'Customer' : 'Store'),
      text: m.content,
      timestamp: m.created_at,
      direction: m.is_inbound ? 'inbound' : 'outbound'
    }));

    res.json({ ok: true, messages });
  } catch (error) {
    console.error('[ERROR] Messages Failed:', error.message);
    res.status(500).json({ ok: false, error: 'Could not fetch message history' });
  }
});

// CATCH-ALL: Safe for Express 5 (no path regex)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 8095;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('---------------------------------------------');
  console.log(`🚀 RIDEAI PROXY IS LIVE AT PORT ${PORT}`);
  console.log(`🌍 DASHBOARD: http://agents.rideai.com.au:${PORT}`);
  console.log(`🔑 HUBTIGER_API_KEY: ${HUBTIGER_API_KEY ? 'CONFIGURED' : 'MISSING'}`);
  console.log('---------------------------------------------');
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} busy. Use: sudo kill -9 $(lsof -t -i:${PORT})`);
    process.exit(1);
  }
});