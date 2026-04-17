"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Trophy, Medal, ScrollText } from "lucide-react";

export default function HistoryLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const tabs = [
    { name: "FFBL History", href: "/history", icon: BookOpen, exact: true },
    { name: "Hall of Champions", href: "/history/champions", icon: Trophy, exact: false },
    { name: "Team Records", href: "/history/team-records", icon: Medal, exact: false },
    { name: "Player Records", href: "/history/player-records", icon: Medal, exact: false },
  ];

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* 🏆 Brand Header (Matched to Site Standard) */}
      <header className="flex items-center gap-4 border-b border-slate-200 pb-6 mb-8">
        <div className="p-3 bg-slate-900 rounded-xl shadow-md rotate-3">
          <ScrollText className="text-amber-400" size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">FFBL</h1>
          <p className="text-slate-600 mt-1 text-base">The official, unfiltered, and storied history of the Franklin Fantasy Baseball League.</p>
        </div>
      </header>

      {/* Tabs Navigation (Matched to Commish Center) */}
      <div className="flex overflow-x-auto border-b border-slate-200 mb-8 no-scrollbar">
        {tabs.map((tab) => {
          const isActive = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          
          return (
            <Link 
              key={tab.name} 
              href={tab.href}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
                isActive 
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Icon size={16} />
              {tab.name}
            </Link>
          );
        })}
      </div>

      {/* 📄 Page Content */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {children}
      </div>
    </div>
  );
}