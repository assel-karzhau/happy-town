import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("clean installs generate the custom-output Prisma Client before typecheck", async () => {
  const packageJson = JSON.parse(await read("package.json"));
  const workflow = await read(".github/workflows/quality.yml");
  const schema = await read("prisma/schema.prisma");
  const prismaConfig = await read("prisma.config.ts");

  assert.equal(packageJson.scripts.postinstall, "prisma generate");
  assert.equal(packageJson.scripts["db:generate"], "prisma generate");
  assert.match(schema, /provider\s*=\s*"prisma-client"/);
  assert.match(schema, /output\s*=\s*"\.\.\/generated\/prisma"/);
  assert.doesNotMatch(prismaConfig, /env\("DATABASE_URL"\)/);

  const generateStep = workflow.indexOf("run: npm run db:generate");
  const typecheckStep = workflow.indexOf("run: npm run typecheck");
  assert.ok(generateStep >= 0, "workflow must generate Prisma Client");
  assert.ok(typecheckStep > generateStep, "Prisma generation must run before typecheck");
  assert.match(
    workflow,
    /Build[\s\S]*DATABASE_URL:\s*postgresql:\/\/ci:ci@127\.0\.0\.1:5432\/happy_town_ci/,
  );
});
