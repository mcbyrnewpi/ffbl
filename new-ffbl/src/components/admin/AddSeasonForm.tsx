"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddSeasonForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch("/api/seasons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Failed to add season");

      // Reset form and refresh to show new data
      (e.target as HTMLFormElement).reset();
      router.refresh();
      alert("Season successfully added to the record books!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm max-w-2xl">
      <h2 className="text-xl font-bold text-slate-900 mb-4">Crown a New Champion</h2>
      
      {error && <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Year</label>
            <input type="number" name="year" required className="w-full p-2 border rounded-md text-slate-900" placeholder="e.g. 2025" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">FFBL Champion</label>
            <input type="text" name="ffblChampion" required className="w-full p-2 border rounded-md text-slate-900" placeholder="Team Name" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Playoff MVP</label>
            <input type="text" name="playoffMvp" required className="w-full p-2 border rounded-md text-slate-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Regular Season Best</label>
            <input type="text" name="regularSeasonBest" required className="w-full p-2 border rounded-md text-slate-900" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">AL Champ</label>
            <input type="text" name="alChamp" className="w-full p-2 border rounded-md text-slate-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">NL Champ</label>
            <input type="text" name="nlChamp" className="w-full p-2 border rounded-md text-slate-900" />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">MLB Counterparts</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">MLB MVP</label>
              <input type="text" name="mlbMvp" required className="w-full p-2 border rounded-md text-slate-900 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">MLB Cy Young</label>
              <input type="text" name="mlbCyYoung" required className="w-full p-2 border rounded-md text-slate-900 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">MLB ROY</label>
              <input type="text" name="mlbRoy" required className="w-full p-2 border rounded-md text-slate-900 text-sm" />
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button 
            type="submit" 
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-md transition-colors"
          >
            {loading ? "Saving..." : "Add to Record Books"}
          </button>
        </div>
      </form>
    </div>
  );
}