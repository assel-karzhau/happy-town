import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const archiveServicePath = new URL("../lib/services/archive-delete.service.ts", import.meta.url);
const relationsServicePath = new URL("../lib/services/admin-relations.service.ts", import.meta.url);
const archiveRoutePath = new URL("../app/api/admin/archive/[kind]/[id]/route.ts", import.meta.url);
const portalPath = new URL("../components/portal.tsx", import.meta.url);
const adminPortalPath = new URL("../components/admin-database-portal.tsx", import.meta.url);

test("permanent archive deletion is admin-only, dependency-aware and audited", async () => {
  const service = await readFile(archiveServicePath, "utf8");
  assert.match(service, /requireRole\(actor,\["ADMIN"\]\)/);
  assert.match(service, /archivedAt:\{not:null\}/);
  assert.match(service, /if\(deletion\.blocked\)throw new AppError/);
  assert.match(service, /input\.confirmation!==deletion\.confirmation/);
  assert.match(service, /prisma\.\$transaction/);
  assert.match(service, /action:"DELETE"/);
  assert.doesNotMatch(service, /onDelete:\s*Cascade/);
});

test("archive API rechecks the authenticated admin on preview, restore and delete", async () => {
  const route = await readFile(archiveRoutePath, "utf8");
  assert.equal(route.match(/await requireAdmin\(\)/g)?.length, 3);
  assert.match(route, /permanentlyDeleteArchived/);
  assert.match(route, /restoreArchived/);
  assert.match(route, /getDeletePreview/);
});

test("batch roster changes enforce capacity and preserve transfer history", async () => {
  const service = await readFile(relationsServicePath, "utf8");
  assert.match(service, /addStudentsToGroup/);
  assert.match(service, /BUSINESS_RULE_VIOLATION/);
  assert.match(service, /group\.capacity/);
  assert.match(service, /GROUP_TRANSFERRED/);
  assert.match(service, /GROUP_ENROLLED/);
  assert.match(service, /writeAuditLog/);
});

test("admin mobile navigation separates people and more and exposes safe logout", async () => {
  const portal = await readFile(portalPath, "utf8");
  assert.match(portal, /sheet===\"people\"\?userItems:moreItems/);
  assert.match(portal, /\[\"teachers\",\"parents\",\"students\"\]/);
  assert.match(portal, /Выйти из аккаунта/);
  assert.match(portal, /Вы уверены, что хотите выйти из аккаунта/);
});

test("database people lists ship mobile cards and no technical UI labels", async () => {
  const portal = await readFile(adminPortalPath, "utf8");
  assert.match(portal, /className=\"admin-mobile-list\"/);
  assert.doesNotMatch(portal, /PostgreSQL|Prisma|Soft delete|Server Action/);
});
