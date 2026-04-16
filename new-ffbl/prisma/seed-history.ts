import { PrismaClient } from '@prisma/client';

export async function seedHistory(prisma: PrismaClient) {
  const leagueRecordsData = [
    // ==========================
    // 🏆 TEAM RECORDS
    // ==========================
    { type: "TEAM" as const, title: "Runs", value: "65", yearSet: 2017, recordHolder: "Geckos" },
    { type: "TEAM" as const, title: "Home Runs", value: "25", yearSet: 2019, recordHolder: "Ye Olde Tom Toolshed" },
    { type: "TEAM" as const, title: "RBI", value: "72", yearSet: 2019, recordHolder: "Ye Olde Tom Toolshed" },
    { type: "TEAM" as const, title: "Stolen Bases", value: "18", yearSet: 2024, recordHolder: "Supreme Clientele" },
    { type: "TEAM" as const, title: "Average", value: ".386", yearSet: 2008, recordHolder: "Shawntendo All-Stars" },
    { type: "TEAM" as const, title: "OPS", value: "1.142", yearSet: 2008, recordHolder: "Shawntendo All-Stars" },
    { type: "TEAM" as const, title: "Wins", value: "12", yearSet: 2013, recordHolder: "The Bluth Company" },
    { type: "TEAM" as const, title: "Saves", value: "15", yearSet: 2015, recordHolder: "Shaolin Schmeckles" },
    { type: "TEAM" as const, title: "Ks", value: "117", yearSet: 2023, recordHolder: "Supreme Clientele" },
    { type: "TEAM" as const, title: "ERA", value: "0.60", yearSet: 2014, recordHolder: "Geckos" },
    { type: "TEAM" as const, title: "WHIP", value: "0.55", yearSet: 2017, recordHolder: "Purple Cobras" },
    { type: "TEAM" as const, title: "K/BB", value: "13.50", yearSet: 2017, recordHolder: "Purple Cobras" },
  
    // ==========================
    // ⚾ INDIVIDUAL RECORDS
    // ==========================
    { type: "INDIVIDUAL" as const, title: "Runs", value: "13", yearSet: 2006, recordHolder: "Carlos Beltran (Nixon's Nasty Ninjas)" },
    { type: "INDIVIDUAL" as const, title: "Runs", value: "13", yearSet: 2006, recordHolder: "Chase Utley (Dead Rabbits)" },
    { type: "INDIVIDUAL" as const, title: "Runs", value: "13", yearSet: 2017, recordHolder: "Trea Turner (Purple Cobras)" },
    { type: "INDIVIDUAL" as const, title: "Home Runs", value: "9", yearSet: 2012, recordHolder: "Josh Hamilton (Scranton Yankees)" },
    { type: "INDIVIDUAL" as const, title: "RBI", value: "19", yearSet: 2013, recordHolder: "Hunter Pence (Nixon's Nasty Ninjas)" },
    { type: "INDIVIDUAL" as const, title: "Stolen Bases", value: "11", yearSet: 2009, recordHolder: "Carl Crawford (Dead Rabbits)" },
    { type: "INDIVIDUAL" as const, title: "Average", value: ".700", yearSet: 2005, recordHolder: "Edgar Renteria (Young Tommy Toolsheds)" },
    { type: "INDIVIDUAL" as const, title: "OPS", value: "2.271", yearSet: 2006, recordHolder: "Jason Giambi (Grove Street OGs)" },
    { type: "INDIVIDUAL" as const, title: "Wins", value: "3", yearSet: 2005, recordHolder: "Derrick Turnbow (Geckos)" },
    { type: "INDIVIDUAL" as const, title: "Wins", value: "3", yearSet: 2010, recordHolder: "Tyler Clippard (Shawntendo All-Stars)" },
    { type: "INDIVIDUAL" as const, title: "Saves", value: "5", yearSet: null, recordHolder: "6 Players Tied (Various)" },
    { type: "INDIVIDUAL" as const, title: "Ks", value: "27", yearSet: 2019, recordHolder: "Chris Sale (Cowboys From Hell)" },
    { type: "INDIVIDUAL" as const, title: "ERA", value: "0.00 (18 IP)", yearSet: 2005, recordHolder: "Mark Mulder (The 1993 Philadelphia Phillies)" },
    { type: "INDIVIDUAL" as const, title: "WHIP", value: "0.00 (9 IP)", yearSet: 2009, recordHolder: "Jonathan Sanchez (Chinballs)" },
    { type: "INDIVIDUAL" as const, title: "WHIP", value: "0.00 (9 IP)", yearSet: 2012, recordHolder: "Matt Cain (Purple Cobras)" },
    { type: "INDIVIDUAL" as const, title: "K/BB", value: "INF (26 Ks)", yearSet: 2015, recordHolder: "Chris Archer (Dead Rabbits)" },
  ];

  console.log('Seeding historical records...');
  
  // Wipe existing records so we can safely re-run the seed multiple times
  await prisma.leagueRecord.deleteMany();
  
  await prisma.leagueRecord.createMany({
    data: leagueRecordsData,
  });
  
  console.log(`✅ Seeded ${leagueRecordsData.length} historical records.`);
}