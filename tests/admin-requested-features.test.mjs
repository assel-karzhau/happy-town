import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("parent and teacher registration do not request email and temporary passwords are revealable", async () => {
  const [portal, validators] = await Promise.all([read("components/admin-database-portal.tsx"),read("lib/validators/index.ts")]);
  assert.match(portal, /kind==="teachers"&&item&&<label><span>Email<\/span>/);
  assert.match(portal, /email:item&&kind==="teachers"\?email\|\|null:null/);
  assert.match(portal, /showPassword\?"text":"password"/);
  assert.match(portal, /Показать пароль/);
  assert.match(validators, /value\.role==="ADMIN"&&!value\.email/);
});

test("group editor hides course and academic period while roster mutations keep the dialog open", async () => {
  const portal = await read("components/admin-database-portal.tsx");
  assert.doesNotMatch(portal, /<span>Курс(?: \*)?<\/span>/);
  assert.doesNotMatch(portal, /<span>Учебный период(?: \*)?<\/span>/);
  assert.match(portal, /onChanged=\{message=>\{notify\(message\);refresh\(\)\}\}/);
  assert.match(portal, /setMemberIds\(current=>current\.filter/);
});

test("admin catalog CRUD is authenticated, role-protected and audited", async () => {
  const [createRoute,itemRoute,service,manager] = await Promise.all([
    read("app/api/admin/catalog/route.ts"),read("app/api/admin/catalog/[kind]/[id]/route.ts"),read("lib/services/admin-catalog.service.ts"),read("components/admin-catalog-manager.tsx"),
  ]);
  assert.match(createRoute, /await requireAdmin\(\)/);
  assert.equal(itemRoute.match(/await requireAdmin\(\)/g)?.length,2);
  assert.match(service, /requireRole\(actor,\["ADMIN"\]\)/);
  assert.match(service, /action:"CREATE"/);
  assert.match(service, /action:"UPDATE"/);
  assert.match(service, /action:"ARCHIVE"/);
  for (const kind of ["books","units","skills"]) assert.match(manager,new RegExp(`${kind}:\\{`));
  assert.match(manager, /Добавить учебник/);
  assert.match(manager, /Добавить раздел/);
  assert.match(manager, /Добавить категорию/);
});

test("admin mobile menu exposes logout and catalog layout has mobile overrides", async () => {
  const [shell,css] = await Promise.all([read("components/admin-shell.tsx"),read("app/globals.css")]);
  assert.match(shell, /className="mobile-logout"/);
  assert.match(shell, /className="drawer-logout"/);
  assert.match(shell, /admin-logout-dialog/);
  assert.match(css, /\.catalog-entity-grid\{grid-template-columns:1fr/);
  assert.match(css, /\.admin-layout \.mobile-more-sheet nav>\.mobile-logout/);
});
