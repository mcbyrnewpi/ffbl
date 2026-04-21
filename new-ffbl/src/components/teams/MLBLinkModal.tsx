// src/components/teams/MLBLinkModal.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { X, Search, Link as LinkIcon, AlertCircle, Database } from 'lucide-react';

interface MlbLinkModalProps {
  player: any; 
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function MlbLinkModal({ player, isOpen, onClose }: MlbLinkModalProps) {
  const router = useRouter();
  
  const [query, setQuery] = useState(player ? `${player.firstName} ${player.lastName}` : '');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => setIsMounted(true), []);

  useEffect(() => {
    if (player && isOpen) {
      setQuery(`${player.firstName} ${player.lastName}`);
      setResults([]);
    }
  }, [player, isOpen]);

  useEffect(() => {
    if (!isOpen || !query) return;
    
    const searchMlb = async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/players?name=${encodeURIComponent(query)}&searchMlb=true`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.filter((p: any) => p.isExternal));
        }
      } catch (error) {
        console.error("Failed to search MLB API", error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(() => {
      if (query.length >= 3) searchMlb();
    }, 500);

    return () => clearTimeout(debounce);
  }, [query, isOpen]);

  const handleLink = async (mlbPlayer: any) => {
    setIsLinking(true);
    try {
      const res = await fetch(`/api/players/${player.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mlbId: mlbPlayer.mlbId,
          mlbRawData: mlbPlayer.mlbRawData,
        }),
      });

      if (res.ok) {
        router.refresh(); 
        onClose();
      } else {
        const errorData = await res.json();
        alert(`Failed to link: ${errorData.message || errorData.error}`);
      }
    } catch (error) {
      console.error("Link failed", error);
      alert("An unexpected error occurred while linking.");
    } finally {
      setIsLinking(false);
    }
  };

  if (!isOpen || !isMounted || !player) return null;

  const localDob = player.birthdate || player.dob;
  const formattedLocalDob = localDob ? new Date(localDob).toLocaleDateString() : 'Unknown';

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <LinkIcon size={18} className="text-blue-500" />
              Link MLB Profile
            </h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Local Player Reference Card */}
        <div className="px-4 py-3 bg-indigo-50/50 border-b border-indigo-100 flex items-start sm:items-center justify-between">
          <div className="flex items-start sm:items-center gap-3 w-full">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-500 shrink-0 mt-1 sm:mt-0">
              <Database size={18} />
            </div>
            
            <div className="flex-1">
              <div className="font-bold text-slate-800 flex flex-wrap items-center gap-2 leading-tight">
                {player.firstName} {player.lastName}
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded uppercase tracking-wider">
                  Local DB Target
                </span>
              </div>
              <div className="text-xs text-slate-500 flex flex-wrap items-center gap-1.5 mt-1">
                <span className="font-semibold text-slate-700 bg-white px-1.5 py-0.5 rounded shadow-sm border border-indigo-50/50">
                  {player.positions?.map((p: any) => p.abbrev).join(' / ') || '??'}
                </span>
                <span>{player.team?.name || 'Free Agent'} ({player.level || 'No Level'})</span>
                <span className="font-bold text-slate-800 bg-indigo-100 px-1.5 py-0.5 rounded">
                  DOB: {formattedLocalDob}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 relative bg-white shadow-sm z-10">
          <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg outline-none transition-all text-sm font-medium"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search MLB Database..."
          />
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
          {isSearching ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-blue-500 mb-4"></div>
              <p>Searching MLB records...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-3">
              {results.map((mlbPlayer) => (
                <div key={mlbPlayer.mlbId} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-blue-400 hover:shadow-md transition-all">
                  
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-12 h-12 bg-slate-100 rounded-full overflow-hidden flex-shrink-0 border border-slate-200">
                      <img 
                        src={`https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:silo:current.png/w_120/v1/people/${mlbPlayer.mlbId}/headshot/silo/current.png`}
                        alt={mlbPlayer.lastName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/images/placeholders/no-player.svg';
                        }} 
                      />
                    </div>

                    <div className="flex-grow min-w-0">
                      <div className="font-bold text-slate-900 leading-tight">{mlbPlayer.firstName} {mlbPlayer.lastName}</div>
                      {/* 🌟 FIX: Wrappable data fields with clear visual separation */}
                      <div className="text-xs text-slate-500 flex flex-wrap items-center gap-1.5 mt-1">
                        <span className="font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                          {mlbPlayer.mlbRawData?.primaryPosition?.abbreviation || '??'}
                        </span>
                        <span className="text-slate-600">
                          {mlbPlayer.mlbRawData?.currentTeam?.name || 'No Current Affiliate'}
                        </span>
                        <span className="font-bold text-slate-800 bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                          DOB: {mlbPlayer.mlbRawData?.birthDate ? new Date(mlbPlayer.mlbRawData.birthDate).toLocaleDateString() : 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleLink(mlbPlayer)}
                    disabled={isLinking}
                    className="w-full sm:w-auto flex-shrink-0 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-200 px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                  >
                    {isLinking ? 'Linking...' : 'Link Profile'}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle size={32} className="text-amber-400 mb-3" />
              <p className="text-slate-700 font-medium">No MLB matches found for "{query}"</p>
              <p className="text-sm text-slate-500 mt-1">Try searching by their exact legal name or checking spelling.</p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}