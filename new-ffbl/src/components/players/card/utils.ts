// src/components/players/card/utils.ts

export const getAge = (birthdate: string | Date | null) => {
  if (!birthdate) return '??';
  const diff = Date.now() - new Date(birthdate).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
};

export const getTeamAbbrev = (teamName?: string) => {
  if (!teamName) return 'TOT';
  const specialCases: Record<string, string> = {
    "Tampa Bay Rays": "TB", "Seattle Mariners": "SEA", "New York Yankees": "NYY", 
    "New York Mets": "NYM", "Boston Red Sox": "BOS", "Los Angeles Dodgers": "LAD",
    "Los Angeles Angels": "LAA", "San Diego Padres": "SD", "San Francisco Giants": "SF",
    "Chicago White Sox": "CWS", "Chicago Cubs": "CHC", "Kansas City Royals": "KC",
    "Toronto Blue Jays": "TOR", "Baltimore Orioles": "BAL", "Minnesota Twins": "MIN",
    "Cleveland Guardians": "CLE", "Detroit Tigers": "DET", "Houston Astros": "HOU",
    "Oakland Athletics": "OAK", "Texas Rangers": "TEX", "Atlanta Braves": "ATL",
    "Miami Marlins": "MIA", "Washington Nationals": "WSH", "Philadelphia Phillies": "PHI",
    "Cincinnati Reds": "CIN", "Milwaukee Brewers": "MIL", "Pittsburgh Pirates": "PIT",
    "St. Louis Cardinals": "STL", "Colorado Rockies": "COL", "Arizona Diamondbacks": "ARI"
  };
  return specialCases[teamName] || teamName.substring(0, 3).toUpperCase();
};

export const getLegacyTeam = (player: any) => {
  if (!player.mlbRawData?.stats) return player.mlbRawData?.currentTeam?.name || 'Retired';
  const teamTallies: Record<string, number> = {};
  const ybyStats = player.mlbRawData.stats.filter((s: any) => s.type?.displayName === 'yearByYear');
  ybyStats.forEach((statBlock: any) => {
    if (statBlock.splits) {
      statBlock.splits.forEach((split: any) => {
        if (split.team?.name && !split.team.name.includes("All-Star")) {
          teamTallies[split.team.name] = (teamTallies[split.team.name] || 0) + 1;
        }
      });
    }
  });
  const teams = Object.keys(teamTallies);
  if (teams.length === 0) return player.mlbRawData?.currentTeam?.name || 'Retired';
  return teams.reduce((a, b) => teamTallies[a] > teamTallies[b] ? a : b);
};

export const getKBB = (stat: any) => {
  if (!stat) return '--';
  if (stat.strikeoutWalkRatio) return stat.strikeoutWalkRatio;
  if (stat.baseOnBalls > 0) return (stat.strikeOuts / stat.baseOnBalls).toFixed(2);
  if (stat.strikeOuts > 0) return 'MAX';
  return '--';
};

export const getRatePct = (part: number | undefined, total: number | undefined) => {
  if (part == null || total == null || total === 0) return '--';
  return ((part / total) * 100).toFixed(1) + '%';
};