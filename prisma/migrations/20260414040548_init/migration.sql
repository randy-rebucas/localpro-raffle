-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "password" TEXT,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Raffle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "drawnAt" DATETIME,
    "createdBy" TEXT NOT NULL,
    CONSTRAINT "Raffle_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RaffleShare" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "raffleId" TEXT NOT NULL,
    "shareKey" TEXT NOT NULL UNIQUE,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RaffleShare_raffleId_fkey" FOREIGN KEY ("raffleId") REFERENCES "Raffle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "raffleId" TEXT NOT NULL,
    "prizeName" TEXT NOT NULL,
    "prizeAmount" DECIMAL NOT NULL DEFAULT 0,
    "winnerCount" INTEGER NOT NULL DEFAULT 1,
    "tierOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Tier_raffleId_fkey" FOREIGN KEY ("raffleId") REFERENCES "Raffle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "raffleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Participant_raffleId_fkey" FOREIGN KEY ("raffleId") REFERENCES "Raffle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Winner" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "raffleId" TEXT NOT NULL,
    "tierId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "drawnAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "emailSent" BOOLEAN NOT NULL DEFAULT 0,
    CONSTRAINT "Winner_raffleId_fkey" FOREIGN KEY ("raffleId") REFERENCES "Raffle" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Winner_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "Tier" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Winner_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "Raffle_status_idx" ON "Raffle"("status");

-- CreateIndex
CREATE INDEX "Raffle_createdAt_idx" ON "Raffle"("createdAt");

-- CreateIndex
CREATE INDEX "Raffle_createdBy_idx" ON "Raffle"("createdBy");

-- CreateIndex
CREATE INDEX "RaffleShare_raffleId_idx" ON "RaffleShare"("raffleId");

-- CreateIndex
CREATE INDEX "RaffleShare_shareKey_idx" ON "RaffleShare"("shareKey");

-- CreateIndex
CREATE INDEX "Tier_raffleId_idx" ON "Tier"("raffleId");

-- CreateIndex
CREATE UNIQUE INDEX "Tier_raffleId_tierOrder_key" ON "Tier"("raffleId", "tierOrder");

-- CreateIndex
CREATE INDEX "Participant_raffleId_idx" ON "Participant"("raffleId");

-- CreateIndex
CREATE UNIQUE INDEX "Participant_raffleId_name_email_key" ON "Participant"("raffleId", "name", "email");

-- CreateIndex
CREATE INDEX "Winner_raffleId_idx" ON "Winner"("raffleId");

-- CreateIndex
CREATE INDEX "Winner_tierId_idx" ON "Winner"("tierId");

-- CreateIndex
CREATE INDEX "Winner_participantId_idx" ON "Winner"("participantId");

-- CreateIndex
CREATE UNIQUE INDEX "Winner_raffleId_tierId_participantId_key" ON "Winner"("raffleId", "tierId", "participantId");
