import { prisma } from "@/lib/prisma";
import { Trophy, Medal, Star } from "lucide-react";

export default async function ChampionsHallPage() {
  const seasons = await prisma.season.findMany({
    orderBy: { year: "desc" },
  });

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-12 space-y-10">
      
      {/* 🏆 EXACT MATCH TO BRAND HEADER */}
      <header className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Hall of Champions
        </h1>
        <p className="text-slate-600 mt-2 text-lg">
          The permanent record of FFBL supremacy and seasonal accolades.
        </p>
      </header>

      <div className="space-y-6">
        {seasons.map((season) => (
          <div 
            key={season.year} 
            className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row hover:border-blue-300 transition-colors cursor-default group"
          >
            {/* LEFT: The Year & Team (Slate-50 Background for subtle contrast) */}
            <div className="w-full md:w-72 bg-slate-50 border-r border-slate-200 p-8 flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{season.year}</span>
              
              <div className="h-16 w-16 bg-[#fdfaf4] border border-amber-200 rounded-full flex items-center justify-center mb-4 shadow-sm">
                <Trophy className="text-amber-500" size={28} strokeWidth={2.5} />
              </div>

              <h2 className="text-2xl font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-tight mb-4">
                {season.ffblChampion}
              </h2>
              
              {/* PREMIUM ACCENT BADGE */}
              <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-100 border border-amber-200 px-3 py-1 rounded tracking-widest shadow-sm">
                FFBL Champion
              </span>
            </div>

            {/* RIGHT: The Awards */}
            <div className="flex-1 p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
              
              {/* FFBL Honors (25% Width) */}
              <div className="lg:col-span-3 space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <Medal size={14} className="text-amber-500" /> Playoff MVP
                  </h3>
                  <p className="text-lg font-black text-slate-900 leading-tight">{season.playoffMvp}</p>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Reg. Season Best</h3>
                  <p className="text-base font-black text-slate-900 leading-tight">{season.regularSeasonBest}</p>
                </div>
              </div>

              {/* Conference Champs (25% Width) */}
              <div className="lg:col-span-3 space-y-6 lg:border-l lg:border-slate-200 lg:pl-6">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">AL Champion</h3>
                  <p className="text-base font-black text-slate-900 leading-tight">{season.alChamp || "—"}</p>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">NL Champion</h3>
                  <p className="text-base font-black text-slate-900 leading-tight">{season.nlChamp || "—"}</p>
                </div>
              </div>

              {/* MLB Stats (50% Width to prevent cramping) */}
              <div className="lg:col-span-6 bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200/60">
                   <Star size={14} className="text-blue-600" />
                   <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Individual Awards</h3>
                </div>
                
                <div className="grid grid-cols-[2.5rem_1fr] gap-y-3 items-start text-sm">
                  <span className="font-black text-blue-600 text-[10px] uppercase mt-0.5">MVP</span>
                  <span className="font-bold text-slate-900 leading-tight">{season.mlbMvp || "—"}</span>
                  
                  <span className="font-black text-blue-600 text-[10px] uppercase mt-0.5">CY</span>
                  <span className="font-bold text-slate-900 leading-tight">{season.mlbCyYoung || "—"}</span>
                  
                  <span className="font-black text-blue-600 text-[10px] uppercase mt-0.5">ROY</span>
                  <span className="font-bold text-slate-900 leading-tight">{season.mlbRoy || "—"}</span>
                </div>
              </div>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}