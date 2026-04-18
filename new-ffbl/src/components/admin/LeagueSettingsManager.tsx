"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, CalendarOff, Users, Trophy, Calendar } from "lucide-react";

export default function LeagueSettingsManager() {
  const router = useRouter();
  const [settings, setSettings] = useState<any>(null);
  const [standings, setStandings] = useState<any[]>([]);
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

        // Fetch standings using our new dedicated route
        const standingsRes = await fetch("/api/admin/standings");
        const standingsData = await standingsRes.json();
        let dbStandings = standingsData.standings || [];

        // Fallback only triggers if truly empty
        if (dbStandings.length === 0) {
          const teamsRes = await fetch("/api/teams");
          const teamsData = await teamsRes.json();
          dbStandings = teamsData.map((team: any, idx: number) => ({
            id: `temp_${team.id}`, 
            teamId: team.id,
            teamName: team.name,
            rank: idx + 1,
            wins: 0,
            losses: 0,
            ties: 0,
            isPlayoffTeam: false
          }));
        }
        setStandings(dbStandings);
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, []);

  const handleStandingChange = (id: string, field: string, value: any) => {
    setStandings(prev => prev.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  const handleAutoRank = () => {
    // Sort teams by Win Percentage (Highest to Lowest)
    const sorted = [...standings].sort((a, b) => {
      const pctA = (Number(a.wins) + (Number(a.ties) * 0.5)) / (Number(a.wins) + Number(a.losses) + Number(a.ties) || 1);
      const pctB = (Number(b.wins) + (Number(b.ties) * 0.5)) / (Number(b.wins) + Number(b.losses) + Number(b.ties) || 1);
      return pctB - pctA; 
    });

    // Reassign ranks 1 through 16 based on the sorted order
    const ranked = sorted.map((team, idx) => ({
      ...team,
      rank: idx + 1
    }));
    
    setStandings(ranked);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const settingsPromise = fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const parsedStandings = standings.map(s => ({
        ...s,
        rank: parseInt(s.rank) || 0,
        wins: parseInt(s.wins) || 0,
        losses: parseInt(s.losses) || 0,
        ties: parseInt(s.ties) || 0,
        isPlayoffTeam: Boolean(s.isPlayoffTeam)
      }));

      const standingsPromise = fetch("/api/admin/standings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ standings: parsedStandings }),
      });

      const [res1, res2] = await Promise.all([settingsPromise, standingsPromise]);

      if (res1.ok && res2.ok) {
        router.refresh();
        alert("League data synchronized securely!");
      } else {
        alert("Failed to sync some records.");
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
      
      {/* 📅 ACTIVE SEASON CONTROL */}
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
              <strong>Heads up:</strong> Changing this dropdown instantly rolls the league over to the selected year once saved. The standings grid above will reflect the selected year after you refresh.
            </div>
          </div>
        </div>
      </div>

      {/* 🏆 STANDINGS MANAGER SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
               <Trophy size={16} className="text-blue-600" />
            </div>
            <div>
              <h2 className="font-black text-slate-900 uppercase tracking-tight">Active Season Standings</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Edit records directly in the grid below.</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={handleAutoRank}
            className="text-xs font-bold bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 px-3 py-1.5 rounded-lg transition-all shadow-sm"
          >
            Sort & Auto-Rank
          </button>
        </div>
        
        <div className="overflow-x-auto p-4">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-2 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Rank</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Franchise</th>
                <th className="px-2 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Wins</th>
                <th className="px-2 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Losses</th>
                <th className="px-2 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Ties</th>
                <th className="px-2 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Playoffs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {standings.sort((a,b) => a.rank - b.rank).map((team) => (
                <tr key={team.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-2 py-3 text-center">
                    <input 
                      type="number" 
                      value={team.rank}
                      onChange={(e) => handleStandingChange(team.id, 'rank', e.target.value)}
                      className="w-16 mx-auto p-2 bg-white border border-slate-300 rounded-lg text-center font-bold text-slate-900 focus:border-blue-500 focus:ring-2 outline-none transition-all shadow-inner"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-slate-900">{team.teamName}</span>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <input 
                      type="number" 
                      value={team.wins}
                      onChange={(e) => handleStandingChange(team.id, 'wins', e.target.value)}
                      className="w-16 mx-auto p-2 bg-white border border-slate-300 rounded-lg text-center font-bold text-slate-900 focus:border-blue-500 focus:ring-2 outline-none transition-all shadow-inner" 
                    />
                  </td>
                  <td className="px-2 py-3 text-center">
                    <input 
                      type="number" 
                      value={team.losses}
                      onChange={(e) => handleStandingChange(team.id, 'losses', e.target.value)}
                      className="w-16 mx-auto p-2 bg-white border border-slate-300 rounded-lg text-center font-bold text-slate-900 focus:border-blue-500 focus:ring-2 outline-none transition-all shadow-inner" 
                    />
                  </td>
                  <td className="px-2 py-3 text-center">
                    <input 
                      type="number" 
                      value={team.ties}
                      onChange={(e) => handleStandingChange(team.id, 'ties', e.target.value)}
                      className="w-16 mx-auto p-2 bg-white border border-slate-300 rounded-lg text-center font-bold text-slate-900 focus:border-blue-500 focus:ring-2 outline-none transition-all shadow-inner" 
                    />
                  </td>
                  <td className="px-2 py-3 text-center">
                    <input 
                      type="checkbox"
                      checked={team.isPlayoffTeam}
                      onChange={(e) => handleStandingChange(team.id, 'isPlayoffTeam', e.target.checked)}
                      className="w-5 h-5 rounded border border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shadow-sm"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🛑 TRADE DEADLINE SECTION */}
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

      {/* 👥 ROSTER LIMITS SECTION */}
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