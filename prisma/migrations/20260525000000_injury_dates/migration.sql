-- 기존 date → injuryDate 로 이름 변경 (데이터 보존)
ALTER TABLE "Injury" RENAME COLUMN "date" TO "injuryDate";

-- recoveryDate 컬럼 추가
ALTER TABLE "Injury" ADD COLUMN "recoveryDate" TIMESTAMP(3);

-- 기존 recovered=true 인 항목은 오늘 날짜로 회복일 설정
UPDATE "Injury" SET "recoveryDate" = NOW() WHERE "recovered" = true;

-- recovered 컬럼 삭제
ALTER TABLE "Injury" DROP COLUMN "recovered";
