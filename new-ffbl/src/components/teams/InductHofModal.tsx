// src/components/teams/InductHofModal.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Trophy, X } from 'lucide-react';

export default function InductHofModal({ teamId, isOpen, onClose }: { teamId: string; isOpen: boolean; onClose: () => void }) {
  const router = useRouter();
  
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  
  const [inductionYear, setInductionYear] = useState(new Date().getFullYear());
  const [blurb, setBlurb] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debounced search hitting our global player API
  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/players?name=${encodeURIComponent(query)}`);
      if (res.ok) setResults(await res.json());
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSubmit = async () => {
    if (!selectedPlayer) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/hall-of-fame`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: selectedPlayer.id,
          inductionYear,
          blurb
        })
      });

      if (res.ok) {
        router.refresh(); // Refetch the server page!
        onClose();
        // Reset form
        setSelectedPlayer(null);
        setQuery("");
        setBlurb("");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to induct player.");
      }
    } catch (e) {
      alert("Network error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
        
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-5 text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Trophy size={20} className="text-amber-200" />
            <h2 className="font-black text-lg">Induct to Hall of Fame</h2>
          </div>
          <button onClick={onClose} className="text-amber-200 hover:text-white transition-colors"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-5">
          {!selectedPlayer ? (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Search Player</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                <input 
                  autoFocus
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2.5 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  placeholder="Type a name (e.g., Joey Votto)..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              
              {results.length > 0 && (
                <div className="mt-2 max-h-48 overflow-y-auto border border-slate-100 rounded-lg shadow-inner bg-slate-50">
                  {results.map(player => (
                    <div 
                      key={player.id} 
                      onClick={() => setSelectedPlayer(player)}
                      className="p-3 border-b border-slate-100 hover:bg-white cursor-pointer transition-colors flex justify-between items-center group"
                    >
                      <span className="font-bold text-slate-700 group-hover:text-amber-600 transition-colors">
                        {player.firstName} {player.lastName}
                      </span>
                      <span className="text-xs font-bold px-2 py-1 bg-slate-200 text-slate-500 rounded">
                        {player.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex justify-between items-center bg-amber-50 border border-amber-200 p-3 rounded-lg">
                <span className="font-black text-amber-900 text-lg">{selectedPlayer.firstName} {selectedPlayer.lastName}</span>
                <button onClick={() => setSelectedPlayer(null)} className="text-xs font-bold text-amber-600 hover:text-amber-800 underline">Change Player</button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Induction Year</label>
                <input 
                  type="number"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:border-amber-500"
                  value={inductionYear}
                  onChange={(e) => setInductionYear(parseInt(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Manager's Tribute (Plaque Text)</label>
                <textarea 
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:border-amber-500 text-sm"
                  placeholder="Share your memories of this player's impact on your franchise..."
                  value={blurb}
                  onChange={(e) => setBlurb(e.target.value)}
                />
              </div>

              <button 
                onClick={handleSubmit}
                disabled={isSubmitting || !blurb}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-black py-3 rounded-lg transition-colors flex justify-center items-center gap-2"
              >
                {isSubmitting ? "Inducting..." : "Immortalize Player"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}