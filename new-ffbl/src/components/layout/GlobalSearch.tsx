"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const router = useRouter();

  // Shortcut to open: Cmd+K or Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Fetch results from our Omni-Search API
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

  if (!isOpen) return (
    <button 
      onClick={() => setIsOpen(true)}
      className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors w-full lg:w-64"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <span>Search players...</span>
      <kbd className="ml-auto hidden lg:inline-flex h-5 items-center gap-1 rounded border bg-slate-100 px-1.5 font-mono text-[10px] font-medium text-slate-500">
        <span className="text-xs">⌘</span>K
      </kbd>
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-slate-900/50 backdrop-blur-sm px-4" onClick={() => setIsOpen(false)}>
      <div className="w-full max-w-xl bg-white rounded-xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            autoFocus
            className="flex-grow outline-none text-lg text-slate-800 placeholder:text-slate-400"
            placeholder="Type player name..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button onClick={() => setIsOpen(false)} className="text-xs font-bold text-slate-400 uppercase hover:text-slate-600">Esc</button>
        </div>
        
        <div className="max-h-[400px] overflow-y-auto p-2">
          {results.length > 0 ? (
            results.map(player => (
              <div 
                key={player.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                onClick={() => {
                  setIsOpen(false);
                  router.push(`/players/${player.id}`);
                }}
              >
                <div className="w-10 h-10 bg-slate-100 rounded-full overflow-hidden relative border border-slate-100">
                  {player.mlbId && (
                    <Image 
                      src={`https://img.mlbstatic.com/mlb-photos/image/upload/d_people:brooks:default/w_120/v1/people/${player.mlbId}/headshot/silo/current.png`}
                      alt={player.lastName} fill className="object-cover" unoptimized
                    />
                  )}
                </div>
                <div className="flex-grow">
                  <div className="font-bold text-slate-900">{player.firstName} {player.lastName}</div>
                  <div className="text-xs text-slate-500">{player.team?.name || 'Free Agent'} • {player.status}</div>
                </div>
              </div>
            ))
          ) : query.length >= 3 ? (
            <div className="p-8 text-center text-slate-500">
              No local matches. <button className="text-blue-600 font-bold hover:underline" onClick={() => router.push(`/players?name=${query}&searchMlb=true`)}>Search MLB Database →</button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}