import "dotenv/config";
import assert from "node:assert/strict";
import { prisma } from "../lib/db/prisma";
import { getStudentProgressSummary } from "../lib/services/student-analytics.service";
import { saveMonthlyAssessment } from "../lib/services/reporting.service";

const relations = await prisma.parentStudentRelation.findMany({ where: { archivedAt: null }, take: 2, select: { parentId: true, studentId: true } });
assert.equal(relations.length, 2, "Need two parent-child relations for the access check");
await assert.rejects(() => getStudentProgressSummary(relations[0].parentId, relations[1].studentId, "all"));

const assignment = await prisma.teacherGroupAssignment.findFirstOrThrow({ where: { isCurrent: true, endedAt: null }, select: { teacherId: true, groupId: true } });
const foreignGroup = await prisma.group.findFirstOrThrow({ where: { id: { not: assignment.groupId }, archivedAt: null, teacherAssignments: { none: { teacherId: assignment.teacherId, isCurrent: true, endedAt: null } }, enrollments: { some: { status: "ACTIVE", endedAt: null } } }, select: { id: true, academicPeriodId: true, enrollments: { where: { status: "ACTIVE", endedAt: null }, take: 1, select: { studentId: true } }, course: { select: { skillCategories: { take: 1, select: { skillCategoryId: true } } } } } });
await assert.rejects(() => saveMonthlyAssessment({ studentId: foreignGroup.enrollments[0].studentId, groupId: foreignGroup.id, teacherId: assignment.teacherId, academicPeriodId: foreignGroup.academicPeriodId, year: 2026, month: 8, scores: [{ skillCategoryId: foreignGroup.course.skillCategories[0].skillCategoryId, score: 8 }] }, { userId: assignment.teacherId, role: "TEACHER" }));

const scoreRange = await prisma.monthlySkillScore.aggregate({ _min: { score: true }, _max: { score: true } });
assert.ok((scoreRange._min.score ?? 1) >= 1 && (scoreRange._max.score ?? 10) <= 10, "Monthly skills must use the 1-10 scale");

const own = relations[0], analytics = await getStudentProgressSummary(own.parentId, own.studentId, "all");
const rawWords = await prisma.studentWordProgress.count({ where: { studentId: own.studentId, status: { in: ["MASTERED", "CONFIDENT"] } } });
assert.equal(analytics.kpis.masteredWords, rawWords, "Vocabulary KPI must match source rows");

console.log("Analytics verification passed: ownership, score range and source aggregates are consistent.");
await prisma.$disconnect();
