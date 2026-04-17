"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { 
  ShieldAlert, RefreshCw, Trophy, CheckCircle, 
  XCircle, Lock, Database, History, Settings, FileText, Megaphone 
} from 'lucide-react';
import SeasonManager from '@/components/admin/SeasonManager';
import LeagueSettingsManager from '@/components/admin/LeagueSettingsManager';
import AnnouncementManager from '@/components/admin/AnnouncementManager';

type TabType = 'announcements' | 'sync' | 'history' | 'settings' | 'docs';

export default function CommishCenter() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<TabType>('announcements');
  
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [sourceUrl, setSourceUrl] = useState("https://www.mlb.com/prospects/top100");
  const [isSyncingProspects, setIsSyncingProspects] = useState(false);
  const [prospectResult, setProspectResult] = useState<{ success: boolean; message: string } | null>(null);
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
        <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Access Denied</h1>
        <p className="text-slate-500 font-medium max-w-md mx-auto text-sm">
          This area is restricted to League Commissioners and Administrators.
        </p>
      </div>
    );
  }

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

  const TabButton = ({ id, label, icon: Icon }: { id: TabType, label: string, icon: any }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-6 py-3 text-sm font-bold transition-all border-b-2 ${
        activeTab === id 
          ? 'border-blue-600 text-blue-600 bg-blue-50/50' 
          : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
      }`}
    >
      <Icon size={16} />
      {label}
    </button>
  );

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* 🏆 Brand Header */}
      <header className="flex items-center gap-4 border-b border-slate-200 pb-6 mb-8">
        <div className="p-3 bg-slate-900 rounded-xl shadow-md rotate-3">
          <ShieldAlert className="text-amber-400" size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Commish Center</h1>
          <p className="text-slate-600 mt-1 text-base">League administration, historical records, and global controls.</p>
        </div>
      </header>

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto border-b border-slate-200 mb-8 no-scrollbar">
        <TabButton id="announcements" label="Announcements" icon={Megaphone} />
        <TabButton id="settings" label="League Settings" icon={Settings} />
        <TabButton id="history" label="Hall of Records" icon={History} />
        <TabButton id="docs" label="Documents" icon={FileText} />
        <TabButton id="sync" label="Data Sync" icon={RefreshCw} />
      </div>

      {/* Tab Content Panes */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        
        {/* --- ANNOUNCEMENTS TAB --- */}
        {activeTab === 'announcements' && (
          <div className="max-w-3xl">
             <AnnouncementManager />
          </div>
        )}

        {/* --- LEAGUE SETTINGS TAB --- */}
        {activeTab === 'settings' && (
          <div className="max-w-3xl">
             <LeagueSettingsManager />
          </div>
        )}

        {/* --- HALL OF RECORDS TAB --- */}
        {activeTab === 'history' && (
          <div className="max-w-3xl">
             <SeasonManager />
          </div>
        )}

        {/* --- DOCUMENTS TAB --- */}
        {activeTab === 'docs' && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
            <FileText className="mx-auto text-slate-300 mb-4" size={48} />
            <h3 className="text-lg font-black text-slate-900">Document Editor Incoming</h3>
            <p className="text-slate-500 text-sm mt-2">Edit League History and Constitution docs here.</p>
          </div>
        )}

        {/* --- SYNC TOOLS TAB --- */}
        {activeTab === 'sync' && (
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
        )}

      </div>
    </div>
  );
}