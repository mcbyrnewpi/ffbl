import Image from 'next/image';

// We'll hardcode Votto for our UI prototype
const MOCK_HOF_DATA = [
  {
    id: "hof-1",
    inductionYear: 2026,
    blurb: "The cornerstone of our franchise. Carried us to the 2018 and 2021 championships. A true OBP god. We will never forget you, Joey.",
    player: {
      firstName: "Joey",
      lastName: "Votto",
      mlbId: 458015,
      positions: [{ abbreviation: "1B" }]
    },
    // We'll fetch this real data later, mocking it for the UI design
    careerStats: {
      avg: ".294",
      obp: ".409",
      hr: 356,
      rbi: 1144,
      hits: 2135
    }
  }
];

export default async function HallOfFamePage({ params }: { params: Promise<{ teamId: string }> }) {
  // Await the params per Next 15 rules
  const { teamId } = await params;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Area */}
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Hall of Fame</h2>
          <p className="text-sm text-slate-500 mt-1">
            Immortalizing the legends who built this franchise.
          </p>
        </div>
        {/* We'll wire this button up to NextAuth later! */}
        <button className="bg-amber-100 text-amber-800 hover:bg-amber-200 px-4 py-2 rounded-lg font-bold text-sm transition-colors border border-amber-300 shadow-sm">
          + Induct Player
        </button>
      </div>

      {/* The Hall of Fame Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_HOF_DATA.map((inductee) => (
          <div key={inductee.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col relative group">
            
            {/* The Gold "Plaque" Header */}
            <div className="bg-gradient-to-br from-amber-400 to-amber-600 p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
              {/* Subtle background texture/pattern could go here */}
              <div className="w-24 h-24 bg-white rounded-full p-1 shadow-lg z-10 relative border-4 border-amber-200">
                <Image
                  src={`https://img.mlbstatic.com/mlb-photos/image/upload/d_people:brooks:no_headshot.png/w_213,q_auto:best/v1/people/${inductee.player.mlbId}/headshot/67/current`}
                  alt={`${inductee.player.firstName} ${inductee.player.lastName}`}
                  fill
                  className="rounded-full object-cover"
                />
              </div>
              
              <div className="mt-4 z-10 text-white">
                <h3 className="text-xl font-black tracking-tight drop-shadow-md">
                  {inductee.player.firstName} {inductee.player.lastName}
                </h3>
                <p className="text-amber-100 font-medium text-sm drop-shadow-sm">
                  Class of {inductee.inductionYear} • {inductee.player.positions[0].abbreviation}
                </p>
              </div>
            </div>

            {/* The Career Stats Banner */}
            <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex justify-between text-center">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AVG</div>
                <div className="text-sm font-black text-slate-700">{inductee.careerStats.avg}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">OBP</div>
                <div className="text-sm font-black text-slate-700">{inductee.careerStats.obp}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">HR</div>
                <div className="text-sm font-black text-slate-700">{inductee.careerStats.hr}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">HITS</div>
                <div className="text-sm font-black text-slate-700">{inductee.careerStats.hits}</div>
              </div>
            </div>

            {/* The Manager's Memory */}
            <div className="p-5 flex-grow">
              <div className="relative">
                <span className="text-4xl text-amber-200 absolute -top-3 -left-2 font-serif opacity-50">"</span>
                <p className="text-sm text-slate-600 italic relative z-10 pl-3 leading-relaxed">
                  {inductee.blurb}
                </p>
              </div>
            </div>
            
          </div>
        ))}
      </div>
      
    </div>
  );
}