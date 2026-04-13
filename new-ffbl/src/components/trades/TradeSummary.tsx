"use client";

import { UIAsset } from './TradeBuilder';
import TradeFlowDiagram from './TradeFlowDiagram';

interface TradeSummaryProps {
  tradeAssetsList: UIAsset[];
  involvedTeamIds: string[];
  getTeamName?: (id: string) => string;
  teamDictionary?: Record<string, string>;  
  onBack?: () => void;
  onSubmit?: () => void;
  isSubmitting?: boolean;
  title?: React.ReactNode; 
  actionButtons?: React.ReactNode; 
}

export default function TradeSummary({
  tradeAssetsList,
  involvedTeamIds,
  getTeamName,
  teamDictionary,
  onBack,
  onSubmit,
  isSubmitting = false,
  title,
  actionButtons
}: TradeSummaryProps) {
  
  // ⚾ Safe resolver that handles both Client (function) and Server (dictionary) props
  const resolveTeamName = (id: string) => {
    if (teamDictionary) return teamDictionary[id] || 'Unknown Team';
    if (getTeamName) return getTeamName(id);
    return 'Unknown Team';
  };

  return (
    <div className="max-w-5xl mx-auto py-8">
      {/* Dynamic Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          {title || "Review Trade Proposal"}
        </h1>
        {onBack && (
          <button 
            onClick={onBack}
            className="text-sm font-medium text-slate-500 hover:text-slate-800"
          >
            &larr; Back to Builder
          </button>
        )}
      </div>

      {/* TOP SECTION: React Flow Diagram */}
      <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
        <h2 className="text-lg font-bold text-slate-800 mb-6">Asset Flow</h2>
        <TradeFlowDiagram 
          tradeAssetsList={tradeAssetsList}
          involvedTeamIds={involvedTeamIds}
          getTeamName={resolveTeamName} // ⬅️ Use the new resolver here
        />
      </div>

      {/* MIDDLE SECTION: Team Receipt Cards */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Trade Summary by Team</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {involvedTeamIds.map(teamId => {
            const receivedAssets = tradeAssetsList.filter(a => a.currentZone === `trade-block-${teamId}`);
            if (receivedAssets.length === 0) return null;

            return (
              <div key={teamId} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-800 text-white px-4 py-3 font-semibold text-sm tracking-wide">
                  {resolveTeamName(teamId)} Receives: {/* ⬅️ Use the new resolver here */}
                </div>
                <div className="p-0 flex flex-col">
                  {receivedAssets.map(asset => {
                    const player = asset.meta;
                    const stats = player?.mlbRawData?.stats;
                    
                    const hitting = stats?.find((s: any) => s.type.displayName === 'season' && s.group.displayName === 'hitting')?.splits[0]?.stat;
                    const pitching = stats?.find((s: any) => s.type.displayName === 'season' && s.group.displayName === 'pitching')?.splits[0]?.stat;

                    return (
                      <div key={asset.id} className="flex justify-between items-center border-b border-slate-100 p-4 last:border-0 hover:bg-slate-50 transition-colors">
                        <div className="flex flex-col min-w-0">
                          <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                            {asset.type === 'PLAYER' ? '👤' : '🎯'} 
                            <span className="truncate">{asset.name}</span>
                          </div>
                          
                          {asset.type === 'PLAYER' && (hitting || pitching) ? (
                            <div className="text-[10px] font-bold text-blue-600 mt-0.5 tracking-tight">
                              {hitting ? (
                                <>{hitting.avg} AVG • {hitting.homeRuns} HR • {hitting.ops} OPS</>
                              ) : (
                                <>{pitching.era} ERA • {pitching.wins}-{pitching.losses} • {pitching.strikeOuts} K</>
                              )}
                            </div>
                          ) : (
                            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-1">
                              From {resolveTeamName(asset.sourceTeamId)} {/* ⬅️ Use the new resolver here */}
                            </div>
                          )}
                        </div>

                        {asset.type === 'PLAYER' ? (
                          <div className="text-right flex flex-col items-end flex-shrink-0 ml-4">
                            <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                              {player?.positions?.[0]?.abbrev || player?.mlbRawData?.primaryPosition?.abbreviation || '??'}
                            </span>
                            <span className="text-[10px] text-slate-500 mt-1 max-w-[100px] truncate">
                              {player?.mlbRawData?.currentTeam?.name || 'Free Agent'}
                            </span>
                          </div>
                        ) : (
                          <div className="text-right flex-shrink-0 ml-4">
                            <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                              Draft Asset
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* BOTTOM SECTION: CTA */}
      <div className="flex justify-end pt-4 border-t border-slate-200 gap-3">
        {actionButtons ? actionButtons : onSubmit && (
          <button 
            onClick={onSubmit}
            disabled={isSubmitting}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? 'Processing...' : 'Propose Trade'}
          </button>
        )}
      </div>
    </div>
  );
}