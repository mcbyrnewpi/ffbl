"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function TeamTabs({ teamId }: { teamId: string }) {
  const pathname = usePathname();
  
  const tabs = [
    { name: "Active Roster", href: `/teams/${teamId}` },
    { name: "Farm System", href: `/teams/${teamId}/minors` },
  ];

  return (
    <div className="border-b border-slate-200 mt-4">
      <nav className="-mb-px flex space-x-8">
        {tabs.map((tab) => {
          // Logic to see if the tab is active
          const isActive = pathname === tab.href;
          
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-bold text-sm transition-colors
                ${isActive 
                  ? "border-blue-600 text-blue-600" 
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"}
              `}
            >
              {tab.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}