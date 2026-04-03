// src/lib/trade-utils.ts

export async function checkNeedsCorrespondingMoves(teamId: string, tradeAssets: any[], settings: any) {
  if (!settings) return false;
  
  try {
    const res = await fetch(`/api/rosters/${teamId}`);
    if (!res.ok) throw new Error("Failed to fetch roster");
    const data = await res.json();
    const roster = Array.isArray(data) ? data : (data.players || []);

    const incomingPlayers = tradeAssets
      .filter((a: any) => a.toTeamId === teamId && a.playerId)
      .map((a: any) => a.player || a.meta);
      
    const outgoingPlayerIds = tradeAssets
      .filter((a: any) => a.fromTeamId === teamId && a.playerId)
      .map((a: any) => a.playerId);

    const getProjectedCount = (level: string, status: string = 'ACTIVE') => {
      const current = roster.filter((p: any) => p.level === level && p.status === status && !outgoingPlayerIds.includes(p.id));
      const incoming = incomingPlayers.filter((p: any) => p?.level === level && (status === 'ACTIVE' ? (p?.status === 'ACTIVE' || p?.status === 'NA') : p?.status === status));
      return current.length + incoming.length;
    };

    const getProjectedStatusCount = (status: string) => {
      const current = roster.filter((p: any) => p.status === status && !outgoingPlayerIds.includes(p.id));
      const incoming = incomingPlayers.filter((p: any) => p?.status === status);
      return current.length + incoming.length;
    };

    // Return true if ANY roster level exceeds the limit
    return (
      getProjectedCount('MLB') > settings.mlbLimit ||
      getProjectedCount('AAA') > settings.aaaLimit ||
      getProjectedCount('AA') > settings.aaLimit ||
      getProjectedCount('A') > settings.aLimit ||
      getProjectedStatusCount('IL') > settings.ilLimit ||
      getProjectedStatusCount('NA') > settings.naLimit
    );
  } catch (error) {
    console.error("Error evaluating roster limits:", error);
    return false; // Fallback to false, the backend Bouncer will catch any true violations
  }
}