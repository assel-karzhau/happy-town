import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("the committed environment template contains no connection strings or seed credentials", async () => {
  const env = await read(".env.example");
  for (const key of ["DATABASE_URL", "DIRECT_URL", "AUTH_SECRET", "SEED_ADMIN_IIN", "SEED_ADMIN_PASSWORD", "SEED_TEACHER_IIN", "SEED_TEACHER_PASSWORD", "SEED_PARENT_IIN", "SEED_PARENT_PASSWORD"]) {
    assert.match(env, new RegExp(`^${key}=$`, "m"));
  }
});

test("local seeding does not embed passwords or IIN credentials in source", async () => {
  const seed = await read("prisma/seed.ts");
  assert.match(seed, /requiredSeedValue\("SEED_ADMIN_PASSWORD"\)/);
  assert.doesNotMatch(seed, /HappyTown-(Admin|Teacher|Parent)-\d{4}/);
  assert.doesNotMatch(seed, /00000000000[123]/);
});

test("teacher archive actions use an application confirmation dialog", async () => {
  const menu = await read("components/shared/teacher-action-menu.tsx");
  assert.doesNotMatch(menu, /window\.confirm/);
  assert.match(menu, /confirmingArchive/);
  assert.match(menu, /Переместить в архив\?/);
});

test("production admin routes use explicit real-data mapping without legacy mock fallbacks", async () => {
  const [route, shell, repository] = await Promise.all([
    read("app/[role]/[[...slug]]/page.tsx"),
    read("components/admin-shell.tsx"),
    read("lib/repositories/admin.repository.ts"),
  ]);
  for (const page of ["books", "units", "topics", "skills", "history", "profile"]) assert.match(route, new RegExp(`\"${page}\"`));
  assert.doesNotMatch(route, /"courses"/);
  assert.match(route, /if\(!adminPages\.has\(page\)\) notFound\(\)/);
  assert.doesNotMatch(route, /from "[^\"]*admin-portal";|mock-data/);
  assert.doesNotMatch(shell, /from "\.\/admin-portal";|mock-data/);
  assert.match(repository, /prisma\.(course|book|unit|topic|skillCategory|learningHistoryEvent)\.findMany/);
});
