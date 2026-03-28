import { PrismaClient, Role } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// 1. Your passwordless URL
const MIGRATION_DB_URL = "<REPLACE_WITH_DB_URL>"; 

// 2. Create a standard Postgres connection pool
const pool = new Pool({ connectionString: MIGRATION_DB_URL });

// 3. Wrap it in the Prisma Adapter
const adapter = new PrismaPg(pool);

// 4. Hand the adapter to the Client!
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🚀 Starting the Great Migration...");

  // 1. Extract: Grab all the old users from the time capsule
  const legacyUsers = await prisma.legacyUser.findMany();
  console.log(`Found ${legacyUsers.length} managers in the legacy system.`);

  for (const oldUser of legacyUsers) {
    // Skip if they didn't have a team name (maybe an old test account)
    if (!oldUser.team) {
      console.log(`⚠️ Skipping ${oldUser.name} - No team name found.`);
      continue;
    }

    console.log(`Transforming ${oldUser.team}...`);

    // 2. Transform & Load: Create the Franchise (Team)
    const newTeam = await prisma.team.create({
      data: {
        name: oldUser.team,
        aaaAffiliateName: oldUser.aaa,
        aaAffiliateName: oldUser.aa,
        aAffiliateName: oldUser.a,
        requireCoManagerApproval: false, // Defaulting to false for the migration
      },
    });

    // Determine their new modern Role
    let modernRole: Role = 'OWNER';
    if (oldUser.admin) modernRole = 'ADMIN';
    else if (oldUser.commish) modernRole = 'COMMISH';

    // 3. Transform & Load: Create the Human (User) and link them to the team
    await prisma.user.create({
      data: {
        name: oldUser.name,
        email: oldUser.email,
        role: modernRole,
        isPrimaryManager: true, // They were solo owners in the old app!
        teamId: newTeam.id,
        // Notice: We do NOT bring over the old password_digest. 
        // In the new app, they will log in securely with Auth.js via email or Google!
      },
    });

    console.log(`✅ Successfully migrated: ${oldUser.team} (Managed by ${oldUser.name})`);
  }

  console.log("🎉 Migration complete! Welcome to 2026.");
}

main()
  .catch((e) => {
    console.error("❌ Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });