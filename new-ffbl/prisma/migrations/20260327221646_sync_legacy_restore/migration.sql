/*
  Warnings:

  - You are about to drop the column `primaryPos` on the `Player` table. All the data in the column will be lost.
  - You are about to drop the column `proposingTeamId` on the `Trade` table. All the data in the column will be lost.
  - You are about to drop the column `receivingTeamId` on the `Trade` table. All the data in the column will be lost.
  - The `status` column on the `Trade` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `TradeApproval` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[legacyId]` on the table `Player` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[yahooId]` on the table `Player` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `initiatingTeamId` to the `Trade` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TradeStatus" AS ENUM ('PENDING', 'APPROVED', 'VETOED', 'PROCESSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
ALTER TYPE "Status" ADD VALUE 'RETIRED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TransType" ADD VALUE 'RETIRE';
ALTER TYPE "TransType" ADD VALUE 'UNRETIRE';

-- DropForeignKey
ALTER TABLE "Trade" DROP CONSTRAINT "Trade_proposingTeamId_fkey";

-- DropForeignKey
ALTER TABLE "Trade" DROP CONSTRAINT "Trade_receivingTeamId_fkey";

-- DropForeignKey
ALTER TABLE "TradeApproval" DROP CONSTRAINT "TradeApproval_tradeId_fkey";

-- DropForeignKey
ALTER TABLE "TradeApproval" DROP CONSTRAINT "TradeApproval_userId_fkey";

-- AlterTable
ALTER TABLE "DraftPick" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "isTradeLocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Player" DROP COLUMN "primaryPos",
ADD COLUMN     "isTradeLocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "legacyId" INTEGER,
ADD COLUMN     "yahooId" TEXT;

-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "aLogoUrl" TEXT,
ADD COLUMN     "aaLogoUrl" TEXT,
ADD COLUMN     "aaaLogoUrl" TEXT;

-- AlterTable
ALTER TABLE "Trade" DROP COLUMN "proposingTeamId",
DROP COLUMN "receivingTeamId",
ADD COLUMN     "aiAnalysis" JSONB,
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "initiatingTeamId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "status",
ADD COLUMN     "status" "TradeStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "TradeApproval" ADD COLUMN     "correspondingMoves" JSONB,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "status",
ADD COLUMN     "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "teamId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "Position" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "abbrev" TEXT NOT NULL,
    "mlbCode" TEXT,

    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradeAsset" (
    "id" TEXT NOT NULL,
    "tradeId" TEXT NOT NULL,
    "fromTeamId" TEXT NOT NULL,
    "toTeamId" TEXT NOT NULL,
    "fromTeamNameSnapshot" TEXT,
    "toTeamNameSnapshot" TEXT,
    "playerNameSnapshot" TEXT,
    "pickNameSnapshot" TEXT,
    "playerId" TEXT,
    "draftPickId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TradeAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradeComment" (
    "id" TEXT NOT NULL,
    "tradeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TradeComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeagueSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "enforceRosterLimits" BOOLEAN NOT NULL DEFAULT true,
    "mlbLimit" INTEGER NOT NULL DEFAULT 25,
    "aaaLimit" INTEGER NOT NULL DEFAULT 6,
    "aaLimit" INTEGER NOT NULL DEFAULT 6,
    "aLimit" INTEGER NOT NULL DEFAULT 6,
    "ilLimit" INTEGER NOT NULL DEFAULT 5,
    "il60Limit" INTEGER,
    "naLimit" INTEGER NOT NULL DEFAULT 2,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeagueSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PlayerToPosition" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PlayerToPosition_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Position_name_key" ON "Position"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Position_abbrev_key" ON "Position"("abbrev");

-- CreateIndex
CREATE INDEX "_PlayerToPosition_B_index" ON "_PlayerToPosition"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Player_legacyId_key" ON "Player"("legacyId");

-- CreateIndex
CREATE UNIQUE INDEX "Player_yahooId_key" ON "Player"("yahooId");

-- AddForeignKey
ALTER TABLE "DraftPick" ADD CONSTRAINT "DraftPick_year_fkey" FOREIGN KEY ("year") REFERENCES "Season"("year") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeAsset" ADD CONSTRAINT "TradeAsset_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "Trade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeAsset" ADD CONSTRAINT "TradeAsset_fromTeamId_fkey" FOREIGN KEY ("fromTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeAsset" ADD CONSTRAINT "TradeAsset_toTeamId_fkey" FOREIGN KEY ("toTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeAsset" ADD CONSTRAINT "TradeAsset_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeAsset" ADD CONSTRAINT "TradeAsset_draftPickId_fkey" FOREIGN KEY ("draftPickId") REFERENCES "DraftPick"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeComment" ADD CONSTRAINT "TradeComment_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "Trade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeComment" ADD CONSTRAINT "TradeComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeApproval" ADD CONSTRAINT "TradeApproval_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "Trade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeApproval" ADD CONSTRAINT "TradeApproval_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonStanding" ADD CONSTRAINT "SeasonStanding_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PlayerToPosition" ADD CONSTRAINT "_PlayerToPosition_A_fkey" FOREIGN KEY ("A") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PlayerToPosition" ADD CONSTRAINT "_PlayerToPosition_B_fkey" FOREIGN KEY ("B") REFERENCES "Position"("id") ON DELETE CASCADE ON UPDATE CASCADE;
