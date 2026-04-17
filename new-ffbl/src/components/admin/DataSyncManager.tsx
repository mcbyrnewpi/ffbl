"use client";

import { useState } from 'react';
import { RefreshCw, Trophy, CheckCircle, XCircle, Database } from 'lucide-react';

export default function DataSyncManager() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [sourceUrl, setSourceUrl] = useState("https://www.mlb.com/prospects/top100");
  const [isSyncingProspects, setIsSyncingProspects] = useState(false);
  const [prospectResult, setProspectResult] = useState<{ success: boolean; message: string } | null>(null);
  
  const [isDeepSyncing, setIsDeepSyncing] = useState(false);
  const [deepSyncResult, setDeepSyncResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSyncProspects = async () => {
    setIsSyncingProspects(true);
    setProspectResult(null);
    try {
      const res = await fetch('/api/admin/sync-prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year: selectedYear, sourceUrl: sourceUrl }),
      });
      const data = await res.json();
      setProspectResult({ success: res.ok, message: res.ok ? data.message : data.error });
    } catch (err) {
      setProspectResult({ success: false, message: 'A network error occurred.' });
    } finally { setIsSyncingProspects(false); }
  };

  const handleDeepSync = async () => {
    setIsDeepSyncing(true);
    setDeepSyncResult(null);
    try {
      const res = await fetch('/api/admin/sync-players', { method: 'POST' });
      const data = await res.json();
      setDeepSyncResult({ success: res.ok, message: res.ok ? data.message : data.error });
    } catch (err) {
      setDeepSyncResult({ success: false, message: 'A network error occurred or the request timed out.' });
    } finally { setIsDeepSyncing(false); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* MLB Pipeline Sync */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Trophy size={20} className="text-emerald-500" />
          <h2 className="text-lg font-black text-slate-900">MLB Pipeline Sync</h2>
        </div>
        <p className="text-sm text-slate-600 mb-6">Scrape official Prospect rankings directly from MLB.com.</p>
        <div className="space-y-4">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Source URL</h3>
            <input type="text" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-sm p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Year</h3>
              <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="w-full bg-slate-50 border border-slate-200 text-sm p-3 rounded-lg font-bold">
                {[2026, 2025, 2024].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <button onClick={handleSyncProspects} disabled={isSyncingProspects} className="mt-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center gap-2 shadow-sm">
              {isSyncingProspects ? <RefreshCw className="animate-spin" size={16} /> : <RefreshCw size={16} />}
              Sync
            </button>
          </div>
        </div>
        {prospectResult && (
          <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 text-xs font-bold ${prospectResult.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
            {prospectResult.success ? <CheckCircle size={14} /> : <XCircle size={14} />} {prospectResult.message}
          </div>
        )}
      </div>

      {/* Deep Sync */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Database size={20} className="text-blue-500" />
          <h2 className="text-lg font-black text-slate-900">Database Deep-Hydration</h2>
        </div>
        <p className="text-sm text-slate-600 mb-6">Fetch latest MLB JSON profiles and stats for all players. This process respects rate limits.</p>
        <button onClick={handleDeepSync} disabled={isDeepSyncing} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-lg flex items-center justify-center gap-3 transition-colors shadow-sm">
          {isDeepSyncing ? <><RefreshCw className="animate-spin" /> Batch Processing...</> : <><Database /> Run Global Update</>}
        </button>
        {deepSyncResult && (
          <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 text-xs font-bold ${deepSyncResult.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
             {deepSyncResult.success ? <CheckCircle size={14} /> : <XCircle size={14} />} {deepSyncResult.message}
          </div>
        )}
      </div>
    </div>
  );
}