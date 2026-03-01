-- CreateTable
CREATE TABLE "EvaluationBatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "promptId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "criteria" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EvaluationBatch_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "Prompt" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TestResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "promptId" TEXT NOT NULL,
    "input" TEXT NOT NULL,
    "output" TEXT NOT NULL,
    "aiResponse" TEXT,
    "tokens" INTEGER,
    "promptTokens" INTEGER,
    "completionTokens" INTEGER,
    "responseTime" INTEGER,
    "isToxic" BOOLEAN NOT NULL DEFAULT false,
    "ratings" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "evaluationBatchId" TEXT,
    CONSTRAINT "TestResult_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "Prompt" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TestResult_evaluationBatchId_fkey" FOREIGN KEY ("evaluationBatchId") REFERENCES "EvaluationBatch" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TestResult" ("aiResponse", "completionTokens", "createdAt", "id", "input", "isToxic", "output", "promptId", "promptTokens", "ratings", "responseTime", "tokens") SELECT "aiResponse", "completionTokens", "createdAt", "id", "input", "isToxic", "output", "promptId", "promptTokens", "ratings", "responseTime", "tokens" FROM "TestResult";
DROP TABLE "TestResult";
ALTER TABLE "new_TestResult" RENAME TO "TestResult";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
