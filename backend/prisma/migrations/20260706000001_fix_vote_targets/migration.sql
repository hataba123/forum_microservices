-- DropForeignKey
ALTER TABLE "votes" DROP CONSTRAINT "votes_targetId_fkey";

-- DropIndex
DROP INDEX "votes_userId_targetId_type_key";

-- AlterTable
ALTER TABLE "votes"
ADD COLUMN     "postId" TEXT,
ADD COLUMN     "threadId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3);

-- Preserve existing dev votes before removing the legacy polymorphic targetId.
UPDATE "votes" SET "postId" = "targetId" WHERE "type" = 'POST';
UPDATE "votes" SET "threadId" = "targetId" WHERE "type" = 'THREAD';
UPDATE "votes" SET "updatedAt" = CURRENT_TIMESTAMP WHERE "updatedAt" IS NULL;

ALTER TABLE "votes" ALTER COLUMN "updatedAt" SET NOT NULL;
ALTER TABLE "votes" DROP COLUMN "targetId";

-- CreateIndex
CREATE UNIQUE INDEX "votes_userId_postId_key" ON "votes"("userId", "postId");

-- CreateIndex
CREATE UNIQUE INDEX "votes_userId_threadId_key" ON "votes"("userId", "threadId");

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
