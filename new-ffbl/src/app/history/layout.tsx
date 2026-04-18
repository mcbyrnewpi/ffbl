// src/app/history/layout.tsx
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { BookOpen, Trophy, Medal, Scale } from "lucide-react";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/layout/PageHeader";

export default function HistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const tabs = [
    { name: "FFBL History", href: "/history", icon: BookOpen, exact: true },
    { name: "League Rules", href: "/history/rules", icon: Scale, exact: true },
    { name: "Hall of Champions", href: "/history/champions", icon: Trophy, exact: false },
    { name: "Team Records", href: "/history/team-records", icon: Medal, exact: false },
    { name: "Player Records", href: "/history/player-records", icon: Medal, exact: false },
  ];

  return (
    <PageContainer>
      <PageHeader 
        title="League Archives"
        subtitle="The history, rulebook, and record holders of the Franklin Fantasy Baseball League."
      />

      {/* The Tab Navigation */}
      <div className="flex overflow-x-auto border-b border-slate-200 mb-8 hide-scrollbar">
        {tabs.map((tab) => {
          const isActive = tab.exact
            ? pathname === tab.href
            : pathname.startsWith(tab.href);

          const Icon = tab.icon;

          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
                isActive
                  ? "border-blue-600 text-blue-600 bg-blue-50/50"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Icon size={16} className={isActive ? "text-blue-600" : "text-slate-400"} />
              {tab.name}
            </Link>
          );
        })}
      </div>

      {/* The Active Page Content (Rules, Records, etc.) */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {children}
      </div>
    </PageContainer>
  );
}