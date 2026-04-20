// src/components/admin/LeagueSettingsManager.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, CalendarOff, Users, Calendar } from "lucide-react";

export default function LeagueSettingsManager() {
  const router = useRouter();
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const settingsRes = await fetch("/api/settings");
        const settingsData = await settingsRes.json();
        if (settingsData.tradeDeadline) {
          settingsData.tradeDeadline = new Date(settingsData.tradeDeadline).toISOString().slice(0, 16);
        }
        setSettings(settingsData);
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        router.refresh();
        alert("League settings synchronized securely!");
      } else {
        alert("Failed to sync settings.");
      }
    } catch (err) {
      alert("An unexpected error occurred during save.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-slate-300" /></div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      
      {/* 🌟 ACTIVE SEASON CONTROL */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <Calendar size={16} className="text-blue-600" />
          </div>
          <div>
            <h2 className="font-black text-slate-900 uppercase tracking-tight">Active League Season</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Defines the current operational year for standings, UI, and draft generation.</p>
          </div>
        </div>
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1 max-w-xs">
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5">Set Current Year</label>
              <select 
                value={settings?.currentSeason || new Date().getFullYear()}
                onChange={(e) => setSettings({...settings, currentSeason: parseInt(e.target.value)})}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 outline-none shadow-sm cursor-pointer"
              >
                {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(year => (
                  <option key={year} value={year}>{year} Season</option>
                ))}
              </select>
            </div>
            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium p-4 rounded-xl flex-1">
              <strong>Heads up:</strong> Changing this dropdown instantly rolls the league over to the selected year once saved.
            </div>
          </div>
        </div>
      </div>

      {/* 🌟 TRADE DEADLINE SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
          <CalendarOff size={18} className="text-blue-500" />
          <h2 className="font-black text-slate-800 uppercase tracking-tight">Trade Deadline</h2>
        </div>
        <div className="p-6">
          <p className="text-sm text-slate-500 mb-4 font-medium">
            Set the exact date and time when the trade window closes. Once passed, managers will be locked out of proposing or accepting trades. Leave blank for an open market.
          </p>
          <input 
            type="datetime-local" 
            name="tradeDeadline" 
            value={settings?.tradeDeadline || ""}
            onChange={(e) => setSettings({...settings, tradeDeadline: e.target.value})}
            className="w-full max-w-md p-3 bg-white border border-slate-200 rounded-xl text-slate-900 font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* 🌟 ROSTER LIMITS SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users size={18} className="text-blue-500" />
            <h2 className="font-black text-slate-800 uppercase tracking-tight">Roster Construction</h2>
          </div>
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              name="enforceRosterLimits" 
              checked={settings?.enforceRosterLimits || false}
              onChange={(e) => setSettings({...settings, enforceRosterLimits: e.target.checked})}
              className="w-4 h-4 text-blue-600 rounded border border-slate-300 focus:ring-blue-500 shadow-sm"
            />
            <span className="text-xs font-black uppercase text-slate-500 tracking-widest">Enforce Limits on Trades</span>
          </label>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "MLB Limit", key: "mlbLimit" },
              { label: "AAA Limit", key: "aaaLimit" },
              { label: "AA Limit", key: "aaLimit" },
              { label: "A Limit", key: "aLimit" },
            ].map(limit => (
              <div key={limit.key} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5">{limit.label}</label>
                <input 
                  type="number" 
                  value={settings?.[limit.key] || 0} 
                  onChange={(e) => setSettings({...settings, [limit.key]: parseInt(e.target.value)})}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 outline-none shadow-sm" 
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100 max-w-sm">
             <div className="bg-red-50 p-3 rounded-xl border border-red-100">
                <label className="block text-[10px] font-black uppercase text-red-500 tracking-widest mb-1.5">IL Limit</label>
                <input 
                  type="number" 
                  value={settings?.ilLimit || 0} 
                  onChange={(e) => setSettings({...settings, ilLimit: parseInt(e.target.value)})}
                  className="w-full p-2 border border-red-200 rounded-lg text-red-900 font-bold bg-white focus:ring-2 focus:ring-red-500 outline-none shadow-sm" 
                />
              </div>
              <div className="bg-slate-100 p-3 rounded-xl border border-slate-200">
                <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1.5">NA Limit</label>
                <input 
                  type="number" 
                  value={settings?.naLimit || 0} 
                  onChange={(e) => setSettings({...settings, naLimit: parseInt(e.target.value)})}
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-900 font-bold bg-white focus:ring-2 focus:ring-slate-500 outline-none shadow-sm" 
                />
              </div>
          </div>
        </div>
      </div>

      <button 
        type="submit" disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm"
      >
        {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
        {loading ? "Saving Controls..." : "Lock In League Settings"}
      </button>

    </form>
  );
}