// src/components/dashboard/DraftStatusWidget.tsx
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Timer, ArrowRight } from 'lucide-react';

export default async function DraftStatusWidget() {
  const settings = await prisma.leagueSettings.findUnique({ where: { id: 1 } });
  
  if (!settings?.isDraftOpen) return null;

  const onTheClock = await prisma.draftPick.findFirst({
    where: { playerId: null },
    orderBy: [
      { year: 'asc' },
      { round: 'asc' },
      { pickNumber: 'asc' }
    ],
    include: { currentOwner: true }
  });

  if (!onTheClock) return null;

  return (
    <div className="bg-blue-600 rounded-xl shadow-md overflow-hidden flex flex-col md:flex-row items-center justify-between mb-8 text-white relative animate-in fade-in slide-in-from-top-4 w-full">
      {/* Decorative Background Icon */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-4 opacity-[0.05] pointer-events-none">
        <Timer size={240} />
      </div>
      
      <div className="p-6 md:p-8 relative z-10 flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className="flex w-3 h-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
          </span>
          <h2 className="font-black uppercase tracking-widest text-sm text-blue-100">Live Draft is Open</h2>
        </div>
        
        <h3 className="text-3xl md:text-4xl font-black tracking-tight drop-shadow-sm flex flex-wrap items-baseline gap-2 mb-1">
          <span className="text-blue-200 text-xl font-bold opacity-80">On The Clock:</span>
          <span className="text-amber-400">{onTheClock.currentOwner.name}</span>
        </h3>
        
        <p className="text-blue-100 font-bold uppercase tracking-widest text-sm">
          {onTheClock.year} Draft • Round {onTheClock.round} • Pick {onTheClock.pickNumber}
        </p>
      </div>

      <div className="p-6 md:p-8 relative z-10 w-full md:w-auto flex justify-end bg-blue-700/20 md:bg-transparent">
        <Link href="/draft" className="inline-flex items-center justify-center gap-2 w-full md:w-auto px-8 py-4 bg-white text-blue-700 font-black tracking-wide uppercase rounded-xl shadow-lg hover:bg-blue-50 hover:scale-105 transition-all">
          Enter Draft Room <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
}