"use client";

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowRightLeft, Lock, CalendarOff } from 'lucide-react'; // Added CalendarOff icon
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import BaseballCard from './BaseballCard';
import AddPlayerMenu from './AddPlayerMenu';
import PlayerActionMenu from '../teams/PlayerActionMenu';

interface PlayerCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: any;
}

export default function PlayerCardModal({ isOpen, onClose, player }: PlayerCardModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isDeadlinePassed, setIsDeadlinePassed] = useState(false); // Track deadline status
  const router = useRouter();
  
  // Get the logged-in user's team context
  const { data: session } = useSession();
  const myTeamId = (session?.user as any)?.teamId;
  
  const [isAdding, setIsAdding] = useState(false);

  // Ensure we only render the portal after the component mounts on the client
  useEffect(() => {
    setMounted(true);
    
    // Fetch settings to check trade deadline
    const checkDeadline = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const settings = await res.json();
          if (settings.tradeDeadline) {
            setIsDeadlinePassed(new Date() > new Date(settings.tradeDeadline));
          }
        }
      } catch (err) {
        console.error("Failed to fetch settings for deadline check", err);
      }
    };
    
    if (isOpen) {
      checkDeadline();
    }
  }, [isOpen]);

  // Lock background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !player || !mounted) return null;

  // Handler for picking up Free Agents right from the card
  const handleAdd = async (level: string) => {
    if (!myTeamId) return;
    setIsAdding(true);
    try {
      const res = await fetch(`/api/players/${player.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId: myTeamId, status: 'ACTIVE', level }),
      });
      
      if (res.ok) {
        alert(`${player.firstName} ${player.lastName} added to your ${level} roster!`);
        router.refresh();
        onClose();
      } else {
        const error = await res.json();
        alert(error.message || "Failed to add player.");
      }
    } catch (err) {
      alert("An unexpected error occurred.");
    } finally {
      setIsAdding(false);
    }
  };

  // Only show actions if the user owns a team and the player exists in the local FFBL database
  const hasActions = myTeamId && !player.isExternal;

  return createPortal(
    <div 
      className="fixed inset-0 z-[999999] bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
      onClick={onClose} 
    >
      <div className="flex flex-col items-center justify-start min-h-screen py-12 px-4 sm:py-20">
        <div 
          className="relative w-full max-w-sm animate-in zoom-in-95 duration-300"
          onClick={(e) => e.stopPropagation()} 
        >
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute -top-12 right-0 md:-right-12 md:top-0 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full backdrop-blur-md transition-colors z-50 border border-white/20"
            title="Close"
          >
            <X size={20} />
          </button>

          {/* The 3D Baseball Card */}
          <div className="w-full drop-shadow-2xl">
            <BaseballCard player={player} />
          </div>
          
          {/* 🌟 CONTEXTUAL ACTION BAR 🌟 */}
          {hasActions && (
            <div className="mt-4 flex gap-2 w-full animate-in slide-in-from-bottom-4 duration-500 delay-150 fill-mode-both">
              
              {/* Scenario 1: Free Agent -> Claim Player */}
              {!player.teamId && player.status !== 'RETIRED' && (
                <div className="flex-1 flex flex-col justify-center bg-white rounded-xl shadow-xl p-1 border border-slate-200 [&>div]:w-full [&_button]:w-full [&_button]:py-2.5 [&_button]:flex [&_button]:justify-center [&_button]:font-bold">
                  <AddPlayerMenu isAdding={isAdding} onAdd={handleAdd} />
                </div>
              )}

              {/* Scenario 2: Rival Player -> Propose Trade (WITH DEADLINE CHECK) */}
              {player.teamId && player.teamId !== myTeamId && !player.isTradeLocked && (
                isDeadlinePassed ? (
                  <div 
                    className="flex-1 flex items-center justify-center gap-2 bg-slate-200 text-slate-400 text-sm font-bold py-3 px-4 rounded-xl shadow-inner border border-slate-300 cursor-not-allowed"
                    title="The trade deadline has passed"
                  >
                    <CalendarOff size={16} /> Deadline Passed
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      onClose();
                      router.push(`/trades/build?addPlayer=${player.id}`);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-3 px-4 rounded-xl transition-colors shadow-xl border border-blue-500"
                  >
                    <ArrowRightLeft size={16} />
                    Propose Trade
                  </button>
                )
              )}

              {/* Scenario 3: Trade Locked Indicator */}
              {player.teamId && player.teamId !== myTeamId && player.isTradeLocked && (
                <div className="flex-1 flex items-center justify-center gap-2 bg-slate-800 text-slate-400 text-sm font-bold py-3 px-4 rounded-xl shadow-xl border border-slate-700 cursor-not-allowed">
                  <Lock size={14} /> Pending Trade
                </div>
              )}

              {/* Scenario 4: User's Own Player -> Manage Options */}
              {player.teamId === myTeamId && (
                <div className="flex-1 flex flex-col justify-center bg-white rounded-xl shadow-xl p-1 border border-slate-200 [&>div]:w-full [&_button]:w-full [&_button]:py-2.5 [&_button]:flex [&_button]:justify-center [&_button]:font-bold">
                  <PlayerActionMenu player={player} isMyTeam={true} dropUp={true} />
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}