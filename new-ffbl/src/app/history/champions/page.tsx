import { prisma } from "@/lib/prisma";
import { Trophy, Medal, Star } from "lucide-react";

export default async function ChampionsHallPage() {
  // Fetch directly from the DB on the server
  const seasons = await prisma.season.findMany({
    orderBy: { year: "desc" },
  });

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">
          FFBL Champions Hall
        </h1>
        <p className="text-slate-500">The historical record of league supremacy.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {seasons.map((season) => (
          <div key={season.year} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            {/* Header: The FFBL Champion */}
            <div className="bg-amber-50 border-b border-amber-100 p-4 text-center">
              <div className="flex justify-center mb-2">
                <Trophy className="w-8 h-8 text-amber-500" />
              </div>
              <h2 className="text-3xl font-black text-slate-800">{season.year}</h2>
              <p className="text-lg font-bold text-amber-700 mt-1">{season.ffblChampion}</p>
            </div>

            {/* Body: The Awards */}
            <div className="p-5 flex-1 space-y-4 text-sm">
              <div className="space-y-2 pb-4 border-b border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium flex items-center gap-1">
                    <Medal className="w-4 h-4" /> Playoff MVP
                  </span>
                  <span className="font-bold text-slate-900">{season.playoffMvp}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Regular Season Best</span>
                  <span className="font-bold text-slate-900">{season.regularSeasonBest}</span>
                </div>
              </div>

              <div className="space-y-2 pb-4 border-b border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">AL Champ</span>
                  <span className="font-bold text-slate-900">{season.alChamp || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">NL Champ</span>
                  <span className="font-bold text-slate-900">{season.nlChamp || "N/A"}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                  <Star className="w-3 h-3 mr-1" /> MLB Counterparts
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">MVP</span>
                  <span className="font-medium text-slate-700">{season.mlbMvp}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Cy Young</span>
                  <span className="font-medium text-slate-700">{season.mlbCyYoung}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">ROY</span>
                  <span className="font-medium text-slate-700">{season.mlbRoy}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
        {seasons.length === 0 && (
          <p className="col-span-full text-center text-slate-500 py-12">No championship records found.</p>
        )}
      </div>
    </div>
  );
}