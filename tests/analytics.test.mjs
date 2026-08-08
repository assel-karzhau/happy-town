import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const service = await readFile(new URL("../lib/services/student-analytics.service.ts", import.meta.url), "utf8");
const reporting = await readFile(new URL("../lib/services/reporting.service.ts", import.meta.url), "utf8");
const calculations = await readFile(new URL("../lib/analytics/calculations.ts", import.meta.url), "utf8");
const parentPages = await readFile(new URL("../components/parent-analytics-pages.tsx", import.meta.url), "utf8");

test("parent analytics rechecks the parent-child relationship", () => {
  assert.match(service, /requireParentStudent\(parentId, studentId\)/);
  assert.match(service, /parentStudentRelation\.findFirst/);
  assert.match(service, /parentProfile:\s*\{\s*isNot:\s*null/);
});

test("parent analytics exposes only published monthly content and completed tests", () => {
  assert.match(service, /status:\s*"PUBLISHED", publishedAt:\s*\{ not:\s*null \}/);
  assert.match(service, /status:\s*"COMPLETED", archivedAt:\s*null/);
});

test("attendance explicitly excludes cancelled lessons", () => {
  assert.match(calculations, /status !== "LESSON_CANCELLED"/);
  assert.match(calculations, /present \+ late/);
});

test("monthly publication requires every active course skill", () => {
  assert.match(reporting, /expected\.size!==received\.size/);
  assert.match(reporting, /score>=1&&item\.score<=10/);
  assert.match(reporting, /Ученик больше не состоит в группе/);
});

test("parent analytics uses real responsive charts and a shared period selector", () => {
  assert.match(parentPages, /ResponsiveContainer/);
  assert.match(parentPages, /Последние 3 месяца/);
  assert.match(parentPages, /Текущий учебный год/);
  assert.match(parentPages, /Сводный месячный отчёт/);
});
