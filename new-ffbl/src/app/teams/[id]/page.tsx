import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Shield, Lock, Unlock, User } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function TeamPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const teamId = params.id;

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      managers: true,
      players: {
        include: { positions: true },
        orderBy: [
          { level: 'desc' }, 
          { lastName: 'asc' }
        ]
      },
      // GET THE DRAFT PICKS
      currentPicks: {
      	include: {
          originalOwner: true 
        },
        orderBy: [
          { year: 'asc' },
          { round: 'asc' }
        ]
      }
    }
  });

  if (!team) notFound();

  console.log(`Team: ${team.name} | Picks Found: ${team.currentPicks?.length}`);

  // 🪣 BUCKET THE PLAYERS
  const mlbActive = team.players.filter(p => p.level === 'MLB' && p.status === 'ACTIVE');
  const minorLeaguers = team.players.filter(p => p.level !== 'MLB' && p.status === 'ACTIVE');
  
  // Pull NA out into its own list
  const naList = team.players.filter(p => p.status === 'NA');
  
  // IL is now anything that isn't ACTIVE and isn't NA
  const injuredList = team.players.filter(p => p.status !== 'ACTIVE' && p.status !== 'NA');

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto">
        
        {/* --- TEAM HEADER --- */}
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-blue-600 p-2 rounded-lg text-white">
                <Shield size={24} />
              </div>
              <h1 className="text-3xl font-black text-slate-900">{team.name}</h1>
            </div>
            {team.managers && team.managers.length > 0 && (
              <p className="text-slate-500 flex items-center gap-2 font-medium">
                <User size={16} /> Manager: {team.managers[0].name}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-3 md:gap-4">
            <StatBadge label="MLB Active" value={mlbActive.length} />
            <StatBadge label="Minors" value={minorLeaguers.length} />
            {naList.length > 0 && <StatBadge label="NA" value={naList.length} />}
            <StatBadge label="IL" value={injuredList.length} color="text-red-600 bg-red-50 border-red-200" />
          </div>
        </header>

        {/* --- ROSTER SECTIONS --- */}
        <div className="space-y-8">
          <RosterTable 
            title="MLB Active Roster" 
            players={mlbActive} 
            emptyMessage="No active MLB players." 
            headerColor="bg-slate-900"
          />
          
          <RosterTable 
            title="Minor Leagues (MiLB)" 
            players={minorLeaguers} 
            emptyMessage="No minor league players." 
            headerColor="bg-blue-900"
          />

          {/* New NA Section */}
          {naList.length > 0 && (
            <RosterTable 
              title="Not Active (NA)" 
              players={naList} 
              emptyMessage="No players with NA status." 
              headerColor="bg-slate-500"
            />
          )}
          
          {injuredList.length > 0 && (
            <RosterTable 
              title="Injured List (IL)" 
              players={injuredList} 
              emptyMessage="No players on the IL." 
              headerColor="bg-red-900"
            />
          )}

          <DraftPicksTable picks={team.currentPicks} currentTeamId={team.id} />
        </div>

      </div>
    </div>
  );
}

// 🧱 REUSABLE ROSTER TABLE COMPONENT
function RosterTable({ title, players, emptyMessage, headerColor }: any) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className={`${headerColor} px-4 md:px-6 py-3 border-b border-slate-800 flex justify-between items-center`}>
        <h2 className="text-white font-bold tracking-wide text-sm md:text-base">{title}</h2>
        <span className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-md font-bold">{players.length}</span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
            <tr>
              <th className="px-4 md:px-6 py-3 md:py-4">Player</th>
              <th className="px-4 md:px-6 py-3 md:py-4 text-right">Status/Level</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {players.map((player: any) => (
              <tr key={player.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-4 md:px-6 py-3 md:py-4">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-800">{player.firstName} {player.lastName}</span>
                    {/* 🔒 Trade Lock Emoji */}
                    {player.isTradeLocked && (
                      <span title="Trade Locked" className="text-sm select-none">🔒</span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase font-medium mt-0.5">
                    {player.positions?.map((p: any) => p.abbrev).join(' / ') || 'N/A'}
                  </div>
                </td>
                <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-[45px] flex-shrink-0 flex items-center justify-end">
                      {player.level && player.status === 'ACTIVE' && (
                        <span className="px-2 py-1 rounded text-[10px] font-black border bg-blue-50 text-blue-700 border-blue-100">
                          {player.level}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center min-w-[40px] justify-end">
                      {player.status !== 'ACTIVE' && (
                        <span className={`px-2 py-1 rounded text-[10px] font-black border ${
                          player.status === 'NA' ? 'bg-slate-500 text-white border-slate-600' : 'bg-red-50 text-red-700 border-red-100'
                        }`}>
                          {player.status.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Stats Badge Helper
function StatBadge({ label, value, color = "text-slate-700 bg-slate-100 border-slate-200" }: { label: string, value: number, color?: string }) {
  return (
    <div className={`px-4 py-2 rounded-lg border flex flex-col items-center justify-center min-w-[80px] ${color}`}>
      <span className="text-[10px] uppercase font-bold opacity-70 mb-0.5">{label}</span>
      <span className="text-lg font-black leading-none">{value}</span>
    </div>
  );
}

// 🧱 DRAFT PICKS TABLE COMPONENT
function DraftPicksTable({ picks, currentTeamId }: { picks: any[], currentTeamId: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-emerald-900 px-4 md:px-6 py-3 border-b border-slate-800 flex justify-between items-center">
        <h2 className="text-white font-bold tracking-wide text-sm md:text-base">Draft Picks</h2>
        <span className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-md font-bold">
          {picks?.length || 0}
        </span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
            <tr>
              <th className="px-4 md:px-6 py-3 md:py-4">Pick</th>
              <th className="px-4 md:px-6 py-3 md:py-4 text-right">Franchise</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {picks?.map((pick) => {
              // Compare as strings to be safe
              const isOwnPick = String(pick.originalOwnerId) === String(currentTeamId);
              
              return (
                <tr key={pick.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 md:px-6 py-3 md:py-4">
                    <div className="flex items-center gap-1.5">
                      <div className="font-bold text-slate-800">
                        {pick.year} - Round {pick.round}
                      </div>
                      {/* 🔒 Draft Pick Trade Lock Emoji */}
                      {pick.isTradeLocked && (
                        <span title="Trade Locked" className="text-sm select-none">🔒</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-3 md:py-4 text-right whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-[10px] font-black border ${
                      isOwnPick 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                        : 'bg-purple-50 text-purple-700 border-purple-100'
                    }`}>
                      {isOwnPick ? 'OWN' : `${pick.originalOwner?.name || 'Unknown'}`}
                    </span>
                  </td>
                </tr>
              );
            })}
            {(!picks || picks.length === 0) && (
              <tr>
                <td colSpan={2} className="px-6 py-8 text-center text-slate-400 italic">
                  No draft picks found for this team.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}