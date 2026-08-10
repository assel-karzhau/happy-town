import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("uses one bundled font and an edge-to-edge mobile viewport", async () => {
  const layout = await read("app/layout.tsx");
  const styles = await read("app/globals.css");

  assert.match(layout, /@fontsource-variable\/inter/);
  assert.match(layout, /viewportFit:\s*"cover"/);
  assert.match(styles, /"Inter Variable"/);
  assert.match(styles, /-webkit-text-size-adjust:100%/);
  assert.match(styles, /min-height:100dvh/);
  assert.match(styles, /env\(safe-area-inset-bottom\)/);
  assert.match(styles, /input,select,textarea\{font-size:16px\}/);
  assert.match(styles, /-webkit-backdrop-filter/);
});

test("pins the cloned-project toolchain and line endings", async () => {
  const packageJson = JSON.parse(await read("package.json"));
  const nvmrc = (await read(".nvmrc")).trim();
  const nodeVersion = (await read(".node-version")).trim();
  const attributes = await read(".gitattributes");

  assert.equal(packageJson.packageManager, "npm@11.13.0");
  assert.equal(packageJson.dependencies["@fontsource-variable/inter"], "5.3.0");
  assert.equal(nvmrc, "24.16.0");
  assert.equal(nodeVersion, nvmrc);
  assert.match(attributes, /\* text=auto eol=lf/);
});
