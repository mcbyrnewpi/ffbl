// src/components/dashboard/RecentTradeWidget.tsx
import { prisma } from '@/lib/prisma';
import { Bot } from 'lucide-react';
import Link from 'next/link';

export default async function RecentTradeWidget() {
  const trade = await prisma.trade.findFirst({
    where: { status: 'PROCESSED' },
    orderBy: { updatedAt: 'desc' },
    include: {
      assets: { include: { fromTeam: true } }
    }
  });

  if (!trade || !trade.aiAnalysis) return null;

  const aiData: any = trade.aiAnalysis;

  // 1. Gather all personas and filter out the failed/fallback generations
  const availableSnippets = [
    { name: 'Stats Guy', text: aiData.theStathead },
    { name: 'Dynasty Guy', text: aiData.theScout },
    { name: 'Family Guy', text: aiData.theShockJock },
    { name: 'The Comedian', text: aiData.theSeinfeld }
  ].filter(s => 
    s.text && 
    !s.text.includes("technical difficulties") && 
    !s.text.includes("grabbing a hot dog") && 
    !s.text.includes("dead air") && 
    s.text !== "Analysis unavailable."
  );

  // 2. Pick a random persona from the successful ones
  const randomSelection = availableSnippets.length > 0 
    ? availableSnippets[Math.floor(Math.random() * availableSnippets.length)]
    : { name: 'Network', text: "This deal completely shifts the balance of power in the FFBL. Let's see how it plays out." };

  const snippet = randomSelection.text;
  const personaName = randomSelection.name;

  const teamsInvolved = Array.from(new Set(trade.assets.map(a => a.fromTeam.name)));

  const formatMarkdown = (text?: string) => {
    if (!text || text === "Analysis unavailable.") return "Analysis unavailable.";
    let unescaped = text.replace(/\\n/g, '\n');
    return unescaped
      .replace(/([.!?])\s+(?=\*\*)/g, '$1<br /><br />')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-black text-slate-900">$1</strong>')
      .replace(/^([A-Z][A-Z\s]+):/gm, '<strong class="font-black text-slate-900">$1:</strong>')
      .replace(/\n/g, '<br />');
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot size={16} className="text-emerald-500" />
          <h2 className="font-black text-slate-900 uppercase tracking-tight">Trade Analysis</h2>
        </div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white border border-slate-200 px-2 py-1 rounded">
          {personaName}'s Take
        </span>
      </div>
      
      <div className="p-6">
        <div className="mb-4 border-b border-slate-100 pb-4">
          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1.5">Recent Blockbuster</p>
          <h3 className="font-bold text-lg leading-tight text-slate-900">
            {teamsInvolved.slice(0, 2).join(' & ')} {teamsInvolved.length > 2 && `& ${teamsInvolved.length - 2} others`} strike a deal
          </h3>
        </div>
        
        <div className="relative pt-2">
          <div className="absolute -left-2 top-0 text-4xl text-slate-200 font-serif leading-none">"</div>
          
          {/* Renders the beautifully parsed HTML safely */}
          <div 
            className="text-sm text-slate-600 font-medium leading-relaxed pl-5 pr-2 relative z-10"
            dangerouslySetInnerHTML={{ __html: formatMarkdown(snippet) }}
          />
        </div>
        
        <div className="mt-6">
          <Link href={`/trades/${trade.id}`} className="block w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-center text-xs font-bold text-slate-600 hover:text-slate-900 transition-all shadow-sm">
            View Full Deal Details
          </Link>
        </div>
      </div>
    </div>
  );
}