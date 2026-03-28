import { PrismaClient, Role } from '@prisma/client';
// ... (Keep your adapter/pool setup from before) ...

async function main() {
  console.log("🔄 Starting the Upsert Migration...");

  const legacyUsers = await prisma.legacyUser.findMany();
  console.log(`Checking ${legacyUsers.length} legacy records...`);

  for (const oldUser of legacyUsers) {
    if (!oldUser.team) continue;

    console.log(`Processing ${oldUser.team}...`);

    // 1. UPSERT THE TEAM (Match by Name)
    const team = await prisma.team.upsert({
      where: { name: oldUser.team },
      update: {
        aaaAffiliateName: oldUser.aaa, 
        aaAffiliateName: oldUser.aa,
        aAffiliateName: oldUser.a,
      },
      create: {
        name: oldUser.team,
        aaaAffiliateName: oldUser.aaa,
        aaAffiliateName: oldUser.aa,
        aAffiliateName: oldUser.a,
        requireCoManagerApproval: false,
      },
    });

    // Determine Role
    let modernRole: Role = 'OWNER';
    if (oldUser.admin) modernRole = 'ADMIN';
    else if (oldUser.commish) modernRole = 'COMMISH';

    // 2. UPSERT THE USER (Match by Email)
    await prisma.user.upsert({
      where: { email: oldUser.email },
      update: {
        role: modernRole,
        teamId: team.id,
        name: oldUser.name,
      },
      create: {
        name: oldUser.name,
        email: oldUser.email,
        role: modernRole,
        isPrimaryManager: true,
        teamId: team.id,
      },
    });

    console.log(`✅ Synced: ${oldUser.team} (Affiliates: ${oldUser.aaa || 'None'})`);
  }

  console.log("🎉 All data synced and nulls patched.");
}

