import RosterTable from './RosterTable';
import PlayerCard from './PlayerCard';

export default function RosterView({ title, players, headerColor, view }: any) {
  return (
    <div className="space-y-4">

      <div className={`p-4 rounded-xl text-white ${headerColor} shadow-sm`}>
        <h2 className="text-lg font-black tracking-tight uppercase">{title}</h2>
      </div>

      {/* ⚡ This switches based on the GLOBAL prop */}
      {view === 'list' ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
           <RosterTable players={players} />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {players.map((p: any) => (
            <PlayerCard key={p.id} player={p} />
          ))}
        </div>
      )}
    </div>
  );
}