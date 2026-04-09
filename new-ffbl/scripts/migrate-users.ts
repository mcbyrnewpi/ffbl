// scripts/migrate-users.ts
import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';

// 1. Prisma 7 Adapter Setup
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not defined in your environment variables");
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

async function migrateUsers() {
  console.log("👥 Starting Idempotent User & Team Migration...");

  // 2. Fetch all legacy users
  const legacyUsers = await prisma.legacyUser.findMany();
  console.log(`Found ${legacyUsers.length} legacy users. Processing...`);

  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  for (const lu of legacyUsers) {
    // 🚨 NextAuth Identity Guard: We MUST have an email to create a reliable modern User
    if (!lu.email) {
      console.warn(`⏭️ Skipped Legacy User ID ${lu.id} (${lu.name || 'Unknown'}) - No email address.`);
      skippedCount++;
      continue;
    }

    // 3. Map the Role (Data Dictionary Rule)
    let modernRole: Role = Role.OWNER;
    if (lu.admin) {
      modernRole = Role.ADMIN;
    } else if (lu.commish) {
      modernRole = Role.COMMISH;
    }

    // 4. Ensure the Team exists and grab its ID (PATCHED for Affiliates)
    let modernTeamId = null;
    if (lu.team) {
      const team = await prisma.team.upsert({
        where: { name: lu.team.trim() },
        update: {
          aaaAffiliateName: lu.aaa?.trim(),
          aaAffiliateName: lu.aa?.trim(),
          aAffiliateName: lu.a?.trim(),
        }, 
        create: { 
          name: lu.team.trim(),
          aaaAffiliateName: lu.aaa?.trim(),
          aaAffiliateName: lu.aa?.trim(),
          aAffiliateName: lu.a?.trim(),
        }
      });
      modernTeamId = team.id;
    }

    // 5. UPSERT the Modern User (Matching on Email)
    try {
      const result = await prisma.user.upsert({
        where: { email: lu.email.trim().toLowerCase() },
        update: {
          name: lu.name?.trim(),
          role: modernRole,
          teamId: modernTeamId,
          // Set to true if they have a team to give them immediate manager access
          isPrimaryManager: modernTeamId ? true : false, 
        },
        create: {
          email: lu.email.trim().toLowerCase(),
          name: lu.name?.trim(),
          role: modernRole,
          teamId: modernTeamId,
          isPrimaryManager: modernTeamId ? true : false,
        }
      });

      if (result.createdAt.getTime() === result.updatedAt.getTime()) {
        createdCount++;
      } else {
        updatedCount++;
      }

    } catch (error: any) {
      console.error(`⚠️ Failed to migrate user ${lu.email}. Error: ${error.message}`);
    }
  }

  console.log(`\n✅ User Migration Complete!`);
  console.log(`✨ Created: ${createdCount}`);
  console.log(`🔄 Updated: ${updatedCount}`);
  if (skippedCount > 0) console.log(`⏭️ Skipped (missing emails): ${skippedCount}`);
}

// 6. Execute and strictly clean up the pool
migrateUsers()
  .catch((e) => {
    console.error("❌ Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });