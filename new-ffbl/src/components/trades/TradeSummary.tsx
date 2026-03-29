import { UIAsset } from './TradeBuilder';
import TradeFlowDiagram from './TradeFlowDiagram';

interface TradeSummaryProps {
  tradeAssetsList: UIAsset[];
  involvedTeamIds: string[];
  getTeamName: (id: string) => string;
  onBack?: () => void;
  onSubmit?: () => void;
  isSubmitting?: boolean;
}

export default function TradeSummary({
  tradeAssetsList,
  involvedTeamIds,
  getTeamName,
  onBack,
  onSubmit,
  isSubmitting = false
}: TradeSummaryProps) {
  return (
    <div className="max-w-5xl mx-auto py-8">
      {onBack && (
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Review Trade Proposal</h1>
          <button 
            onClick={onBack}
            className="text-sm font-medium text-slate-500 hover:text-slate-800"
          >
            ← Back to Builder
          </button>
        </div>
      )}

      {/* TOP SECTION: React Flow Diagram (Hidden on Mobile) */}
      <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
        <h2 className="text-lg font-bold text-slate-800 mb-6">Asset Flow</h2>
        <TradeFlowDiagram 
          tradeAssetsList={tradeAssetsList}
          involvedTeamIds={involvedTeamIds}
          getTeamName={getTeamName}
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
                <div className="bg-slate-800 text-white px-4 py-3 font-semibold">
                  {getTeamName(teamId)} Receives:
                </div>
                <div className="p-4 flex flex-col gap-3">
                  {receivedAssets.map(asset => (
                    <div key={asset.id} className="flex justify-between items-center border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                      <div>
                        <div className="font-medium text-slate-900">{asset.name}</div>
                        <div className="text-xs text-slate-500">From: {getTeamName(asset.sourceTeamId)}</div>
                      </div>
                      {asset.type === 'PLAYER' && (
                        <div className="text-xs text-slate-400">
                          {asset.meta?.prospectRank ? `Top 100 (#${asset.meta.prospectRank})` : 'Active Roster'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* BOTTOM SECTION: CTA */}
      {onSubmit && (
        <div className="flex justify-end pt-4 border-t border-slate-200">
          <button 
            onClick={onSubmit}
            disabled={isSubmitting}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? 'Processing...' : 'Propose Trade'}
          </button>
        </div>
      )}
    </div>
  );
}