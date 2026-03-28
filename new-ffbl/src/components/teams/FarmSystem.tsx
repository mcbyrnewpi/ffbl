// src/components/teams/FarmSystem.tsx
import RosterRow from "./RosterRow";

export default function FarmSystem({ team }: { team: any }) {
  // Define our levels and map them to the team's specific affiliate data
  const levels = [
    { 
      id: 'AAA', 
      title: team.aaaAffiliateName || 'Triple-A', 
      logo: team.aaaLogoUrl,
      color: 'border-orange-500' 
    },
    { 
      id: 'AA', 
      title: team.aaAffiliateName || 'Double-A', 
      logo: team.aaLogoUrl,
      color: 'border-blue-500' 
    },
    { 
      id: 'A', 
      title: team.aAffiliateName || 'Single-A', 
      logo: team.aLogoUrl,
      color: 'border-emerald-500' 
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {levels.map((lvl) => {
        const levelPlayers = team.players.filter((p: any) => p.level === lvl.id);

        return (
          <div key={lvl.id} className={`bg-white rounded-xl shadow-sm border-t-4 ${lvl.color} overflow-hidden flex flex-col`}>
            
            {/* 🧢 Branded Affiliate Header */}
            <div className="px-4 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/30">
              {lvl.logo ? (
                <img src={lvl.logo} alt="" className="w-10 h-10 object-contain shrink-0" />
              ) : (
                <div className="w-10 h-10 bg-slate-200 rounded flex items-center justify-center text-[10px] font-black text-slate-400">
                  {lvl.id}
                </div>
              )}
              <div className="flex flex-col">
                <h3 className="text-slate-900 font-black text-xs uppercase tracking-tight leading-tight">
                  {lvl.title}
                </h3>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                  Level {lvl.id}
                </span>
              </div>
            </div>

            {/* Players Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <tbody className="divide-y divide-slate-100">
                  {levelPlayers.map((player: any) => (
                    <RosterRow key={player.id} player={player} />
                  ))}
                </tbody>
              </table>
              {levelPlayers.length === 0 && (
                <div className="px-6 py-12 text-center text-slate-400 italic text-xs">
                  Roster Empty
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}