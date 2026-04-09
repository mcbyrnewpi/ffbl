"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function TeamTabs({ teamId }: { teamId: string }) {
  const pathname = usePathname();
  
  const tabs: any[] = [
    { name: "Active Roster", href: `/teams/${teamId}` },
    { name: "Farm System", href: `/teams/${teamId}/minors` },
    { name: "Draft Picks", href: `/teams/${teamId}/draft-picks` },
    { name: "Hall of Fame", href: `/teams/${teamId}/hall-of-fame`, isSpecial: true },
  ];

  return (
    <div className="border-b border-slate-200 mt-4">
      <nav className="-mb-px flex space-x-8">
        {tabs.map((tab) => {
          // Exact match keeps the active states from stepping on each other's toes
          const isActive = pathname === tab.href;
          
          // Let's give the Ring of Honor that special gold flair
          const activeColor = tab.isSpecial 
            ? "border-amber-500 text-amber-600" 
            : "border-blue-600 text-blue-600";
            
          const hoverColor = tab.isSpecial 
            ? "hover:text-amber-600 hover:border-amber-300" 
            : "hover:text-slate-700 hover:border-slate-300";
          
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-bold text-sm transition-colors flex items-center gap-1.5
                ${isActive 
                  ? activeColor 
                  : `border-transparent text-slate-500 ${hoverColor}`}
              `}
            >
              <span>{tab.name}</span>
              
              {/* Optional UI flair if the tab has a badge */}
              {tab.badge && (
                <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                  {tab.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}