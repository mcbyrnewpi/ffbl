// src/components/admin/StandingsManager.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, ListOrdered, Calendar } from "lucide-react";

export default function StandingsManager() {
  const router = useRouter();
  const [standings, setStandings] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Generates a list of years from 2015 to the current year + 1
  const availableYears = Array.from({ length: (new Date().getFullYear() + 1) - 2015 + 1 }, (_, i) => 2015 + i).reverse();

  useEffect(() => {
    const fetchData = async () => {
      setFetching(true);
      try {
        const [standingsRes, teamsRes] = await Promise.all([
          fetch(`/api/admin/standings?year=${selectedYear}`),
          fetch("/api/teams")
        ]);
        
        const standingsData = await standingsRes.json();
        const teamsData = await teamsRes.json();
        
        // If it's our first load, sync the dropdown to the active year from the DB
        if (fetching && standingsData.year && standingsData.year !== selectedYear) {
          setSelectedYear(standingsData.year);
        }

        const dbStandings = standingsData.standings || [];

        const mergedStandings = teamsData.map((team: any) => {
          const existing = dbStandings.find((s: any) => s.teamId === team.id);
          return {
            id: existing?.id || `temp_${team.id}`, 
            teamId: team.id,
            teamName: team.name,
            division: existing?.division || "",
            rank: existing?.rank || 0,
            wins: existing?.wins || 0,
            losses: existing?.losses || 0,
            ties: existing?.ties || 0,
            isPlayoffTeam: existing?.isPlayoffTeam || false
          };
        });

        setStandings(mergedStandings);
      } catch (err) {
        console.error("Failed to load standings", err);
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, [selectedYear]);

  const handleStandingChange = (id: string, field: string, value: any) => {
    setStandings(prev => prev.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  const handleAutoRank = () => {
    const sorted = [...standings].sort((a, b) => {
      const pctA = (Number(a.wins) + (Number(a.ties) * 0.5)) / (Number(a.wins) + Number(a.losses) + Number(a.ties) || 1);
      const pctB = (Number(b.wins) + (Number(b.ties) * 0.5)) / (Number(b.wins) + Number(b.losses) + Number(b.ties) || 1);
      return pctB - pctA; 
    });

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
      const parsedStandings = standings.map(s => ({
        ...s,
        rank: parseInt(s.rank) || 0,
        wins: parseInt(s.wins) || 0,
        losses: parseInt(s.losses) || 0,
        ties: parseInt(s.ties) || 0,
        isPlayoffTeam: Boolean(s.isPlayoffTeam)
      }));

      const res = await fetch("/api/admin/standings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ standings: parsedStandings, year: selectedYear }),
      });

      if (res.ok) {
        router.refresh();
        alert(`${selectedYear} Standings updated securely!`);
      } else {
        alert("Failed to update standings.");
      }
    } catch (err) {
      alert("An unexpected error occurred during save.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden max-w-5xl">
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
             <ListOrdered size={16} className="text-blue-600" />
          </div>
          <div>
            <h2 className="font-black text-slate-900 uppercase tracking-tight">League Standings</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Manage records and divisions for any season.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
            <div className="pl-3 pr-2 py-2 bg-slate-50 border-r border-slate-200">
              <Calendar size={14} className="text-slate-400" />
            </div>
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              disabled={fetching}
              className="py-1.5 pl-2 pr-8 text-sm font-bold text-slate-700 bg-transparent outline-none cursor-pointer disabled:opacity-50"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year} Season</option>
              ))}
            </select>
          </div>

          <button 
            type="button" 
            onClick={handleAutoRank}
            disabled={fetching}
            className="text-xs font-bold bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 px-3 py-2 rounded-lg transition-all shadow-sm disabled:opacity-50"
          >
            Auto-Rank by Win %
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto p-4 relative">
        {fetching && (
          <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-sm flex items-center justify-center">
             <Loader2 className="animate-spin text-blue-600" size={32} />
          </div>
        )}
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="px-2 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-16">Rank</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest w-48">Franchise</th>
              <th className="px-2 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest w-48">Division</th>
              <th className="px-2 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-20">Wins</th>
              <th className="px-2 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-20">Losses</th>
              <th className="px-2 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-20">Ties</th>
              <th className="px-2 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-24">Playoffs</th>
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
                    className="w-14 mx-auto p-2 bg-white border border-slate-300 rounded-lg text-center font-bold text-slate-900 focus:border-blue-500 focus:ring-2 outline-none transition-all shadow-inner"
                  />
                </td>
                <td className="px-4 py-3">
                  <span className="font-bold text-slate-900">{team.teamName}</span>
                </td>
                <td className="px-2 py-3">
                  <input 
                    type="text" 
                    placeholder="e.g. Legends"
                    value={team.division}
                    onChange={(e) => handleStandingChange(team.id, 'division', e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium text-sm text-slate-900 focus:border-blue-500 focus:ring-2 outline-none transition-all shadow-inner"
                  />
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
      <div className="p-4 border-t border-slate-100 bg-slate-50">
        <button 
          type="submit" disabled={loading || fetching}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          {loading ? "Saving..." : `Lock In ${selectedYear} Standings`}
        </button>
      </div>
    </form>
  );
}