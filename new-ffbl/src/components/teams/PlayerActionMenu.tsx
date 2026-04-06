// src/components/teams/PlayerActionMenu.tsx
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRightLeft, UserMinus, ArrowUpCircle, ArrowDownCircle, Stethoscope, Ban, Settings, ChevronDown, Lock } from 'lucide-react';

interface Props {
  player: any;
  isMyTeam: boolean;
  dropUp?: boolean; // 🌟 Included in interface
}

// 🌟 Added dropUp = false to the destructuring here
export default function PlayerActionMenu({ player, isMyTeam, dropUp = false }: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [showIl60Form, setShowIl60Form] = useState(false);
  const [retroDate, setRetroDate] = useState("");

  if (!isMyTeam) {
    return (
      <button 
        onClick={(e) => {
          e.stopPropagation();
          router.push(`/trades/build?addPlayer=${player.id}`);
        }}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white text-xs font-bold rounded-lg transition-colors border border-blue-100 shadow-sm"
      >
        <ArrowRightLeft size={14} /> Trade
      </button>
    );
  }

  const handleAction = async (payload: any) => {
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/players/${player.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) {
        const error = await res.json();
        alert(error.message || "Failed to process roster move.");
      } else {
        setIsOpen(false);
        setShowIl60Form(false);
        router.refresh(); 
      }
    } catch (err) {
      alert("Something went wrong.");
    } finally {
      setIsProcessing(false);
    }
  };

  const isIL60Locked = player.status === 'IL_60' && player.il60UnlockDate && new Date(player.il60UnlockDate) > new Date();

  return (
    <div className="relative">
      <button 
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); setShowIl60Form(false); }}
        disabled={isProcessing}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all border shadow-sm ${
          isOpen ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
        }`}
      >
        <Settings size={14} />
        {isProcessing ? 'Saving...' : 'Manage'}
        <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} />
          
          {/* 🌟 DYNAMIC POSITIONING: Swaps top for bottom based on prop */}
          <div className={`absolute right-0 w-56 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden py-1 ${
            dropUp ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}>
            
            {isIL60Locked ? (
              <>
                <div className="px-3 py-3 bg-red-50 border-b border-red-100 text-center">
                  <Lock size={16} className="text-red-600 mx-auto mb-1" />
                  <p className="text-[10px] font-black uppercase text-red-800 tracking-wider mb-2">Locked on 60-Day IL</p>
                  
                  <div className="flex flex-col gap-1 bg-white/60 rounded p-1.5 border border-red-100">
                    <p className="text-[10px] text-red-700 flex justify-between">
                      <span className="font-bold">Placed:</span> 
                      <span>{new Date(new Date(player.il60UnlockDate).getTime() - (60 * 24 * 60 * 60 * 1000)).toLocaleDateString()}</span>
                    </p>
                    <p className="text-[10px] text-red-700 flex justify-between">
                      <span className="font-bold">Eligible:</span> 
                      <span>{new Date(player.il60UnlockDate).toLocaleDateString()}</span>
                    </p>
                  </div>
                </div>
                <div className="pt-1">
                  <button onClick={() => handleAction({ teamId: null })} className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 font-bold">
                    <UserMinus size={14} /> Drop Player
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="px-3 py-1.5 text-[10px] font-black uppercase text-slate-400 tracking-wider">Level Assignment</div>
                
                {player.level !== 'MLB' && (
                  <button onClick={() => handleAction({ level: 'MLB' })} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 text-left">
                    <ArrowUpCircle size={14} className="text-green-500" /> Promote to MLB
                  </button>
                )}
                {player.level !== 'AAA' && (
                  <button onClick={() => handleAction({ level: 'AAA' })} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 text-left">
                    <ArrowDownCircle size={14} className="text-orange-500" /> Assign to AAA
                  </button>
                )}
                {player.level !== 'AA' && (
                  <button onClick={() => handleAction({ level: 'AA' })} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 text-left">
                    <ArrowDownCircle size={14} className="text-orange-500" /> Assign to AA
                  </button>
                )}
                {player.level !== 'A' && (
                  <button onClick={() => handleAction({ level: 'A' })} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 text-left">
                    <ArrowDownCircle size={14} className="text-orange-500" /> Assign to A
                  </button>
                )}

                <div className="px-3 py-1.5 text-[10px] font-black uppercase text-slate-400 tracking-wider mt-1 border-t border-slate-100">Status</div>
                
                {player.status !== 'ACTIVE' && (
                  <button onClick={() => handleAction({ status: 'ACTIVE' })} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 text-left">
                    <ArrowUpCircle size={14} className="text-blue-500" /> Set Active
                  </button>
                )}
                {player.status !== 'NA' && (
                  <button onClick={() => handleAction({ status: 'NA' })} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 text-left">
                    <Ban size={14} className="text-slate-400" /> Move to NA
                  </button>
                )}
                {player.status !== 'IL' && (
                  <button onClick={() => handleAction({ status: 'IL' })} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 text-left">
                    <Stethoscope size={14} className="text-red-500" /> Move to IL
                  </button>
                )}
                
                {player.status !== 'IL_60' && !showIl60Form && (
                  <button onClick={(e) => { e.stopPropagation(); setShowIl60Form(true); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 text-left">
                    <Stethoscope size={14} className="text-red-700" /> Move to 60-Day IL
                  </button>
                )}

                {showIl60Form && (
                  <div className="px-3 py-2 bg-red-50 border-t border-b border-red-100 mt-1">
                    <label className="text-[10px] font-bold uppercase text-red-800 mb-1 block">Retroactive Date (Optional)</label>
                    <input 
                      type="date" 
                      className="w-full text-xs p-1.5 border border-red-200 rounded mb-2 outline-none focus:border-red-400"
                      value={retroDate}
                      onChange={(e) => setRetroDate(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleAction({ status: 'IL_60', retroactiveDate: retroDate || undefined })}
                        className="flex-1 bg-red-700 text-white text-[11px] font-bold py-1.5 rounded hover:bg-red-800 transition-colors"
                      >
                        Confirm
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setShowIl60Form(false); }}
                        className="flex-1 bg-white text-slate-600 text-[11px] font-bold py-1.5 rounded border border-slate-200 hover:bg-slate-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="border-t border-slate-100 mt-1 pt-1">
                  <button onClick={() => handleAction({ teamId: null })} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 font-medium text-left">
                    <UserMinus size={14} /> Drop Player
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}