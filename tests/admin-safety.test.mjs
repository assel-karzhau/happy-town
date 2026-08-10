import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("permanent archive deletion is admin-only, dependency-aware and audited", async () => {
  const service = await read("lib/services/archive-delete.service.ts");
  assert.match(service, /requireRole\(actor,\["ADMIN"\]\)/);
  assert.match(service, /archivedAt:\{not:null\}/);
  assert.match(service, /if\(deletion\.blocked\)throw new AppError/);
  assert.match(service, /input\.confirmation!==deletion\.confirmation/);
  assert.match(service, /prisma\.\$transaction/);
  assert.match(service, /action:"DELETE"/);
  assert.doesNotMatch(service, /onDelete:\s*Cascade/);
});

test("archive API rechecks the authenticated admin on preview, restore and delete", async () => {
  const route = await read("app/api/admin/archive/[kind]/[id]/route.ts");
  assert.equal(route.match(/await requireAdmin\(\)/g)?.length, 3);
  assert.match(route, /permanentlyDeleteArchived/);
  assert.match(route, /restoreArchived/);
  assert.match(route, /getDeletePreview/);
});

test("batch roster changes enforce capacity and preserve transfer history", async () => {
  const service = await read("lib/services/admin-relations.service.ts");
  assert.match(service, /addStudentsToGroup/);
  assert.match(service, /BUSINESS_RULE_VIOLATION/);
  assert.match(service, /group\.capacity/);
  assert.match(service, /GROUP_TRANSFERRED/);
  assert.match(service, /GROUP_ENROLLED/);
  assert.match(service, /writeAuditLog/);
});

test("admin mobile navigation contains only explicit production pages and safe logout", async () => {
  const shell = await read("components/admin-shell.tsx");
  assert.match(shell, /const navigation:Array/);
  for (const page of ["books", "units", "skills", "history", "profile"]) assert.match(shell, new RegExp(`page:\\"${page}\\"`));
  assert.doesNotMatch(shell, /page:"courses"|label:"Курсы"/);
  assert.match(shell, /signOut\(\{callbackUrl:\"\/login\"\}\)/);
  assert.doesNotMatch(shell, /mock-data|from "\.\/admin-portal";/);
});

test("database people lists ship mobile cards and no technical UI labels", async () => {
  const portal = await read("components/admin-database-portal.tsx");
  assert.match(portal, /className="admin-mobile-list"/);
  assert.doesNotMatch(portal, /PostgreSQL|Prisma|Soft delete|Server Action/);
});
