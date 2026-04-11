"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { MILB_PARENT_MAP } from '@/lib/milb-map';
import PlayerCardModal from '@/components/players/PlayerCardModal';
// 🌟 NEW: Imports for session and actions
import { useSession } from 'next-auth/react';
import PlayerActionMenu from '@/components/teams/PlayerActionMenu';

interface Props {
  variant?: 'full' | 'icon';
}

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return 'Unknown';
  return new Date(dateString).toLocaleDateString();
};

// --- 🏗️ WRAPPER COMPONENT ---
export default function GlobalSearch(props: Props) {
  return (
    <Suspense fallback={
      <div className={props.variant === 'icon' ? "p-2 w-9 h-9" : "w-full h-10 bg-slate-900/50 rounded-lg animate-pulse"} />
    }>
      <GlobalSearchContent {...props} />
    </Suspense>
  );
}

// --- 🧠 ACTUAL SEARCH LOGIC ---
function GlobalSearchContent({ variant = 'full' }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [selectedPlayer, setSelectedPlayer] = useState<any | null>(null);
  const [modifierKey, setModifierKey] = useState('⌘');
  const [isMounted, setIsMounted] = useState(false);

  // 🌟 NEW: Get session to determine if a searched player belongs to the user
  const { data: session } = useSession();
  const myTeamId = (session?.user as any)?.teamId;

  useEffect(() => {
    setIsMounted(true);
    const isMac = navigator.userAgent.includes('Macintosh') || navigator.userAgent.includes('Mac OS') || navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad');
    setModifierKey(isMac ? '⌘' : 'Ctrl');
  }, []);

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

  // 🌟 BONUS FIX: Automatically closes search if they click a Trade link!
  useEffect(() => {
    setIsOpen(false);
    setQuery("");
  }, [pathname, searchParams]);

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

  const renderTrigger = () => {
    if (variant === 'icon') {
      return (
        <button 
          onClick={() => setIsOpen(true)}
          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Search players"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      );
    }

    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-500 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 hover:border-slate-300 hover:text-slate-700 transition-all w-full shadow-sm"
      >
        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span>Search players...</span>
        {isMounted && (
          <kbd className="ml-auto hidden lg:inline-flex h-5 items-center gap-1 rounded bg-white border border-slate-200 px-1.5 font-mono text-[10px] font-bold text-slate-400 shadow-sm">
            <span className="text-xs">{modifierKey}</span>K
          </kbd>
        )}
      </button>
    );
  };

  const renderModal = () => {
    if (!isOpen || !isMounted) return null;

    return createPortal(
      <div className="fixed inset-0 z-[99999] flex items-start justify-center pt-24 bg-slate-900/80 backdrop-blur-md px-4" onClick={() => setIsOpen(false)}>
        <div className="w-full max-w-xl bg-white rounded-xl shadow-2xl overflow-hidden ring-1 ring-slate-200" onClick={e => e.stopPropagation()}>
          <div className="p-4 border-b border-slate-100 flex items-center gap-3">
            <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              autoFocus
              className="flex-grow outline-none text-xl text-slate-800 placeholder:text-slate-300 bg-transparent"
              placeholder="Type a player's name..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <button onClick={() => setIsOpen(false)} className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded hover:bg-slate-200 hover:text-slate-600 transition-colors">
              ESC
            </button>
          </div>
          
          <div className="max-h-[450px] overflow-y-auto p-2 pb-48 bg-slate-50/50 flex flex-col">
            {results.length > 0 ? (
              <>
                {results.map(player => (
                  <div 
                    key={player.id}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-white hover:shadow-sm cursor-pointer border border-transparent hover:border-slate-200 transition-all group"
                    onClick={() => {
                      setIsOpen(false);
                      setQuery("");
                      setSelectedPlayer(player);
                    }}
                  >
                    <div className="w-12 h-12 bg-white rounded-full overflow-hidden relative shadow-sm border border-slate-200 flex-shrink-0">
                      {player.mlbId ? (
                        <Image 
                          src={`https://img.mlbstatic.com/mlb-photos/image/upload/d_people:brooks:default/w_120/v1/people/${player.mlbId}/headshot/silo/current.png`}
                          alt={player.lastName} fill className="object-cover" unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 truncate text-lg group-hover:text-blue-600 transition-colors">
                          {player.firstName} {player.lastName}
                        </span>
                        {player.isExternal && (
                          <span className="text-[9px] font-black bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                            MLB DB
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span className="font-bold text-slate-700">
                          {player.isExternal 
                            ? player.mlbRawData?.primaryPosition?.abbreviation 
                            : player.positions?.[0]?.abbrev || '??'}
                        </span>
                        <span>•</span>
                        <span className={player.team?.name ? "text-blue-600 font-semibold" : "text-emerald-600 font-medium"}>
                          {player.team?.name || 'Free Agent'}
                        </span>
                      </div>

                      {player.mlbRawData?.currentTeam?.name && (
                        <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                          <span className="font-medium text-slate-600">
                            {player.mlbRawData.currentTeam.name}
                          </span>
                          {MILB_PARENT_MAP[player.mlbRawData.currentTeam.id] && (
                            <span className="font-bold text-slate-400 ml-1">
                              ({MILB_PARENT_MAP[player.mlbRawData.currentTeam.id].parentAbbrev})
                            </span>
                          )}
                        </div>
                      )}

                      <div className="text-[10px] text-slate-400 mt-1 uppercase font-medium tracking-wide">
                        Born: {formatDate(player.isExternal ? player.mlbRawData?.birthDate : (player.birthdate || player.dob))}
                      </div>
                    </div>

                    {/* 🌟 NEW: Action Menu Container */}
                    <div 
                      className="ml-auto flex items-center gap-2 flex-shrink-0"
                      // Stop propagation so clicking the menu doesn't open the 3D card
                      onClick={(e) => e.stopPropagation()} 
                    >
                      {!player.isExternal && (
                        <div className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded border border-slate-200 group-hover:bg-white transition-colors">
                          {player.status}
                        </div>
                      )}
                      
                      {!player.isExternal && (
                        <PlayerActionMenu 
                          player={player} 
                          isMyTeam={String(player.teamId) === String(myTeamId)} 
                        />
                      )}
                    </div>

                  </div>
                ))}
                
                <div className="mt-2 pt-3 border-t border-slate-200 text-center">
                  <span className="text-xs text-slate-500 mr-2">Not seeing the right player?</span>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsOpen(false);
                      setQuery("");
                      router.push(`/players?name=${encodeURIComponent(query)}&searchMlb=true`);
                    }}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                  >
                    Search MLB Database →
                  </button>
                </div>
              </>
            ) : query.length >= 3 ? (
              <div className="p-10 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <p className="text-slate-500 font-medium mb-4">No local matches for "{query}"</p>
                <button 
                  className="bg-white border border-slate-200 shadow-sm text-blue-600 font-bold py-2 px-6 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-all" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsOpen(false);
                    setQuery("");
                    router.push(`/players?name=${encodeURIComponent(query)}&searchMlb=true`);
                  }}
                >
                  Search MLB Database
                </button>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-sm">
                Type at least 3 characters to search the local database.
              </div>
            )}
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <>
      {renderTrigger()}
      {renderModal()}
      
      {isMounted && (
        <PlayerCardModal 
          isOpen={!!selectedPlayer} 
          onClose={() => setSelectedPlayer(null)} 
          player={selectedPlayer} 
        />
      )}
    </>
  );
}