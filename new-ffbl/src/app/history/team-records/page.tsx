import { prisma } from "@/lib/prisma";
import { Medal } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Team Records | FFBL Archives",
  description: "The greatest single-week team performances in FFBL history.",
};

export const revalidate = 3600; // Cache for 1 hour

export default async function TeamRecordsPage() {
  // Fetch all TEAM records
  const records = await prisma.leagueRecord.findMany({
    where: { type: "TEAM" },
  });

  // Group ties together by stat title
  const groupedRecords = records.reduce((acc, curr) => {
    if (!acc[curr.title]) acc[curr.title] = [];
    acc[curr.title].push(curr);
    return acc;
  }, {} as Record<string, typeof records>);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 md:p-12 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-2 bg-blue-600" />
      
      <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-6">
        <Medal className="text-amber-400" size={32} />
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Team Records</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(groupedRecords).map(([title, group]) => (
          <div key={title} className="bg-slate-50 rounded-2xl border border-slate-200 p-6 relative overflow-hidden group hover:border-blue-300 transition-colors">
            
            {/* Massive decorative background number */}
            <div className="absolute -right-4 -bottom-6 text-8xl font-black text-slate-200/50 select-none pointer-events-none group-hover:text-blue-100 transition-colors">
              {group[0].value.split(' ')[0]} {/* Grab just the number if there's text like "(18 IP)" */}
            </div>

            <div className="relative z-10">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">{title}</h3>
              <div className="text-5xl font-black text-slate-900 mb-6 tracking-tighter">
                {group[0].value}
              </div>

              <div className="space-y-3">
                {group.map((record) => (
                  <div key={record.id} className="border-t border-slate-200/60 pt-3 flex flex-col">
                    <span className="font-bold text-blue-700">{record.recordHolder}</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                      {record.yearSet ? `Season: ${record.yearSet}` : "All-Time"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}