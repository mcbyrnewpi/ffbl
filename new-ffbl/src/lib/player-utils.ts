export function getLatestPerformance(mlbRawData: any, isPitcher: boolean) {
  if (!mlbRawData?.stats) return null;

  const group = isPitcher ? "pitching" : "hitting";
  
  // Find the 'season' stats for the specific group
  const performanceData = mlbRawData.stats.find(
    (s: any) => s.type?.displayName === "season" && s.group?.displayName === group
  );

  if (!performanceData?.splits?.length) return null;

  // Get the most recent team/split
  const latest = performanceData.splits[performanceData.splits.length - 1];
  return {
    ...latest.stat,
    teamName: latest.team?.name,
    level: latest.level?.name
  };
}