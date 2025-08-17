/*
  Warnings:

  - You are about to drop the column `startDateTime` on the `Performance` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Performance_userId_pathname_key";

-- AlterTable
ALTER TABLE "Performance" DROP COLUMN "startDateTime",
ALTER COLUMN "finishDateTime" SET DEFAULT CURRENT_TIMESTAMP;
