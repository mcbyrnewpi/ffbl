// src/app/draft/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Loader2, Gavel, Clock, PauseCircle, CheckCircle2, ArrowRightLeft, UserPlus, PlayCircle, RotateCcw, X } from "lucide-react";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/layout/PageHeader";
import Image from "next/image";
import { useRouter } from "next/navigation";
import DraftPickModal from "@/components/draft/DraftPickModal";

export default function DraftRoomPage() {
  const { data: session } = useSession();
  const userTeamId = (session?.user as any)?.teamId;
  const userRole = (session?.user as any)?.role;
  const isCommish = userRole === 'COMMISH' || userRole === 'ADMIN';
  
  const router = useRouter();

  const [picks, setPicks] = useState<any[]>([]);
  const [targetYear, setTargetYear] = useState<number>(new Date().getFullYear());
  const [isDraftOpen, setIsDraftOpen] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  // NEW: Trade Partner Modal State
  const [isTradePartnerModalOpen, setIsTradePartnerModalOpen] = useState(false);
  const [teams, setTeams] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/draft/picks");
      const data = await res.json();
      setPicks(data.draftPicks || []);
      setTargetYear(data.targetDraftYear);
      setIsDraftOpen(data.isDraftOpen);
    } catch (error) {
      console.error("Failed to fetch draft data", error);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const pollRate = isDraftOpen ? 15000 : 60000;
    const interval = setInterval(() => {
      fetchData();
    }, pollRate);
    return () => clearInterval(interval);
  }, [isDraftOpen]);

  const handleToggleDraftStatus = async () => {
    if (!confirm(`Are you sure you want to ${isDraftOpen ? 'PAUSE' : 'START'} the draft?`)) return;
    
    setIsTogglingStatus(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDraftOpen: !isDraftOpen }),
      });

      if (res.ok) {
        setIsDraftOpen(!isDraftOpen);
        fetchData(); 
      } else {
        alert("Failed to change draft status.");
      }
    } catch (error) {
      console.error("Status toggle error:", error);
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const handleUndoPick = async (pickId: string, playerName: string) => {
    if (!confirm(`Are you sure you want to undo the selection of ${playerName}? This will return them to the free agent pool and put the team back on the clock.`)) return;

    try {
      const res = await fetch("/api/draft/undo-pick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftPickId: pickId }),
      });

      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to undo pick.");
      }
    } catch (error) {
      console.error("Undo error:", error);
      alert("An unexpected error occurred.");
    }
  };

  // Fetch Teams for the Trade Partner Modal
  const handleTradePickClick = async () => {
    setIsTradePartnerModalOpen(true);
    if (teams.length === 0) {
      try {
        const res = await fetch("/api/teams");
        const data = await res.json();
        setTeams(data);
      } catch (e) {
        console.error("Failed to fetch teams", e);
      }
    }
  };

  if (fetching) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="flex items-center gap-3 text-slate-400 font-bold tracking-widest uppercase text-sm">
            <Loader2 className="animate-spin" size={18} /> Entering the War Room...
          </div>
        </div>
      </PageContainer>
    );
  }

  const activePick = picks.find((p) => !p.player);
  const isDraftComplete = picks.length > 0 && !activePick;
  
  const rounds = [1, 2, 3, 4, 5].map(round => ({
    roundNumber: round,
    picks: picks.filter(p => p.round === round)
  }));

  return (
    <PageContainer>
      <PageHeader 
        title={`${targetYear} FFBL Draft Room`}
        subtitle="Once the draft kicks off, keep track of the board and make your selections here."
      />

      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* 🚨 THE WAR ROOM BANNER (ACTIVE STATUS) */}
        {!isDraftOpen ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-8 shadow-sm text-center relative overflow-hidden flex flex-col items-center justify-center">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-amber-400"></div>
            <PauseCircle size={48} className="text-amber-500 mb-4" />
            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Hold your horses</h2>
            <p className="text-slate-500 font-medium mt-2 mb-6">The Commissioner has not started the draft yet</p>
            
            {isCommish && (
              <button 
                onClick={handleToggleDraftStatus}
                disabled={isTogglingStatus}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-8 rounded-xl flex items-center gap-2 transition-all shadow-md"
              >
                {isTogglingStatus ? <Loader2 className="animate-spin" size={18} /> : <PlayCircle size={18} />}
                Start The Draft
              </button>
            )}
          </div>
        ) : isDraftComplete ? (
          <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-8 shadow-sm text-center">
            <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-emerald-900 tracking-tight uppercase">The {targetYear} Draft is Complete</h2>
            <p className="text-emerald-700 font-medium mt-2">Welcome to the new season!</p>
          </div>
        ) : activePick ? (
          <div className="bg-white rounded-2xl border-2 border-blue-500 shadow-xl overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-500 animate-pulse"></div>
            <div className="p-6 sm:p-8 flex flex-col md:flex-row items-center gap-8 justify-between">
              
              <div className="flex items-center gap-6">
                <div className="hidden sm:flex w-24 h-24 bg-slate-100 rounded-full items-center justify-center border border-slate-200">
                  {activePick.currentOwner.logoUrl ? (
                    <Image src={activePick.currentOwner.logoUrl} alt="Logo" width={64} height={64} className="object-contain" />
                  ) : (
                    <span className="text-2xl font-black text-slate-300 uppercase">{activePick.currentOwner.name.substring(0, 2)}</span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                      <Clock size={12} className="animate-pulse" /> On The Clock
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Pick {activePick.pickNumber} (Round {activePick.round})
                    </span>
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">{activePick.currentOwner.name}</h2>
                  {activePick.currentOwner.id !== activePick.originalOwner.id && (
                    <p className="text-sm font-bold text-slate-500 mt-1">Acquired from {activePick.originalOwner.name}</p>
                  )}
                </div>
              </div>

              {/* Conditional UI based on user authentication status */}
              {userTeamId === activePick.currentOwner.id ? (
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
                  <button 
                    onClick={() => setIsSearchModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md"
                  >
                    <UserPlus size={18} /> Make Pick
                  </button>
                  <button 
                    onClick={handleTradePickClick}
                    className="bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-200 font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm"
                  >
                    <ArrowRightLeft size={18} /> Trade Pick
                  </button>
                </div>
              ) : userTeamId ? (
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-6 py-4 text-center shrink-0">
                  <p className="text-sm font-bold text-slate-900">Waiting on Selection...</p>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">If you want the pick, trade for the pick.</p>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-6 py-4 text-center shrink-0">
                  <p className="text-sm font-bold text-slate-900">Waiting on Selection...</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Spectator Mode</p>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* 📋 THE DRAFT BOARD GRID */}
        <div className="space-y-8">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div className="flex items-center gap-3">
              <Gavel size={20} className="text-slate-400" />
              <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Master Draft Board</h3>
            </div>
            
            {isCommish && isDraftOpen && !isDraftComplete && (
               <button 
                 onClick={handleToggleDraftStatus}
                 disabled={isTogglingStatus}
                 className="text-[10px] font-black uppercase tracking-widest bg-white border border-slate-200 text-slate-500 hover:text-amber-600 hover:border-amber-200 px-3 py-1.5 rounded-lg transition-all shadow-sm flex items-center gap-1.5"
               >
                 {isTogglingStatus ? <Loader2 className="animate-spin" size={12} /> : <PauseCircle size={12} />}
                 Pause Draft
               </button>
            )}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            {rounds.map((round) => (
              <div key={round.roundNumber} className="space-y-3">
                <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 py-1.5 px-3 rounded-lg text-center">
                  Round {round.roundNumber}
                </h4>
                
                <div className="space-y-2">
                  {round.picks.map((pick: any) => (
                    <div 
                      key={pick.id} 
                      className={`relative p-3 rounded-xl border group ${
                        activePick?.id === pick.id 
                          ? 'bg-blue-50 border-blue-300 shadow-sm' 
                          : pick.player 
                            ? 'bg-white border-slate-200 shadow-sm' 
                            : 'bg-slate-50/50 border-slate-200 border-dashed'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-black uppercase text-slate-400">{pick.pickNumber}</span>
                        <span className="text-xs font-bold text-slate-900 text-right leading-tight max-w-[120px] truncate">
                          {pick.currentOwner.name}
                        </span>
                      </div>

                      {pick.player ? (
                        <>
                          {isCommish && (
                            <button 
                              onClick={() => handleUndoPick(pick.id, `${pick.player.firstName} ${pick.player.lastName}`)}
                              className="absolute top-2 right-2 bg-white/90 border border-slate-200 p-1.5 rounded-full text-slate-400 hover:text-red-500 hover:border-red-200 shadow-sm opacity-0 group-hover:opacity-100 transition-all z-20"
                              title="Undo this pick"
                            >
                              <RotateCcw size={12} strokeWidth={3} />
                            </button>
                          )}

                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 rounded-full overflow-hidden border border-slate-200 shrink-0 relative flex items-center justify-center">
                               <span className="text-xs font-bold text-slate-300 absolute z-0">IMG</span>
                               {pick.player.mlbId && (
                                 <img 
                                    src={`https://img.mlbstatic.com/mlb-photos/image/upload/d_people:brooks:no_headshot.png/w_213,q_auto:best/v1/people/${pick.player.mlbId}/headshot/silo/current`}
                                    alt={pick.player.lastName} 
                                    className="object-cover w-full h-full relative z-10 mt-1" 
                                    onError={(e) => e.currentTarget.style.display = 'none'}
                                 />
                               )}
                            </div>
                            <div className="overflow-hidden">
                              <p className="text-sm font-bold text-slate-900 truncate pr-4">{pick.player.firstName} {pick.player.lastName}</p>
                              <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                                {pick.player.positions?.[0]?.abbrev || 'UNK'}
                              </p>
                            </div>
                          </div>
                        </>
                      ) : activePick?.id === pick.id ? (
                         <div className="text-center py-2">
                           <span className="text-xs font-bold text-blue-600 animate-pulse">On The Clock</span>
                         </div>
                      ) : (
                         <div className="text-center py-2 opacity-30">
                           <span className="text-xs font-bold text-slate-400">---</span>
                         </div>
                      )}
                    </div>
                  ))}
                  {round.picks.length === 0 && (
                     <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Picks Set</p>
                     </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      <DraftPickModal 
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        activePick={activePick}
        onPickComplete={() => {
           fetchData(); 
        }}
      />

      {/* NEW: TRADE PARTNER MODAL */}
      {isTradePartnerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center shrink-0">
              <div>
                <h2 className="font-black text-slate-900 uppercase tracking-tight">Trade Pick</h2>
                <p className="text-xs font-bold text-slate-500">Select a trade partner to open the War Room.</p>
              </div>
              <button onClick={() => setIsTradePartnerModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {teams.length === 0 ? (
                <div className="flex justify-center py-8"><Loader2 className="animate-spin text-slate-300" size={24} /></div>
              ) : (
                <div className="space-y-2">
                  {teams.filter(t => t.id !== userTeamId).map(team => (
                    <button
                      key={team.id}
                      onClick={() => router.push(`/trades/build?addPick=${activePick?.id}&partner=${team.id}`)}
                      className="w-full text-left px-4 py-3 font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 border border-transparent hover:border-blue-200 transition-colors rounded-xl flex items-center gap-3 shadow-sm bg-slate-50"
                    >
                      <div className="w-8 h-8 bg-white rounded-full overflow-hidden border border-slate-200 shrink-0 flex items-center justify-center">
                         {team.logoUrl ? (
                           <img src={team.logoUrl} alt={team.name} className="object-contain w-full h-full" />
                         ) : (
                           <span className="text-[10px] font-black text-slate-400">{team.name.substring(0,2).toUpperCase()}</span>
                         )}
                      </div>
                      {team.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}