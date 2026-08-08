import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read=(path)=>readFileSync(new URL(`../${path}`,import.meta.url),"utf8");

test("credentials authentication uses IIN and never serializes it",()=>{
  const auth=read("auth.ts");
  assert.match(auth,/credentials:\s*\{\s*iin:/);
  assert.match(auth,/where:\s*\{\s*iin:/);
  assert.doesNotMatch(auth,/where:\s*\{\s*email:/);
  assert.doesNotMatch(auth,/token\.iin|session\.user\.iin/);
  assert.doesNotMatch(auth,/metadata:\s*\{[^}]*iin|metadata:\s*\{[^}]*email/);
});

test("login form accepts only twelve digits and uses a generic error",()=>{
  const login=read("components/login-form.tsx");
  assert.match(login,/inputMode="numeric"/);
  assert.match(login,/maxLength=\{12\}/);
  assert.match(login,/replace\(\/\\D\/g,""\)/);
  assert.match(login,/\u041d\u0435\u0432\u0435\u0440\u043d\u044b\u0439 \u0418\u0418\u041d \u0438\u043b\u0438 \u043f\u0430\u0440\u043e\u043b\u044c/);
  assert.doesNotMatch(login,/type="email"|\u041d\u0435\u0432\u0435\u0440\u043d\u044b\u0439 email \u0438\u043b\u0438 \u043f\u0430\u0440\u043e\u043b\u044c/);
});

test("IIN migration preserves AcademicPeriod and admin navigation has no periods route",()=>{
  const migration=read("prisma/migrations/20260805000000_user_iin_login/migration.sql");
  const schema=read("prisma/schema.prisma");
  const shell=read("components/admin-shell.tsx");
  const route=read("app/[role]/[[...slug]]/page.tsx");
  assert.match(migration,/ADD COLUMN "iin" VARCHAR\(12\)/);
  assert.match(migration,/CREATE UNIQUE INDEX "users_iin_key"/);
  assert.match(schema,/model AcademicPeriod \{/);
  assert.doesNotMatch(shell,/periods/);
  assert.match(route,/if\(!adminPages\.has\(page\)\) notFound\(\)/);
});

test("parent UI receives only a masked IIN",()=>{
  const repository=read("lib/repositories/parent-pages.repository.ts");
  const page=read("components/parent-pages.tsx");
  assert.match(repository,/maskedIin:parent\.iin\?`\*\*\*\*\*\*\*\*\$\{parent\.iin\.slice\(-4\)\}`/);
  assert.match(page,/data\.parent\.maskedIin/);
  assert.doesNotMatch(page,/data\.parent\.iin/);
});
