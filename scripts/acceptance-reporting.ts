import "dotenv/config";
import assert from "node:assert/strict";
import { prisma } from "../lib/db/prisma";
import { getParentReviewsAnalytics } from "../lib/repositories/parent-pages.repository";
import { getStudentMonthlyReport, getStudentSkillTrend } from "../lib/services/student-analytics.service";
import { publishMonthlyAssessment, publishTeacherReview, saveMonthlyAssessment, saveTeacherReview } from "../lib/services/reporting.service";

const assignment = await prisma.teacherGroupAssignment.findFirstOrThrow({
  where: { isCurrent: true, endedAt: null, group: { enrollments: { some: { status: "ACTIVE", endedAt: null } } } },
  select: { teacherId: true, group: { select: { id: true, academicPeriodId: true, enrollments: { where: { status: "ACTIVE", endedAt: null }, take: 1, select: { studentId: true } }, course: { select: { skillCategories: { orderBy: { order: "asc" }, select: { skillCategoryId: true } } } } } } },
});
const studentId = assignment.group.enrollments[0].studentId;
const relation = await prisma.parentStudentRelation.findFirstOrThrow({ where: { studentId, archivedAt: null }, select: { parentId: true } });
const actor = { userId: assignment.teacherId, role: "TEACHER" as const };
const year = 2026, month = 8;

const draft = await saveMonthlyAssessment({ studentId, groupId: assignment.group.id, teacherId: assignment.teacherId, academicPeriodId: assignment.group.academicPeriodId, year, month, scores: assignment.group.course.skillCategories.map((skill, index) => ({ skillCategoryId: skill.skillCategoryId, score: 7 + (index % 3) })) }, actor);
let skills = await getStudentSkillTrend(relation.parentId, studentId, "all");
assert.ok(!skills.points.some(point => point.key === "2026-08"), "Parent must not see draft assessment");
await publishMonthlyAssessment(draft.id, actor);
skills = await getStudentSkillTrend(relation.parentId, studentId, "all");
assert.ok(skills.points.some(point => point.key === "2026-08"), "Parent must see published assessment");

const reviewDraft = await saveTeacherReview({ studentId, groupId: assignment.group.id, teacherId: assignment.teacherId, academicPeriodId: assignment.group.academicPeriodId, year, month, achievements: "Уверенно использует изученную лексику.", improvements: "Продолжать развивать письменную речь.", recommendations: "Повторять новые слова небольшими блоками.", generalComment: "Стабильно работает на занятиях и выполняет рекомендации.", progressLevel: "STABLE" }, actor);
let reviews = await getParentReviewsAnalytics(relation.parentId, studentId, "all");
assert.ok(!reviews.items.some(item => item.year === year && item.month === month), "Parent must not see draft review");
await publishTeacherReview(reviewDraft.id, actor);
reviews = await getParentReviewsAnalytics(relation.parentId, studentId, "all");
assert.ok(reviews.items.some(item => item.year === year && item.month === month), "Parent must see published review");
const report = await getStudentMonthlyReport(relation.parentId, studentId, "all");
assert.equal(report?.month, month);
assert.ok(report?.review, "Published review must be included in the monthly report");

console.log("Reporting acceptance passed: draft isolation, publication, persistence and monthly report are correct.");
await prisma.$disconnect();
