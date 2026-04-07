// src/app/admin/commish/page.tsx
"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { ShieldAlert, RefreshCw, Trophy, CheckCircle, XCircle, Lock, Database } from 'lucide-react';

export default function CommishCenter() {
  const { data: session, status } = useSession();
  
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [sourceUrl, setSourceUrl] = useState("https://www.mlb.com/prospects/top100");
  
  const [isSyncingProspects, setIsSyncingProspects] = useState(false);
  const [prospectResult, setProspectResult] = useState<{ success: boolean; message: string } | null>(null);

  // 🌟 NEW STATES FOR DEEP SYNC
  const [isDeepSyncing, setIsDeepSyncing] = useState(false);
  const [deepSyncResult, setDeepSyncResult] = useState<{ success: boolean; message: string } | null>(null);

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-pulse text-slate-400 font-bold tracking-widest uppercase text-sm">
          Verifying Credentials...
        </div>
      </div>
    );
  }

  const userRole = (session?.user as any)?.role;
  const isCommishOrAdmin = userRole === 'COMMISH' || userRole === 'ADMIN';

  if (!isCommishOrAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <Lock size={32} className="text-slate-400" />
        </div>
        <h1 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">Access Denied</h1>
        <p className="text-slate-500 font-medium max-w-md mx-auto">
          This area is restricted to League Commissioners and Administrators.
        </p>
      </div>
    );
  }

  const years = Array.from({ length: currentYear - 2020 + 1 }, (_, i) => currentYear - i);

  const handleSyncProspects = async () => {
    if (!sourceUrl) return setProspectResult({ success: false, message: "Provide a valid URL." });
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
    } finally {
      setIsSyncingProspects(false);
    }
  };

  // 🌟 NEW FUNCTION TO TRIGGER THE DEEP SYNC
  const handleDeepSync = async () => {
    setIsDeepSyncing(true);
    setDeepSyncResult(null);

    try {
      const res = await fetch('/api/admin/sync-players', { method: 'POST' });
      const data = await res.json();
      setDeepSyncResult({ success: res.ok, message: res.ok ? data.message : data.error });
    } catch (err) {
      setDeepSyncResult({ success: false, message: 'A network error occurred or the request timed out.' });
    } finally {
      setIsDeepSyncing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-200">
        <div className="p-3 bg-slate-800 rounded-xl shadow-md">
          <ShieldAlert className="text-amber-400" size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Commish Center</h1>
          <p className="text-slate-500 font-medium">League administration and external data synchronization.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 🏆 MLB Pipeline Sync Tool */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
            <Trophy size={18} className="text-emerald-500" />
            <h2 className="font-bold text-slate-800">MLB Pipeline Sync</h2>
          </div>
          
          <div className="p-6 flex-grow flex flex-col">
            <p className="text-sm text-slate-600 mb-6 flex-grow">
              Scrape official Prospect rankings directly from MLB.com. 
              Paste the public URL below, select the target year, and sync!
            </p>

            <div className="mb-4">
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Source URL</label>
              <input 
                type="text" 
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                disabled={isSyncingProspects}
                className="w-full bg-slate-50 border border-slate-300 text-sm font-medium text-slate-700 rounded-lg px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-end gap-3">
              <div className="flex-grow">
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Target Year</label>
                <select 
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  disabled={isSyncingProspects}
                  className="w-full bg-slate-50 border border-slate-300 text-sm font-bold text-slate-700 rounded-lg px-3 py-2.5 outline-none focus:border-blue-500"
                >
                  {years.map(y => <option key={y} value={y}>{y} Rankings</option>)}
                </select>
              </div>

              <button
                onClick={handleSyncProspects}
                disabled={isSyncingProspects || !sourceUrl}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-2.5 px-5 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 min-w-[140px]"
              >
                {isSyncingProspects ? <><RefreshCw size={16} className="animate-spin" /> Syncing...</> : <><RefreshCw size={16} /> Run Sync</>}
              </button>
            </div>

            {prospectResult && (
              <div className={`mt-4 p-3 rounded-lg flex items-start gap-2 text-sm font-medium ${prospectResult.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                {prospectResult.success ? <CheckCircle size={18} className="shrink-0 mt-0.5" /> : <XCircle size={18} className="shrink-0 mt-0.5" />}
                <p>{prospectResult.message}</p>
              </div>
            )}
          </div>
        </div>

        {/* 🌟 NEW: Database Deep-Hydration Sync */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
            <Database size={18} className="text-blue-500" />
            <h2 className="font-bold text-slate-800">Database Deep-Hydration</h2>
          </div>
          
          <div className="p-6 flex flex-col h-full">
            <div className="flex-grow">
              <p className="text-sm text-slate-600 mb-4">
                Fetch the latest MLB JSON profiles, stats, and transaction history for all players in the database.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 mb-6">
                <strong>Note:</strong> This process runs in batches of 300 to respect MLB rate limits. It may take <strong>20-30 seconds</strong> to complete. Do not close or refresh the page while syncing.
              </div>
            </div>

            <button
              onClick={handleDeepSync}
              disabled={isDeepSyncing}
              className="w-full bg-slate-800 hover:bg-slate-900 disabled:bg-slate-400 text-white font-bold py-3 px-5 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
            >
              {isDeepSyncing ? (
                <><RefreshCw size={18} className="animate-spin" /> Rebuilding Database...</>
              ) : (
                <><Database size={18} /> Run Deep Sync</>
              )}
            </button>

            {deepSyncResult && (
              <div className={`mt-4 p-3 rounded-lg flex items-start gap-2 text-sm font-medium ${deepSyncResult.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                {deepSyncResult.success ? <CheckCircle size={18} className="shrink-0 mt-0.5" /> : <XCircle size={18} className="shrink-0 mt-0.5" />}
                <p>{deepSyncResult.message}</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}