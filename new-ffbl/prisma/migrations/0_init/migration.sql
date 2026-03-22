-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'COMMISH', 'OWNER');

-- CreateEnum
CREATE TYPE "Level" AS ENUM ('MLB', 'AAA', 'AA', 'A');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('ACTIVE', 'IL', 'IL_60', 'NA', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "TransType" AS ENUM ('ADD', 'DROP', 'TRADE', 'PROMOTE', 'DEMOTE', 'PLACE_ON_IL', 'ACTIVATE_FROM_IL', 'PLACE_ON_IL_60', 'ACTIVATE_FROM_IL_60', 'PLACE_ON_NA', 'ACTIVATE_FROM_NA');

-- CreateTable
CREATE TABLE "books" (
    "id" SERIAL NOT NULL,
    "selector" VARCHAR,
    "title" VARCHAR,
    "author" VARCHAR,
    "summary" TEXT,
    "start" DATE,
    "end" DATE,
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commish_notes" (
    "id" SERIAL NOT NULL,
    "commish_note_content" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "commish_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "levels" (
    "id" SERIAL NOT NULL,
    "league" VARCHAR,
    "player_id" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_types" (
    "id" SERIAL NOT NULL,
    "kind" VARCHAR,
    "player_id" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "player_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "players" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "level_id" INTEGER,
    "last_name" VARCHAR,
    "first_name" VARCHAR,
    "dob" DATE,
    "retro" DATE,
    "activate" DATE,
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "position_id" INTEGER,
    "trade_info" TEXT,
    "affiliation" VARCHAR,
    "player_note" TEXT,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "positions" (
    "id" SERIAL NOT NULL,
    "player_id" INTEGER,
    "spot" VARCHAR,
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" SERIAL NOT NULL,
    "topic" VARCHAR,
    "content" TEXT,
    "user_id" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "most_recent" TIMESTAMP(6),

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preseason_reports" (
    "id" SERIAL NOT NULL,
    "report_title" VARCHAR,
    "report_content" TEXT,
    "prospect1" VARCHAR,
    "prospect2" VARCHAR,
    "prospect3" VARCHAR,
    "prospect4" VARCHAR,
    "prospect5" VARCHAR,
    "prospect6" VARCHAR,
    "prospect7" VARCHAR,
    "prospect8" VARCHAR,
    "prospect9" VARCHAR,
    "prospect10" VARCHAR,
    "catch" VARCHAR,
    "first" VARCHAR,
    "second" VARCHAR,
    "third" VARCHAR,
    "short" VARCHAR,
    "of1" VARCHAR,
    "of2" VARCHAR,
    "of3" VARCHAR,
    "util1" VARCHAR,
    "util2" VARCHAR,
    "sp1" VARCHAR,
    "sp2" VARCHAR,
    "sp3" VARCHAR,
    "rp1" VARCHAR,
    "rp2" VARCHAR,
    "rp3" VARCHAR,
    "p1" VARCHAR,
    "p2" VARCHAR,
    "bench1" VARCHAR,
    "bench2" VARCHAR,
    "bench3" VARCHAR,
    "bench4" VARCHAR,
    "bench5" VARCHAR,
    "bench6" VARCHAR,
    "bench7" VARCHAR,
    "pyr1" INTEGER,
    "pyr2" INTEGER,
    "pyr3" INTEGER,
    "pyr4" INTEGER,
    "pyr5" INTEGER,
    "pyr6" INTEGER,
    "pyr7" INTEGER,
    "pyr8" INTEGER,
    "pyr9" INTEGER,
    "pyr10" INTEGER,
    "past_prospect1" VARCHAR,
    "past_prospect2" VARCHAR,
    "past_prospect3" VARCHAR,
    "past_prospect4" VARCHAR,
    "past_prospect5" VARCHAR,
    "past_prospect6" VARCHAR,
    "past_prospect7" VARCHAR,
    "past_prospect8" VARCHAR,
    "past_prospect9" VARCHAR,
    "past_prospect10" VARCHAR,
    "pcurrent1" VARCHAR,
    "pcurrent2" VARCHAR,
    "pcurrent3" VARCHAR,
    "pcurrent4" VARCHAR,
    "pcurrent5" VARCHAR,
    "pcurrent6" VARCHAR,
    "pcurrent7" VARCHAR,
    "pcurrent8" VARCHAR,
    "pcurrent9" VARCHAR,
    "pcurrent10" VARCHAR,
    "dpyr1" INTEGER,
    "dpyr2" INTEGER,
    "dpyr3" INTEGER,
    "dpyr4" INTEGER,
    "dpyr5" INTEGER,
    "dpyr6" INTEGER,
    "dpyr7" INTEGER,
    "dpyr8" INTEGER,
    "dpyr9" INTEGER,
    "dpyr10" INTEGER,
    "draft_pick1" VARCHAR,
    "draft_pick2" VARCHAR,
    "draft_pick3" VARCHAR,
    "draft_pick4" VARCHAR,
    "draft_pick5" VARCHAR,
    "draft_pick6" VARCHAR,
    "draft_pick7" VARCHAR,
    "draft_pick8" VARCHAR,
    "draft_pick9" VARCHAR,
    "draft_pick10" VARCHAR,
    "dpcurrent1" VARCHAR,
    "dpcurrent2" VARCHAR,
    "dpcurrent3" VARCHAR,
    "dpcurrent4" VARCHAR,
    "dpcurrent5" VARCHAR,
    "dpcurrent6" VARCHAR,
    "dpcurrent7" VARCHAR,
    "dpcurrent8" VARCHAR,
    "dpcurrent9" VARCHAR,
    "dpcurrent10" VARCHAR,
    "user_id" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "proj_year" INTEGER,

    CONSTRAINT "preseason_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "responses" (
    "id" SERIAL NOT NULL,
    "reply" TEXT,
    "user_id" INTEGER,
    "post_id" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "book_id" INTEGER,
    "thoughts" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schema_migrations" (
    "version" VARCHAR NOT NULL
);

-- CreateTable
CREATE TABLE "sidebets" (
    "id" SERIAL NOT NULL,
    "over" VARCHAR,
    "under" VARCHAR,
    "bet_info" TEXT,
    "stakes" VARCHAR,
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "winner" VARCHAR,

    CONSTRAINT "sidebets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" SERIAL NOT NULL,
    "team_after" VARCHAR,
    "league_after" VARCHAR,
    "user_id" INTEGER,
    "player_id" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "league_before" VARCHAR,
    "team_before" VARCHAR,
    "player_first_name" VARCHAR,
    "player_last_name" VARCHAR,
    "details" TEXT,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR,
    "email" VARCHAR,
    "team" VARCHAR,
    "password_digest" VARCHAR,
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "remember_digest" VARCHAR,
    "a" VARCHAR,
    "aa" VARCHAR,
    "aaa" VARCHAR,
    "about" TEXT,
    "admin" BOOLEAN DEFAULT false,
    "glctac" BOOLEAN DEFAULT false,
    "varnum" BOOLEAN DEFAULT false,
    "commish" BOOLEAN DEFAULT false,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "role" "Role" NOT NULL DEFAULT 'OWNER',
    "isBookClubMember" BOOLEAN NOT NULL DEFAULT false,
    "teamId" TEXT,
    "isPrimaryManager" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "motto" TEXT,
    "aaaAffiliateName" TEXT,
    "aaAffiliateName" TEXT,
    "aAffiliateName" TEXT,
    "requireCoManagerApproval" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "mlbId" INTEGER,
    "fangraphsId" TEXT,
    "birthdate" TIMESTAMP(3),
    "primaryPos" TEXT,
    "teamId" TEXT,
    "level" "Level",
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DraftPick" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "round" INTEGER NOT NULL,
    "pickNumber" INTEGER,
    "originalOwnerId" TEXT NOT NULL,
    "currentOwnerId" TEXT NOT NULL,
    "playerId" TEXT,

    CONSTRAINT "DraftPick_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "proposingTeamId" TEXT NOT NULL,
    "receivingTeamId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Trade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradeApproval" (
    "id" TEXT NOT NULL,
    "tradeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "TradeApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "type" "TransType" NOT NULL,
    "playerId" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Season" (
    "year" INTEGER NOT NULL,
    "ffblChampion" TEXT NOT NULL,
    "playoffMvp" TEXT NOT NULL,
    "regularSeasonBest" TEXT NOT NULL,
    "alChamp" TEXT,
    "nlChamp" TEXT,
    "mlbMvp" TEXT NOT NULL,
    "mlbCyYoung" TEXT NOT NULL,
    "mlbRoy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("year")
);

-- CreateTable
CREATE TABLE "SeasonStanding" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "teamId" TEXT NOT NULL,
    "teamName" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "wins" INTEGER NOT NULL,
    "losses" INTEGER NOT NULL,
    "ties" INTEGER NOT NULL DEFAULT 0,
    "pct" DOUBLE PRECISION,
    "isPlayoffTeam" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SeasonStanding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "index_players_on_level_id" ON "players"("level_id");

-- CreateIndex
CREATE INDEX "index_players_on_user_id" ON "players"("user_id");

-- CreateIndex
CREATE INDEX "index_positions_on_player_id" ON "positions"("player_id");

-- CreateIndex
CREATE INDEX "index_posts_on_user_id" ON "posts"("user_id");

-- CreateIndex
CREATE INDEX "index_preseason_reports_on_user_id" ON "preseason_reports"("user_id");

-- CreateIndex
CREATE INDEX "index_responses_on_post_id" ON "responses"("post_id");

-- CreateIndex
CREATE INDEX "index_responses_on_user_id" ON "responses"("user_id");

-- CreateIndex
CREATE INDEX "index_reviews_on_book_id" ON "reviews"("book_id");

-- CreateIndex
CREATE INDEX "index_reviews_on_user_id" ON "reviews"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_schema_migrations" ON "schema_migrations"("version");

-- CreateIndex
CREATE INDEX "index_transactions_on_player_id" ON "transactions"("player_id");

-- CreateIndex
CREATE INDEX "index_transactions_on_user_id" ON "transactions"("user_id");

-- CreateIndex
CREATE INDEX "index_users_on_team" ON "users"("team");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Team_name_key" ON "Team"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Player_mlbId_key" ON "Player"("mlbId");

-- CreateIndex
CREATE UNIQUE INDEX "Player_fangraphsId_key" ON "Player"("fangraphsId");

-- CreateIndex
CREATE UNIQUE INDEX "TradeApproval_tradeId_userId_key" ON "TradeApproval"("tradeId", "userId");

-- AddForeignKey
ALTER TABLE "player_types" ADD CONSTRAINT "fk_rails_b5f8c04bc8" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "players" ADD CONSTRAINT "fk_rails_224cac07ce" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "players" ADD CONSTRAINT "fk_rails_a986decdfd" FOREIGN KEY ("level_id") REFERENCES "levels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "positions" ADD CONSTRAINT "fk_rails_8691b6d8ec" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "fk_rails_5b5ddfd518" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "preseason_reports" ADD CONSTRAINT "fk_rails_66fd51ddb2" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "responses" ADD CONSTRAINT "fk_rails_06456afde5" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "responses" ADD CONSTRAINT "fk_rails_2bd9a0753e" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "fk_rails_74a66bd6c5" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "fk_rails_924a0b30ca" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "fk_rails_77364e6416" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "fk_rails_bfd36cb507" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DraftPick" ADD CONSTRAINT "DraftPick_originalOwnerId_fkey" FOREIGN KEY ("originalOwnerId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DraftPick" ADD CONSTRAINT "DraftPick_currentOwnerId_fkey" FOREIGN KEY ("currentOwnerId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DraftPick" ADD CONSTRAINT "DraftPick_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_proposingTeamId_fkey" FOREIGN KEY ("proposingTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_receivingTeamId_fkey" FOREIGN KEY ("receivingTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeApproval" ADD CONSTRAINT "TradeApproval_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "Trade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeApproval" ADD CONSTRAINT "TradeApproval_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonStanding" ADD CONSTRAINT "SeasonStanding_year_fkey" FOREIGN KEY ("year") REFERENCES "Season"("year") ON DELETE RESTRICT ON UPDATE CASCADE;

