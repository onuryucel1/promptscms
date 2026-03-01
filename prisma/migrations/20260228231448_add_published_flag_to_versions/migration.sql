-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PromptVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "versionName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "promptId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PromptVersion_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "Prompt" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PromptVersion" ("content", "createdAt", "id", "promptId", "title", "versionName") SELECT "content", "createdAt", "id", "promptId", "title", "versionName" FROM "PromptVersion";
DROP TABLE "PromptVersion";
ALTER TABLE "new_PromptVersion" RENAME TO "PromptVersion";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
