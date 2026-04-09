"use client";

import { useState } from 'react';
import Image from 'next/image';
import PlayerCardModal from '@/components/players/PlayerCardModal';

interface Props {
  inductee: any;
  stats: any;
}

export default function HofPlaque({ inductee, stats }: Props) {
  const [isCardOpen, setIsCardOpen] = useState(false);

  return (
    <>
      <div 
        onClick={() => setIsCardOpen(true)}
        className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col relative group cursor-pointer hover:shadow-md hover:border-amber-300 hover:-translate-y-1 transition-all duration-300"
      >
        {/* The Gold "Plaque" Header */}
        <div className="bg-gradient-to-br from-amber-400 to-amber-600 p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="w-24 h-24 bg-white rounded-full p-1 shadow-lg z-10 relative border-4 border-amber-200 group-hover:scale-105 transition-transform duration-300">
            <Image
              src={inductee.player.mlbId ? `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:brooks:no_headshot.png/w_213,q_auto:best/v1/people/${inductee.player.mlbId}/headshot/67/current` : '/images/placeholders/no-player.svg'}
              alt={`${inductee.player.firstName} ${inductee.player.lastName}`}
              fill
              className="rounded-full object-cover"
              unoptimized
            />
          </div>
          
          <div className="mt-4 z-10 text-white">
            <h3 className="text-xl font-black tracking-tight drop-shadow-md">
              {inductee.player.firstName} {inductee.player.lastName}
            </h3>
            <p className="text-amber-100 font-medium text-sm drop-shadow-sm">
              Class of {inductee.inductionYear} • {inductee.player.positions?.[0]?.abbrev || 'UNK'}
            </p>
          </div>
        </div>

        {/* The Career Stats Banner */}
        {stats ? (
          <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex justify-between text-center">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stats.s1Label}</div>
              <div className="text-sm font-black text-slate-700">{stats.s1}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stats.s2Label}</div>
              <div className="text-sm font-black text-slate-700">{stats.s2}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stats.s3Label}</div>
              <div className="text-sm font-black text-slate-700">{stats.s3}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stats.s4Label}</div>
              <div className="text-sm font-black text-slate-700">{stats.s4}</div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 text-center text-xs text-slate-400 font-medium">
            Career stats unavailable
          </div>
        )}

        {/* The Manager's Memory */}
        <div className="p-5 flex-grow">
          <div className="relative">
            <span className="text-4xl text-amber-200 absolute -top-3 -left-2 font-serif opacity-50">"</span>
            <p className="text-sm text-slate-600 italic relative z-10 pl-3 leading-relaxed">
              {inductee.blurb}
            </p>
          </div>
        </div>
      </div>

      {/* The Interactive Baseball Card */}
      {isCardOpen && (
        <PlayerCardModal 
          isOpen={isCardOpen}
          onClose={() => setIsCardOpen(false)}
          player={{ ...inductee.player, hallOfFame: [inductee] }} 
        />
      )}
    </>
  );
}