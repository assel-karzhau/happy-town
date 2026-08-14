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

test("parent and teacher profiles no longer expose or edit email", async () => {
  const [teacherPage,parentPage,editor,shell,service] = await Promise.all([
    read("components/teacher-pages.tsx"),read("components/parent-pages.tsx"),read("components/profile-editor.tsx"),read("components/role-shell.tsx"),read("lib/services/teacher-content.service.ts"),
  ]);
  for (const source of [teacherPage,parentPage,editor,shell]) assert.doesNotMatch(source, /<dt>Email|<span>Email|name="email"|user\.email/);
  const profileUpdate=service.slice(service.indexOf("export async function updateOwnProfile"));
  assert.doesNotMatch(profileUpdate, /email/);
  assert.match(profileUpdate, /firstName/);
  assert.match(profileUpdate, /phone/);
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
  assert.doesNotMatch(manager, /<span>Автор<\/span>|<span>Издательство<\/span>|setAuthor|setPublisher/);
  assert.doesNotMatch(service, /базовый активный курс|courses:\{create/);
  assert.match(service, /tx\.book\.create\(\{data:input/);
});

test("admin mobile menu exposes logout and catalog layout has mobile overrides", async () => {
  const [shell,css] = await Promise.all([read("components/admin-shell.tsx"),read("app/globals.css")]);
  assert.match(shell, /className="mobile-logout"/);
  assert.match(shell, /className="drawer-logout"/);
  assert.match(shell, /admin-logout-dialog/);
  assert.match(css, /\.catalog-entity-grid\{grid-template-columns:1fr/);
  assert.match(css, /\.admin-layout \.mobile-more-sheet nav>\.mobile-logout/);
});
