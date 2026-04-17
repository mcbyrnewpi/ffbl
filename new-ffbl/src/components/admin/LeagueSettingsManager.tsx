"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Settings, Save, Loader2, CalendarOff, Users } from "lucide-react";

export default function LeagueSettingsManager() {
  const router = useRouter();
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        
        // Format the ISO date for the datetime-local input
        if (data.tradeDeadline) {
          data.tradeDeadline = new Date(data.tradeDeadline).toISOString().slice(0, 16);
        }
        
        setSettings(data);
      } finally {
        setFetching(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    // Convert the checkbox to a proper boolean
    const payload = {
      ...data,
      enforceRosterLimits: data.enforceRosterLimits === "on",
    };

    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.refresh();
        alert("League Settings successfully updated!");
      } else {
        alert("Failed to save settings.");
      }
    } catch (err) {
      alert("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-slate-300" /></div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      
      {/* SECTION: Trade Deadline */}
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
            defaultValue={settings?.tradeDeadline || ""}
            className="w-full max-w-md p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
      </div>

      {/* SECTION: Roster Limits */}
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
              defaultChecked={settings?.enforceRosterLimits}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
            <span className="text-xs font-black uppercase text-slate-500 tracking-widest">Enforce Limits on Trades</span>
          </label>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "MLB Limit", name: "mlbLimit", val: settings?.mlbLimit },
              { label: "AAA Limit", name: "aaaLimit", val: settings?.aaaLimit },
              { label: "AA Limit", name: "aaLimit", val: settings?.aaLimit },
              { label: "A Limit", name: "aLimit", val: settings?.aLimit },
            ].map(limit => (
              <div key={limit.name} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5">{limit.label}</label>
                <input type="number" name={limit.name} defaultValue={limit.val} required className="w-full p-2 border border-slate-200 rounded-lg text-slate-900 font-bold" />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100 max-w-sm">
             <div className="bg-red-50 p-3 rounded-xl border border-red-100">
                <label className="block text-[10px] font-black uppercase text-red-500 tracking-widest mb-1.5">IL Limit</label>
                <input type="number" name="ilLimit" defaultValue={settings?.ilLimit} required className="w-full p-2 border border-red-200 rounded-lg text-red-900 font-bold bg-white" />
              </div>
              <div className="bg-slate-100 p-3 rounded-xl border border-slate-200">
                <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1.5">NA Limit</label>
                <input type="number" name="naLimit" defaultValue={settings?.naLimit} required className="w-full p-2 border border-slate-300 rounded-lg text-slate-900 font-bold bg-white" />
              </div>
          </div>
        </div>
      </div>

      <button 
        type="submit" disabled={loading}
        className="w-full max-w-3xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20"
      >
        {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
        {loading ? "Saving Controls..." : "Lock In League Settings"}
      </button>
    </form>
  );
}