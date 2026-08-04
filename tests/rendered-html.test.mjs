import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

test("routes the product root through the authenticated role", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /await auth\(\)/);
  assert.match(page, /"\/login"/);
});

test("ships product metadata and removes the starter preview", async () => {
  const [page, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);
  assert.match(page, /await auth\(\)/);
  assert.match(layout, /Happy Town — управление учебным центром/);
  assert.match(layout, /\/og-admin\.png/);
  assert.doesNotMatch(layout, /codex-preview|_sites-preview|Starter Project/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  const previewFiles = await readdir(new URL("../app/_sites-preview", import.meta.url)).catch(() => []);
  assert.deepEqual(previewFiles, []);
});
