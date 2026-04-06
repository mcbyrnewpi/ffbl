// src/lib/roster-rules.ts
import { MILB_PARENT_MAP } from './milb-map';

// Helper to turn "50.1" (1 out) into 50.333 for accurate math
const parseIP = (ipString?: string | number) => {
  if (!ipString) return 0;
  const parts = String(ipString).split('.');
  const full = parseInt(parts[0]) || 0;
  const partial = parseInt(parts[1]) || 0;
  return full + (partial / 3);
};

export const checkMinorLeagueEligibility = (player: any, targetLevel: string): { isEligible: boolean; reason?: string } => {
  // 1. Basic Setup & Data Extraction
  if (!['AAA', 'AA', 'A'].includes(targetLevel)) {
    return { isEligible: true }; // MLB roster has no age/stat caps
  }

  const raw = player.mlbRawData;
  if (!raw) {
    return { isEligible: false, reason: "Player lacks MLB API data for verification. Import or sync the player then try again." };
  }

  const age = raw.currentAge || 99; // Fallback to fail if no age
  const currentTeamId = raw.currentTeam?.id;
  
  // Is the player actively on a real-life minor league roster?
  const isOnRealMiLBRoster = !!MILB_PARENT_MAP[currentTeamId];
  
  // Rehab check: Is the player on a rehab assignment?
  const isRehab = raw.status?.description?.toLowerCase().includes('rehab');

  // 2. Extract Career Stats
  const stats = raw.stats || [];
  const careerHitting = stats.find((s: any) => s.type?.displayName === 'career' && s.group?.displayName === 'hitting')?.splits?.[0]?.stat;
  const careerPitching = stats.find((s: any) => s.type?.displayName === 'career' && s.group?.displayName === 'pitching')?.splits?.[0]?.stat;

  const careerAB = careerHitting?.atBats || 0;
  const careerIP = parseIP(careerPitching?.inningsPitched || careerPitching?.innings);
  const careerApp = careerPitching?.gamesPlayed || 0;
  const careerGS = careerPitching?.gamesStarted || 0;
  
  // Determine if Pitcher is a Starter (>50% of appearances are starts)
  const isStarter = careerApp > 0 ? (careerGS / careerApp) >= 0.5 : false;
  
  const hasMlbExp = (careerHitting?.gamesPlayed > 0) || (careerPitching?.gamesPlayed > 0);

  // 3. Global Rule: No Rehab Assignments
  if (isRehab) {
    return { isEligible: false, reason: "Major League players on minor league rehab assignments are not eligible for FFBL minor leagues." };
  }

  // ==========================================
  // SINGLE-A (A) RULES
  // ==========================================
  if (targetLevel === 'A') {
    if (age > 22) return { isEligible: false, reason: `Player exceeds Single-A age limit of 22 (Current Age: ${age}).` };
    if (hasMlbExp) return { isEligible: false, reason: "Player has Major League experience and is not eligible for Single-A." };
    return { isEligible: true };
  }

  // ==========================================
  // DOUBLE-A (AA) RULES
  // ==========================================
  if (targetLevel === 'AA') {
    if (age > 24) return { isEligible: false, reason: `Player exceeds Double-A age limit of 24 (Current Age: ${age}).` };
    if (careerAB > 650) return { isEligible: false, reason: `Hitter exceeds Double-A limit of 650 career ABs (Has ${careerAB}).` };
    
    if (careerApp > 0) {
      if (isStarter && careerIP > 250) return { isEligible: false, reason: `Starting Pitcher exceeds Double-A limit of 250 career IP (Has ${careerIP.toFixed(1)}).` };
      if (!isStarter && careerApp > 85) return { isEligible: false, reason: `Relief Pitcher exceeds Double-A limit of 85 career Appearances (Has ${careerApp}).` };
    }
    return { isEligible: true };
  }

  // ==========================================
  // TRIPLE-A (AAA) RULES
  // ==========================================
  if (targetLevel === 'AAA') {
    // Affiliation Rule
    if (!currentTeamId) {
      return { isEligible: false, reason: "Player must be affiliated with an MLB organization (Foreign/Amateur players ineligible)." };
    }

    // Check Exceptions first!
    const isUnderExperienceThreshold = careerAB < 130 || careerIP < 50;
    const hasMiLBExemption = isOnRealMiLBRoster;

    // Age Rule
    if (age > 25 && !isUnderExperienceThreshold && !hasMiLBExemption) {
      return { isEligible: false, reason: `Player exceeds Triple-A age limit of 25 and does not meet experience or active MiLB exemptions.` };
    }

    // Experience Rule
    if (!hasMiLBExemption) {
      if (careerAB > 650) return { isEligible: false, reason: `Hitter exceeds Triple-A limit of 650 career ABs (Has ${careerAB}) and is not on an active MiLB roster.` };
      if (careerApp > 0) {
        if (isStarter && careerIP > 250) return { isEligible: false, reason: `Starting Pitcher exceeds Triple-A limit of 250 career IP (Has ${careerIP.toFixed(1)}) and is not on an active MiLB roster.` };
        if (!isStarter && careerApp > 85) return { isEligible: false, reason: `Relief Pitcher exceeds Triple-A limit of 85 career Appearances (Has ${careerApp}) and is not on an active MiLB roster.` };
      }
    }
    return { isEligible: true };
  }

  return { isEligible: false, reason: "Invalid target level." };
};

import { prisma } from '@/lib/prisma';

export const validateTeamFarmSystem = async (
  teamId: string,
  pendingMove?: { playerId: string; newLevel: string | null }
): Promise<{ isValid: boolean; violations: string[] }> => {
  const farmPlayers = await prisma.player.findMany({
    where: { 
      teamId: teamId, 
      status: 'ACTIVE',
      level: { in: ['AAA', 'AA', 'A'] } 
    }
  });

  const violations: string[] = [];

  for (const player of farmPlayers) {
    // If this is the player currently being moved, simulate their new state
    if (pendingMove && pendingMove.playerId === player.id) {
      // If they are being moved OUT of the minors (to MLB or dropped), they are no longer a violation!
      if (!pendingMove.newLevel || !['AAA', 'AA', 'A'].includes(pendingMove.newLevel)) {
        continue;
      }
      
      // Check them against their PROPOSED new level
      const check = checkMinorLeagueEligibility(player, pendingMove.newLevel);
      if (!check.isEligible) {
        violations.push(`${player.firstName} ${player.lastName} (Proposed ${pendingMove.newLevel}): ${check.reason}`);
      }
      continue;
    }

    // Standard check for everyone else
    const check = checkMinorLeagueEligibility(player, player.level);
    if (!check.isEligible) {
      violations.push(`${player.firstName} ${player.lastName} (${player.level}): ${check.reason}`);
    }
  }

  return {
    isValid: violations.length === 0,
    violations
  };
};