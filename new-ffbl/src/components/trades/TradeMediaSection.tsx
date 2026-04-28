// src/components/trades/TradeMediaSection.tsx
"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Bot, LineChart, Glasses, MessageSquareWarning, ChevronDown, RotateCw, Zap, Mic, AlertCircle } from 'lucide-react';

export default function TradeMediaSection({ aiAnalysis, tradeId }: { aiAnalysis: any, tradeId: string }) {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'stathead' | 'scout' | 'shockjock' | 'seinfeld'>('stathead');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const isCommish = (session?.user as any)?.role === 'ADMIN' || (session?.user as any)?.role === 'COMMISH';

  const handleForceGenerate = async (useFastModel = false) => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/ai/generate-trade-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tradeId, isManual: true, useFastModel })
      });
      
      if (res.ok) {
        window.location.reload(); 
      } else {
        alert("Failed to generate media. Check the server logs.");
      }
    } catch (error) {
      console.error("Force Generation Error:", error);
      alert("An error occurred while trying to trigger the analysis.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Full Screen Loading / Empty State
  if (!aiAnalysis) {
    return (
      <div className="bg-white rounded-xl p-8 text-center border border-slate-200 flex flex-col items-center gap-4 mb-8 shadow-sm animate-in fade-in duration-500">
        <div className={`w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full ${isGenerating ? 'animate-spin' : ''}`}></div>
        
        <div className="space-y-1">
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
            {isGenerating ? "Writers are drafting their takes..." : "The writers are currently publishing their columns..."}
          </p>
          {!isGenerating && <p className="text-[10px] text-slate-400">Refresh the page in a few moments.</p>}
        </div>

        {isCommish && !isGenerating && (
          <div className="flex flex-col sm:flex-row justify-center gap-3 mt-4">
            <button 
              onClick={() => handleForceGenerate(false)}
              className="group flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-emerald-400 rounded-lg text-xs font-black uppercase tracking-wider transition-all shadow-lg active:scale-95 border border-slate-700"
            >
              <RotateCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
              Force Pro Analysis
            </button>
            <button 
              onClick={() => handleForceGenerate(true)}
              className="group flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg text-xs font-black uppercase tracking-wider transition-all shadow-sm active:scale-95 border border-amber-300"
            >
              <Zap size={14} className="group-hover:scale-110 transition-transform duration-300" />
              Force Fast Results
            </button>
          </div>
        )}
      </div>
    );
  }

  // Fallbacks for legacy trades that might not have the new property
  let statheadText = aiAnalysis?.theStathead || "Analysis unavailable.";
  let scoutText = aiAnalysis?.theScout || "Analysis unavailable.";
  let shockjockText = aiAnalysis?.theShockJock || "Analysis unavailable.";
  let seinfeldText = aiAnalysis?.theSeinfeld || "Analysis unavailable.";

  // Legacy JSON cleanup just in case
  if (typeof shockjockText === 'string' && shockjockText.trim().startsWith('{"theStathead"')) {
    try {
      const parsedNested = JSON.parse(shockjockText);
      shockjockText = parsedNested.theShockJock || shockjockText;
    } catch (e) {}
  }

  // 🌟 SMART DETECTION: Check if any segment failed to generate
  const isFailure = (text: string) => {
    if (!text || text === "Analysis unavailable.") return true;
    return text.includes("technical difficulties") || 
           text.includes("grabbing a hot dog") || 
           text.includes("dead air");
  };

  const hasFailures = isFailure(statheadText) || isFailure(scoutText) || isFailure(shockjockText) || isFailure(seinfeldText);

  const tabs = [
    { id: 'stathead', name: 'Stats Guy', desc: 'Advanced Analytics', icon: LineChart },
    { id: 'scout', name: 'Dynasty Guy', desc: 'Future Outlook', icon: Glasses },
    { id: 'shockjock', name: 'Family Guy', desc: 'Unfiltered Commentary', icon: MessageSquareWarning },
    { id: 'seinfeld', name: 'Seinfeld', desc: 'A Trade About Nothing', icon: Mic },
  ] as const;

  const active = tabs.find(t => t.id === activeTab)!;
  const ActiveIcon = active.icon;

  const formatMarkdown = (text?: string) => {
    if (!text || text === "Analysis unavailable.") return "Analysis unavailable.";
    let unescaped = text.replace(/\\n/g, '\n');
    return unescaped
      .replace(/([.!?])\s+(?=\*\*)/g, '$1<br /><br />')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-black text-slate-900">$1</strong>')
      .replace(/^([A-Z][A-Z\s]+):/gm, '<strong class="font-black text-slate-900">$1:</strong>')
      .replace(/\n/g, '<br />');
  };

  const contentMap = {
    stathead: formatMarkdown(statheadText),
    scout: formatMarkdown(scoutText),
    shockjock: formatMarkdown(shockjockText),
    seinfeld: formatMarkdown(seinfeldText),
  };

  const themeStyles = {
    stathead: {
      iconBg: 'bg-blue-100 text-blue-600',
      container: 'bg-white border-slate-200 shadow-sm',
      header: 'bg-slate-50 border-b border-slate-100',
      headerIcon: 'text-blue-600',
      text: 'text-slate-800'
    },
    scout: {
      iconBg: 'bg-amber-100 text-amber-700',
      container: 'bg-[#f8f9fa] bg-[url("https://www.transparenttextures.com/patterns/paper-fibers.png")] border-slate-200 shadow-sm',
      header: 'bg-white/60 border-b border-slate-200 backdrop-blur-sm',
      headerIcon: 'text-amber-700',
      text: 'text-slate-900'
    },
    shockjock: {
      iconBg: 'bg-red-100 text-red-600',
      container: 'bg-white border-slate-200 shadow-sm',
      header: 'bg-slate-50 border-b border-slate-100',
      headerIcon: 'text-red-600',
      text: 'text-slate-800'
    },
    seinfeld: {
      iconBg: 'bg-indigo-100 text-indigo-600',
      container: 'bg-white border-slate-200 shadow-sm',
      header: 'bg-slate-50 border-b border-slate-100',
      headerIcon: 'text-indigo-600',
      text: 'text-slate-800'
    }
  };

  const currentTheme = themeStyles[active.id];

  return (
    <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500 z-20 relative">
      
      {isCommish && hasFailures && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3 text-amber-800">
            <AlertCircle size={20} className="shrink-0" />
            <span className="text-sm font-bold">Some broadcast segments failed to generate.</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <button 
              onClick={() => handleForceGenerate(false)}
              disabled={isGenerating}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-emerald-400 rounded-lg text-xs font-black uppercase tracking-wider transition-all shadow-md disabled:opacity-50"
            >
              <RotateCw size={14} className={isGenerating ? "animate-spin" : ""} />
              {isGenerating ? "Broadcasting..." : "Retry Pro"}
            </button>
            <button 
              onClick={() => handleForceGenerate(true)}
              disabled={isGenerating}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-amber-100 text-amber-700 border border-amber-300 rounded-lg text-xs font-black uppercase tracking-wider transition-all shadow-sm disabled:opacity-50"
            >
              <Zap size={14} />
              {isGenerating ? "Broadcasting..." : "Retry Fast"}
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-4 gap-4">
        
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 text-emerald-400 p-2 rounded-lg shadow-md shrink-0 border border-slate-700">
            <Bot size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">FFBL Media Network</h2>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Trade Reaction & Grades</p>
          </div>
        </div>

        <div className="relative w-full sm:w-64 z-50">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full bg-white border border-slate-300 hover:border-blue-400 text-slate-800 font-bold py-2.5 px-4 rounded-xl shadow-sm flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-2">
              <ActiveIcon size={16} className={currentTheme.iconBg.split(' ')[1]} />
              <span>{active.name}</span>
            </div>
            <ChevronDown size={16} className={`text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isDropdownOpen && (
            <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
          )}

          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden flex flex-col z-50 animate-in fade-in zoom-in-95 duration-200">
              {tabs.map((tab) => {
                const TabIcon = tab.icon;
                const tabTheme = themeStyles[tab.id];
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setIsDropdownOpen(false);
                    }}
                    className={`flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 border-b border-slate-100 last:border-0 ${activeTab === tab.id ? 'bg-slate-50' : ''}`}
                  >
                    <div className={`p-2 rounded-lg shrink-0 ${tabTheme.iconBg}`}>
                      <TabIcon size={16} />
                    </div>
                    <div>
                      <div className={`font-bold text-sm ${activeTab === tab.id ? 'text-blue-600' : 'text-slate-700'}`}>{tab.name}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{tab.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className={`rounded-xl border overflow-hidden transition-colors duration-300 ${currentTheme.container}`}>
        <div className={`px-5 py-4 flex items-center gap-2 ${currentTheme.header}`}>
          <ActiveIcon size={20} className={currentTheme.headerIcon} />
          
          <h3 className="font-black uppercase tracking-wider text-sm flex-grow text-slate-900">
            {active.name} <span className="opacity-60 font-medium tracking-normal capitalize ml-1 hidden sm:inline-block">— {active.desc}</span>
          </h3>
          
          {active.id === 'shockjock' && (
            <span className="text-[9px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-black tracking-widest uppercase border border-red-200">Explicit</span>
          )}
        </div>

        <div 
          className={`p-6 md:p-8 text-sm font-medium leading-relaxed ${currentTheme.text}`}
          dangerouslySetInnerHTML={{ __html: contentMap[active.id] }}
        />
      </div>
    </div>
  );
}