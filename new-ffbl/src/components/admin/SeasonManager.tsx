"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Trophy, Edit3, Plus, Save, Loader2 } from "lucide-react";

export default function SeasonManager() {
  const router = useRouter();
  const [seasons, setSeasons] = useState<any[]>([]);
  const [editingSeason, setEditingSeason] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const fetchSeasons = async () => {
    try {
      const res = await fetch("/api/seasons");
      const data = await res.json();
      setSeasons(data);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => { fetchSeasons(); }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    const method = editingSeason ? "PATCH" : "POST";

    try {
      const res = await fetch("/api/seasons", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setEditingSeason(null);
        (e.target as HTMLFormElement).reset();
        await fetchSeasons();
        router.refresh();
        alert(editingSeason ? "Season records updated!" : "New season crowned!");
      } else {
        const err = await res.json();
        alert(err.error || "Failed to save season.");
      }
    } catch (err) {
      alert("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-slate-300" /></div>;

  return (
    <div className="space-y-6">
      {/* Mode Selector */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Edit3 className="text-slate-400" size={20} />
          <select 
            className="bg-white border border-slate-300 rounded-md px-3 py-1.5 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => {
              const year = parseInt(e.target.value);
              setEditingSeason(seasons.find(s => s.year === year) || null);
            }}
            value={editingSeason?.year || ""}
          >
            <option value="">— Create New Season —</option>
            {seasons.map(s => <option key={s.year} value={s.year}>{s.year} Season</option>)}
          </select>
        </div>
        <div className={`text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider ${editingSeason ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
          {editingSeason ? 'Edit Mode' : 'Add Mode'}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-2 text-blue-600 font-bold border-b border-slate-100 pb-4">
          <Trophy size={18} />
          <h3>{editingSeason ? `Edit ${editingSeason.year} Records` : "New Season Details"}</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Year</label>
              <input 
                type="number" name="year" required 
                readOnly={!!editingSeason}
                defaultValue={editingSeason?.year || ""}
                className={`w-full p-2.5 border rounded-lg text-slate-900 font-bold ${editingSeason ? 'bg-slate-50 text-slate-400' : 'border-slate-200'}`} 
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">FFBL Champion</label>
              <input type="text" name="ffblChampion" required defaultValue={editingSeason?.ffblChampion || ""} className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-900" />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Playoff MVP</label>
              <input type="text" name="playoffMvp" required defaultValue={editingSeason?.playoffMvp || ""} className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-900" />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Regular Season Best</label>
              <input type="text" name="regularSeasonBest" required defaultValue={editingSeason?.regularSeasonBest || ""} className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-900" />
            </div>
          </div>

          <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">MLB Counterparts</p>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">MLB MVP</label>
              <input type="text" name="mlbMvp" required defaultValue={editingSeason?.mlbMvp || ""} className="w-full p-2 border border-slate-200 rounded-lg text-slate-900 text-sm" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">MLB Cy Young</label>
              <input type="text" name="mlbCyYoung" required defaultValue={editingSeason?.mlbCyYoung || ""} className="w-full p-2 border border-slate-200 rounded-lg text-slate-900 text-sm" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">MLB ROY</label>
              <input type="text" name="mlbRoy" required defaultValue={editingSeason?.mlbRoy || ""} className="w-full p-2 border border-slate-200 rounded-lg text-slate-900 text-sm" />
            </div>
          </div>
        </div>

        <button 
          type="submit" disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          {loading ? "Saving..." : editingSeason ? "Update Records" : "Save Season Record"}
        </button>
      </form>
    </div>
  );
}