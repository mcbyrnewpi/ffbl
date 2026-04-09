// scripts/factory-reset.ts
import { execSync } from 'child_process';
import 'dotenv/config';

function runCommand(command: string, description: string) {
  console.log(`\n======================================================`);
  console.log(`⏳ STEP: ${description}`);
  console.log(`> ${command}`);
  console.log(`======================================================`);
  
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ Success: ${description}\n`);
  } catch (error) {
    console.error(`\n❌ FAILED: ${description}`);
    console.error(`Stopping pipeline. Please fix the error above and try again.`);
    process.exit(1);
  }
}

console.log("🚀 Starting FFBL Factory Reset Pipeline...\n");

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("❌ ERROR: DATABASE_URL is not set in your .env file.");
  process.exit(1);
}

// Prisma needs '&schema=public', but pg_restore and psql hate it. 
// We strip it out just for the native Postgres CLI commands.
const pgCliUrl = dbUrl.replace(/([?&])schema=[^&]+/, '');

// 1. Restore the true Heroku backup using the cleaned URL
runCommand(`pg_restore --clean --if-exists --no-owner --no-acl -d "${pgCliUrl}" latest.dump`, "Restoring Pristine Legacy DB from latest.dump");

// Recreate the public schema in the cloud after pg_restore wipes it
runCommand(`psql "${pgCliUrl}" -c "CREATE SCHEMA IF NOT EXISTS public;"`, "Repairing Schema after Restore");

// 2. Build the Modern Schema (Prisma automatically uses the full DB URL from .env)
runCommand("npx prisma db push --accept-data-loss", "Applying Modern Schema");

// 3. Seed Modern Foundation Data
runCommand("npx tsx prisma/seed.ts", "Seeding Foundation Data (Settings, Positions, etc.)");

// 4. Run the Data Translation Engine
runCommand("npx tsx scripts/migrate-users.ts", "Migrating Users & Franchises");
runCommand("npx tsx scripts/migrate-players.ts", "Migrating Player Pool & Rosters");
runCommand("npx tsx scripts/migrate-draft-picks.ts", "Migrating Draft Capital");
runCommand("npx tsx scripts/seed-history.ts", "Migrating Historical Standings & HOF");

console.log("\n🎉 FACTORY RESET COMPLETE! 🎉");
console.log("The database is fresh, fully migrated, and ready for the Modern Era.");