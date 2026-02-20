import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Terminal, 
  Database, 
  ShieldCheck, 
  Activity, 
  Search, 
  FileJson,
  Code,
  Zap,
  ChevronRight,
  Server,
  Lock,
  MessageSquareQuote
} from 'lucide-react';
import { ProjectPhase, Endpoint, HubtigerJob } from './types.ts';

const ENDPOINTS: Endpoint[] = [
  { path: '/jobs/search', method: 'POST', description: 'Find customers by phone, email, or name.', payload: '{"phone": "0400..."}' },
  { path: '/jobs/:id', method: 'GET', description: 'Get AI-optimized status for a specific job.' },
  { path: '/jobs/:id/messages', method: 'GET', description: 'Fetch communication history.' },
  { path: '/jobs', method: 'POST', description: 'Create a new workshop booking.' },
];

export default function App() {
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<HubtigerJob[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/jobs/search', { method: 'OPTIONS' })
      .then(() => setServerStatus('online'))
      .catch(() => setServerStatus('offline'));
  }, []);

  const handleTestSearch = async () => {
    setLoading(true);
    try {
      const res = await fetch('/jobs/search', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Internal-Key': 'ride-ai-secret-2024' // Default dev key
        },
        body: JSON.stringify({ phone: searchQuery })
      });
      const data = await res.json();
      if (data.ok) setResults(data.matches);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Zap className="w-5 h-5 text-white fill-current" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white uppercase tracking-widest">RideAI</h1>
              <p className="text-[10px] text-slate-500 font-mono">HUBTIGER PROXY v2.0</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-bold uppercase ${
              serverStatus === 'online' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${serverStatus === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
              Server {serverStatus}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Docs & State */}
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-tighter mb-4 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-400" /> System Architecture
            </h2>
            <div className="space-y-4">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Translates complex Hubtiger JSON into <span className="text-indigo-400">Contextual Narratives</span> for the ElevenLabs Voice Agent.
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>X-Internal-Key Auth Enabled</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <Activity className="w-4 h-4 text-indigo-500" />
                  <span>Real-time Hubtiger Sync</span>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-tighter mb-4 flex items-center gap-2">
              <Lock className="w-4 h-4 text-rose-400" /> API Endpoints
            </h2>
            <div className="space-y-2">
              {ENDPOINTS.map((ep, i) => (
                <div key={i} className="group p-3 hover:bg-slate-800/50 rounded-xl transition-all cursor-default border border-transparent hover:border-slate-700">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${ep.method === 'POST' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-indigo-900/30 text-indigo-400'}`}>
                      {ep.method}
                    </span>
                    <span className="text-[10px] font-mono text-slate-600">{ep.path}</span>
                  </div>
                  <p className="text-[11px] text-slate-400">{ep.description}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Live Test Bench */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-400" /> Live Test Bench
                </h2>
                <p className="text-xs text-slate-500">Query the proxy to see real-time Hubtiger data.</p>
              </div>
              <div className="flex items-center gap-2">
                 <button 
                  onClick={handleTestSearch}
                  disabled={loading || !searchQuery}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/10"
                >
                  {loading ? 'Searching...' : <><Search className="w-3.5 h-3.5" /> Search Proxy</>}
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="relative mb-6">
                <input 
                  type="text" 
                  placeholder="Enter Phone, Email, or Name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleTestSearch()}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-5 py-4 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-700"
                />
              </div>

              {results.length > 0 ? (
                <div className="space-y-3">
                  {results.map(job => (
                    <div key={job.id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-center justify-between group hover:border-slate-600 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                          <FileJson className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm">{job.customerName}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-indigo-400">#{job.jobCardNo}</span>
                            <span>•</span>
                            <span>{job.bike}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold uppercase px-2 py-1 rounded bg-slate-900 text-slate-400 group-hover:text-emerald-400 transition-all">
                          {job.status}
                        </span>
                        <div className="text-[9px] text-slate-600 mt-1 uppercase font-mono tracking-tighter">ID: {job.id}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-slate-950/30 rounded-2xl border border-dashed border-slate-800">
                  <div className="w-12 h-12 bg-slate-900/50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-700">
                    <Database className="w-6 h-6" />
                  </div>
                  <p className="text-slate-600 text-sm">No search performed or no results found.</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-indigo-900/10 border border-indigo-500/20 rounded-2xl p-5">
              <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-3 flex items-center gap-2">
                <MessageSquareQuote className="w-4 h-4" /> AI Persona Logic
              </h3>
              <p className="text-[11px] text-indigo-200/60 leading-relaxed italic">
                "Agent should use the 'mechanicNotes' field to explain delays, referencing the specific part that is missing rather than just saying the job is in progress."
              </p>
            </div>
            <div className="bg-emerald-900/10 border border-emerald-500/20 rounded-2xl p-5">
              <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Code className="w-4 h-4" /> Payload Contract
              </h3>
              <div className="bg-slate-950 rounded-lg p-3 font-mono text-[9px] text-emerald-400/80 border border-emerald-500/10">
                {`{ "ok": true, "context": "Ready for pickup" }`}
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-800 bg-slate-950 py-10">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-slate-600 text-[10px] font-mono uppercase tracking-[0.2em]">
            RideAI Hubtiger API Proxy System • Internal Use Only
          </p>
        </div>
      </footer>
    </div>
  );
}