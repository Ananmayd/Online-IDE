-- CreateEnum
CREATE TYPE "Language" AS ENUM ('PYTHON', 'NODEJS', 'JAVASCRIPT', 'RUBY', 'JAVA');

-- CreateTable
CREATE TABLE "Playground" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "language" "Language" NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Playground_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Playground" ADD CONSTRAINT "Playground_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
