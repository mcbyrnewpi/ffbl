// src/app/admin/commish/page.tsx
"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { ShieldAlert, RefreshCw, Trophy, CheckCircle, XCircle, Lock } from 'lucide-react';

export default function CommishCenter() {
  const { data: session, status } = useSession();
  
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [sourceUrl, setSourceUrl] = useState("https://www.mlb.com/prospects/top100");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);

  // 1. Loading State
  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-pulse text-slate-400 font-bold tracking-widest uppercase text-sm">
          Verifying Credentials...
        </div>
      </div>
    );
  }

  // 2. Security Check (The Bouncer)
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
          This area is restricted to League Commissioners and Administrators. Your attempt to access this URL has been logged. (Just kidding, but seriously, turn back).
        </p>
      </div>
    );
  }

  // 3. The actual Commish UI (Only renders if authorized)
  const years = Array.from({ length: currentYear - 2020 + 1 }, (_, i) => currentYear - i);

  const handleSyncProspects = async () => {
    if (!sourceUrl) {
      setSyncResult({ success: false, message: "Please provide a valid MLB Pipeline URL." });
      return;
    }

    setIsSyncing(true);
    setSyncResult(null);

    try {
      const res = await fetch('/api/admin/sync-prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          year: selectedYear,
          sourceUrl: sourceUrl 
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSyncResult({ success: true, message: data.message });
      } else {
        setSyncResult({ success: false, message: data.error || 'Failed to sync prospects.' });
      }
    } catch (err) {
      setSyncResult({ success: false, message: 'A network error occurred.' });
    } finally {
      setIsSyncing(false);
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
            <h2 className="font-bold text-slate-800">MLB Pipeline Synchronization</h2>
          </div>
          
          <div className="p-6 flex-grow">
            <p className="text-sm text-slate-600 mb-6">
              Scrape official Prospect rankings directly from MLB.com. 
              Paste the public URL below, select the target year, and sync!
            </p>

            <div className="mb-4">
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">
                Source URL
              </label>
              <input 
                type="text" 
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                disabled={isSyncing}
                placeholder="https://www.mlb.com/prospects/top100"
                className="w-full bg-slate-50 border border-slate-300 text-sm font-medium text-slate-700 rounded-lg px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>

            <div className="flex items-end gap-3 mb-4">
              <div className="flex-grow">
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">
                  Target Year
                </label>
                <select 
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  disabled={isSyncing}
                  className="w-full bg-slate-50 border border-slate-300 text-sm font-bold text-slate-700 rounded-lg px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                >
                  {years.map(y => (
                    <option key={y} value={y}>{y} Rankings</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleSyncProspects}
                disabled={isSyncing || !sourceUrl}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-2.5 px-5 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 min-w-[140px]"
              >
                {isSyncing ? (
                  <><RefreshCw size={16} className="animate-spin" /> Syncing...</>
                ) : (
                  <><RefreshCw size={16} /> Run Sync</>
                )}
              </button>
            </div>

            {/* Status Feedback Container */}
            {syncResult && (
              <div className={`mt-4 p-3 rounded-lg flex items-start gap-2 text-sm font-medium animate-in fade-in slide-in-from-top-1 ${
                syncResult.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
              }`}>
                {syncResult.success ? <CheckCircle size={18} className="shrink-0 mt-0.5" /> : <XCircle size={18} className="shrink-0 mt-0.5" />}
                <p>{syncResult.message}</p>
              </div>
            )}
          </div>
        </div>

        {/* Placeholder for future Commish Tools */}
        <div className="bg-slate-50 rounded-2xl border border-slate-200 border-dashed flex items-center justify-center p-8 text-center">
          <div>
            <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-3">
              <ShieldAlert size={20} className="text-slate-400" />
            </div>
            <h3 className="text-slate-500 font-bold mb-1">More Tools Coming Soon</h3>
            <p className="text-xs text-slate-400">Settings, Trade Overrides, and User Management will live here.</p>
          </div>
        </div>

      </div>
    </div>
  );
}