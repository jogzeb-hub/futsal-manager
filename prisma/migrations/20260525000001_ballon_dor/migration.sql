CREATE TABLE "BallonDor" (
  "id" SERIAL PRIMARY KEY,
  "year" INTEGER NOT NULL,
  "playerId" INTEGER NOT NULL,
  CONSTRAINT "BallonDor_year_key" UNIQUE ("year"),
  CONSTRAINT "BallonDor_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
