import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config'; // Make sure this is at the top to load DATABASE_URL

// Instead of creating a 'new pg.Pool()', pass the connection string directly
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined in your environment variables");
}

// Pass the config object instead of the pool instance
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const historicalSeasons = [
  { year: 2023, ffblChampion: "The Red Barons", playoffMvp: "Ronald Acuna Jr", regularSeasonBest: "Bullet Club", alChamp: "Shaolin Schmeckles", nlChamp: "Bullet Club", mlbMvp: "Ronald Acuna Jr (Red Barons)", mlbCyYoung: "Gerrit Cole (Jon Voight's Car)", mlbRoy: "Corbin Carroll (Bluth Company)" },
  { year: 2022, ffblChampion: "Bullet Club", playoffMvp: "Zac Gallen", regularSeasonBest: "The Red Barons", alChamp: "The Red Barons", nlChamp: "Undead Rabbits", mlbMvp: "Aaron Judge (Chinballs)", mlbCyYoung: "Justin Verlander (Shaolin Schmeckles)", mlbRoy: "Julio Rodriguez (Bullet Club)" },
  { year: 2021, ffblChampion: "Chinballs", playoffMvp: "Nick Castellanos", regularSeasonBest: "Chinballs", alChamp: "Chinballs", nlChamp: "Undead Rabbits", mlbMvp: "Vladimir Guerrero Jr. (Nixon's Nasty Ninjas)", mlbCyYoung: "Max Scherzer (The Red Barons)", mlbRoy: "Jonathan India (Bridge Four)" },
  { year: 2020, ffblChampion: "Ye Olde Tom Toolshed", playoffMvp: "Adalberto Mondesi", regularSeasonBest: "Purple Cobras", alChamp: "N/A", nlChamp: "N/A", mlbMvp: "Freddie Freeman (The Bluth Company)", mlbCyYoung: "Shane Bieber (Cowboys From Hell)", mlbRoy: "Kyle Lewis (Ye Olde Tom Toolshed)" },
  { year: 2019, ffblChampion: "The Bluth Company", playoffMvp: "Max Muncy", regularSeasonBest: "Ye Olde Tom Toolshed", alChamp: "Ye Olde Tom Toolshed", nlChamp: "The Bluth Company", mlbMvp: "Justin Verlander (Purple Cobras)", mlbCyYoung: "Christian Yelich (Scranton Yankees)", mlbRoy: "Pete Alonso (Bullet Club)" },
  { year: 2018, ffblChampion: "The Bluth Company", playoffMvp: "Freddie Freeman", regularSeasonBest: "The Bluth Company", alChamp: "Hill Valley PS", nlChamp: "The Bluth Company", mlbMvp: "Mookie Betts (Supreme Clientele)", mlbCyYoung: "Jacob deGrom (Scranton Yankees)", mlbRoy: "Shohei Ohtani (Jon Voight's Car)" },
  { year: 2017, ffblChampion: "Supreme Clientele", playoffMvp: "Carlos Carrasco", regularSeasonBest: "Purple Cobras", alChamp: "Supreme Clientele", nlChamp: "Purple Cobras", mlbMvp: "Giancarlo Stanton (Hill Valley PS)", mlbCyYoung: "Corey Kluber (Purple Cobras)", mlbRoy: "Aaron Judge (Kimble's Kids)" },
  { year: 2016, ffblChampion: "Purple Cobras", playoffMvp: "Justin Verlander", regularSeasonBest: "Purple Cobras", alChamp: "Supreme Clientele", nlChamp: "Purple Cobras", mlbMvp: "Mike Trout (The Bluth Company)", mlbCyYoung: "Max Scherzer (Bridge Four)", mlbRoy: "Coreager (Scranton Yankees)" },
  { year: 2015, ffblChampion: "Shaolin Schmeckles", playoffMvp: "Adrian Beltre", regularSeasonBest: "Purple Cobras", alChamp: "Cowboys From Hell", nlChamp: "Purple Cobras", mlbMvp: "Bryce Harper (Banana Hammock)", mlbCyYoung: "Clayton Kershaw (Geckos)", mlbRoy: "Kris Bryant (The Red Barons)" },
  { year: 2014, ffblChampion: "Jon Voight's Car", playoffMvp: "C. Gomez", regularSeasonBest: "Nixon's Nasty Ninjas", alChamp: "Nixon's Nasty Ninjas", nlChamp: "Scranton Yankees", mlbMvp: "Mike Trout (The Bluth Company)", mlbCyYoung: "Clayton Kershaw (Geckos)", mlbRoy: "Jose Abreu (Kimble's Kids)" },
  { year: 2013, ffblChampion: "Scranton Yankees", playoffMvp: "C. Lee", regularSeasonBest: "Purple Cobras", alChamp: "Shaolin Schmeckles", nlChamp: "Purple Cobras", mlbMvp: "Chris Davis (Cowboys From Hell)", mlbCyYoung: "Clayton Kershaw (Geckos)", mlbRoy: "Jose Fernandez (Cowboys From Hell)" },
  { year: 2012, ffblChampion: "Purple Cobras", playoffMvp: "J. Verlander", regularSeasonBest: "Purple Cobras", alChamp: "Scranton Yankees", nlChamp: "Purple Cobras", mlbMvp: "Mike Trout (The Bluth Company)", mlbCyYoung: "R.A. Dickey (Geckos)", mlbRoy: "Mike Trout (The Bluth Company)" },
  { year: 2011, ffblChampion: "Nixon's Nasty Ninjas", playoffMvp: "J. Ellsbury", regularSeasonBest: "Purple Cobras", alChamp: "Geckos", nlChamp: "Purple Cobras", mlbMvp: "Matt Kemp (Shaolin Schmeckles)", mlbCyYoung: "Justin Verlander (Purple Cobras)", mlbRoy: "Craig Kimbrel (Dead Rabbits)" },
  { year: 2010, ffblChampion: "Purple Cobras", playoffMvp: "J. Bruce", regularSeasonBest: "Purple Cobras", alChamp: "Geckos", nlChamp: "Purple Cobras", mlbMvp: "Joey Votto (Black Thirteen)", mlbCyYoung: "Roy Halladay (Geckos)", mlbRoy: "Neftali Feliz (Purple Cobras)" },
  { year: 2009, ffblChampion: "Shawntendo All-Stars", playoffMvp: "F. Hernandez", regularSeasonBest: "Purple Cobras", alChamp: "Chinballs", nlChamp: "Purple Cobras", mlbMvp: "Albert Pujols (Chinballs)", mlbCyYoung: "Zack Greinke (Banana Hammock)", mlbRoy: "Andrew Bailey (Dead Rabbits)" },
  { year: 2008, ffblChampion: "Shawntendo All-Stars", playoffMvp: "J. Lester", regularSeasonBest: "Chinballs", alChamp: "Chinballs", nlChamp: "Shawntendo", mlbMvp: "Albert Pujols (Chinballs)", mlbCyYoung: "Cliff Lee (Cowboys From Hell)", mlbRoy: "Geovany Soto (Absolut Monks)" },
  { year: 2007, ffblChampion: "Nixon's Nasty Ninjas", playoffMvp: "J. Vazquez", regularSeasonBest: "Geckos", alChamp: "Geckos", nlChamp: "Dead Rabbits", mlbMvp: "Alex Rodriguez (1993 Phillies)", mlbCyYoung: "Jake Peavy (Nick's Nighthawks)", mlbRoy: "Ryan Braun (Young T. Toolsheds)" },
  { year: 2006, ffblChampion: "Geckos", playoffMvp: "B. Myers", regularSeasonBest: "Geckos", alChamp: "Geckos", nlChamp: "Dead Rabbits", mlbMvp: "Ryan Howard (Fo' Shizzle)", mlbCyYoung: "Johan Santana (Cowboys From Hell)", mlbRoy: "Jonathan Papelbon (Dead Rabbits)" },
  { year: 2005, ffblChampion: "Geckos", playoffMvp: "T. Hafner", regularSeasonBest: "Geckos", alChamp: "N/A", nlChamp: "N/A", mlbMvp: "Alex Rodriguez (1993 Phillies)", mlbCyYoung: "Chris Carpenter (Wyld Stallyns)", mlbRoy: "Huston Street (Men of the Frost)" },
  { year: 2004, ffblChampion: "Nixon's Nasty Ninjas", playoffMvp: "B. Sheets", regularSeasonBest: "Nixon's Nasty Ninjas", alChamp: "N/A", nlChamp: "N/A", mlbMvp: "Albert Pujols (Killarney Killers)", mlbCyYoung: "Johan Santana (Cowboys From Hell)", mlbRoy: "Jason Bay (Yao's Great Wall)" },
  { year: 2003, ffblChampion: "Cowboys From Hell", playoffMvp: "E. Gagne", regularSeasonBest: "Cowboys From Hell", alChamp: "N/A", nlChamp: "N/A", mlbMvp: "Albert Pujols (Killarney Killers)", mlbCyYoung: "Roy Halladay (Geckos)", mlbRoy: "Brandon Webb (Cowboys From Hell)" },
  { year: 2002, ffblChampion: "Cowboys From Hell", playoffMvp: "T. Glaus", regularSeasonBest: "Geckos", alChamp: "N/A", nlChamp: "N/A", mlbMvp: "Vladimir Guerrero (Sultans of Naught)", mlbCyYoung: "Randy Johnson (Killarney Killers)", mlbRoy: "Eric Hinske (Geckos)" },
];

async function main() {
  console.log("🌱 Seeding League History from franklinfantasy.com...");
  for (const s of historicalSeasons) {
    await prisma.season.upsert({
      where: { year: s.year },
      update: s,
      create: s,
    });
  }
  console.log(`✅ ${historicalSeasons.length} years of history seeded!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });