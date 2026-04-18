// src/components/draft/DraftPickModal.tsx
"use client";

import { useState, useEffect } from "react";
import { Search, Loader2, X, CheckCircle2, Cloud } from "lucide-react";

export default function DraftPickModal({ 
  isOpen, 
  onClose, 
  activePick, 
  onPickComplete 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  activePick: any;
  onPickComplete: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- AUTO-SEARCH (DEBOUNCED) ---
  useEffect(() => {
    // If they clear the search box, clear the results instantly
    if (query.trim().length === 0) {
      setResults([]);
      return;
    }

    // Wait for the user to stop typing for 400ms before firing the API
    const debounceTimer = setTimeout(async () => {
      // Your Omni-Search requires 3+ letters to search the MLB API safely
      if (query.trim().length >= 3) {
        setIsSearching(true);
        try {
          const res = await fetch(`/api/players?name=${encodeURIComponent(query)}&unowned=true&searchMlb=true`);
          const data = await res.json();
          setResults(data);
        } catch (error) {
          console.error("Search failed", error);
        } finally {
          setIsSearching(false);
        }
      }
    }, 400);

    // Cleanup the timer if they type another key before the 400ms is up
    return () => clearTimeout(debounceTimer);
  }, [query]);

  // Prevent standard form submission if they accidentally hit Enter anyway
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleDraftPlayer = async (player: any) => {
    const msg = player.isExternal 
      ? `Drafting ${player.firstName} ${player.lastName} will import them from the MLB Database. Proceed?` 
      : `Are you sure you want to draft ${player.firstName} ${player.lastName} with the ${activePick.pickNumber} overall pick?`;
      
    if (!confirm(msg)) return;
    
    setIsSubmitting(true);
    try {
      let finalPlayerId = player.id;

      if (player.isExternal) {
        const importRes = await fetch("/api/players", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            mlbId: player.mlbId, 
            firstName: player.firstName, 
            lastName: player.lastName 
          }),
        });

        if (!importRes.ok) throw new Error("Failed to import MLB player to database.");
        const importedPlayer = await importRes.json();
        finalPlayerId = importedPlayer.id; 
      }

      const draftRes = await fetch("/api/draft/make-pick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftPickId: activePick.id, playerId: finalPlayerId }),
      });

      if (draftRes.ok) {
        onPickComplete();
        onClose();
        setQuery(""); // Clear the search bar for the next pick
      } else {
        const data = await draftRes.json();
        alert(data.error || "Failed to make pick.");
      }
    } catch (err: any) {
      alert(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- FORMAT DOB AS MM/DD/YYYY ---
  const getDob = (player: any) => {
    const rawDate = player.birthdate || player.mlbRawData?.birthDate;
    if (!rawDate) return "DOB UNK";
    
    const d = new Date(rawDate);
    // Add 1 to month (0-indexed), pad with 0 if needed
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();
    
    return `${mm}/${dd}/${yyyy}`;
  };

  if (!isOpen || !activePick) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center shrink-0">
          <div>
            <h2 className="font-black text-slate-900 uppercase tracking-tight">You Are On The Clock</h2>
            <p className="text-xs font-bold text-slate-500">With the <span className="text-blue-600">{activePick.pickNumber} overall pick</span>, you select...</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-6 shrink-0">
          <form onSubmit={handleFormSubmit} className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search local or MLB database (requires 3+ letters)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-inner"
              autoFocus
            />
          </form>
        </div>

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {isSearching ? (
             <div className="flex justify-center py-8"><Loader2 className="animate-spin text-slate-300" size={24} /></div>
          ) : results.length > 0 ? (
            <div className="space-y-2">
              {results.map((player) => (
                <div key={player.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-full overflow-hidden border border-slate-200 shrink-0 relative flex items-center justify-center">
                       <span className="text-xs font-bold text-slate-300 absolute z-0">IMG</span>
                       {player.mlbId && (
                         <img 
                            src={`https://img.mlbstatic.com/mlb-photos/image/upload/d_people:brooks:no_headshot.png/w_213,q_auto:best/v1/people/${player.mlbId}/headshot/silo/current`}
                            alt={player.lastName} 
                            className="object-cover w-full h-full relative z-10 mt-1" 
                            onError={(e) => e.currentTarget.style.display = 'none'}
                         />
                       )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-900">{player.firstName} {player.lastName}</p>
                        {player.isExternal && (
                          <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                            <Cloud size={10} /> MLB DB
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        {player.positions?.[0]?.abbrev || "UNK"} • b. {getDob(player)}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDraftPlayer(player)}
                    disabled={isSubmitting}
                    className="bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white border border-blue-200 hover:border-blue-600 px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />} Draft
                  </button>
                </div>
              ))}
            </div>
          ) : query.length >= 3 && !isSearching ? (
            <div className="text-center py-8">
              <p className="text-sm font-bold text-slate-500">No prospects found.</p>
              <p className="text-xs text-slate-400 mt-1">Check spelling or ensure they aren't already drafted.</p>
            </div>
          ) : query.length > 0 && query.length < 3 ? (
            <div className="text-center py-8">
              <p className="text-sm font-bold text-slate-400">Keep typing...</p>
            </div>
          ) : null}
        </div>

      </div>
    </div>
  );
}