-- Legacy seed values used a 0-100 scale. Monthly skills are a strict 1-10 domain.
UPDATE "monthly_skill_scores"
SET "score" = GREATEST(1, LEAST(10, ROUND("score" / 10.0)::integer))
WHERE "score" < 1 OR "score" > 10;

ALTER TABLE "monthly_skill_scores"
ADD CONSTRAINT "monthly_skill_scores_score_check" CHECK ("score" BETWEEN 1 AND 10);

CREATE INDEX "monthly_assessments_studentId_status_year_month_idx"
ON "monthly_assessments"("studentId", "status", "year", "month");

CREATE INDEX "teacher_reviews_studentId_status_year_month_idx"
ON "teacher_reviews"("studentId", "status", "year", "month");
