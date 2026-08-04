DROP INDEX IF EXISTS "teacher_group_assignments_one_current";
CREATE UNIQUE INDEX "teacher_group_assignments_one_current_per_group"
ON "teacher_group_assignments" ("groupId")
WHERE "isCurrent" = true AND "endedAt" IS NULL;
