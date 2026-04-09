// scripts/sync-external.ts
import { execSync } from 'child_process';

function runCommand(command: string, description: string) {
  console.log(`\n======================================================`);
  console.log(`⏳ STEP: ${description}`);
  console.log(`> ${command}`);
  console.log(`======================================================`);
  
  try {
    // stdio: 'inherit' pipes the output directly to the terminal
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ Success: ${description}\n`);
  } catch (error) {
    console.error(`\n❌ FAILED: ${description}`);
    console.error(`Stopping pipeline. Please fix the error above and try again.`);
    process.exit(1);
  }
}

console.log("⚾ Starting FFBL External API Sync Pipeline...\n");

// 1. Map players to their official MLB IDs (Required before fetching stats)
runCommand("npx tsx scripts/sync-mlb-ids.ts", "Mapping Players to Official MLB IDs");

// 2. Fetch the actual payload (Stats, headshots, bio data) from the MLB Stats API
runCommand("npx tsx scripts/sync-mlb-raw-data.ts", "Fetching MLB Stats & Headshots");

console.log("\n🎉 EXTERNAL SYNC COMPLETE! 🎉");
console.log("All players are now mapped to the MLB API and enriched with live data.");