import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const schemaPath = new URL("../prisma/schema.prisma", import.meta.url);
const migrationPath = new URL("../prisma/migrations/20260801000000_init_postgresql/migration.sql", import.meta.url);
const studentServicePath = new URL("../lib/services/student.service.ts", import.meta.url);

test("students are domain entities and not authentication users", async () => {
  const schema = await readFile(schemaPath, "utf8");
  const student = schema.match(/model Student \{([\s\S]*?)\n\}/)?.[1] ?? "";
  assert.ok(student.includes("parentRelations"));
  assert.ok(student.includes("enrollments"));
  assert.ok(!student.includes("email"));
  assert.ok(!student.includes("passwordHash"));
});

test("database enforces active relationship and enrollment invariants", async () => {
  const migration = await readFile(migrationPath, "utf8");
  assert.match(migration, /parent_student_relations_active_unique/);
  assert.match(migration, /parent_student_relations_one_primary/);
  assert.match(migration, /student_group_enrollments_one_active/);
  assert.match(migration, /academic_periods_one_current/);
});

test("student lifecycle writes happen in transactions with audit and history", async () => {
  const service = await readFile(studentServicePath, "utf8");
  assert.match(service, /prisma\.\$transaction/);
  assert.match(service, /learningHistoryEvent\.create/);
  assert.match(service, /writeAuditLog/);
  assert.match(service, /updateMany\(\{where:\{studentId,status:"ACTIVE"\}/);
});
