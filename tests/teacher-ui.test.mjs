import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const stylesPath = new URL("../app/globals.css", import.meta.url);
const pagesPath = new URL("../components/teacher-pages.tsx", import.meta.url);
const shellPath = new URL("../components/role-shell.tsx", import.meta.url);

test("teacher redesign stays scoped to the teacher shell", async () => {
  const [styles, shell] = await Promise.all([readFile(stylesPath, "utf8"), readFile(shellPath, "utf8")]);
  assert.match(shell, /\$\{role\}-layout/);
  assert.match(styles, /\.teacher-layout\{--teacher-radius/);
  assert.doesNotMatch(styles, /\.admin-layout\{--teacher-radius/);
});

test("teacher UI has desktop, tablet and narrow-mobile layouts", async () => {
  const styles = await readFile(stylesPath, "utf8");
  assert.match(styles, /@media\(max-width:1100px\)/);
  assert.match(styles, /@media\(max-width:760px\)/);
  assert.match(styles, /@media\(max-width:430px\)/);
  assert.match(styles, /\.teacher-layout \.teacher-group-grid\.cards\{grid-template-columns:repeat\(2/);
  assert.match(styles, /\.teacher-layout \.student-metrics\{grid-template-columns:1fr/);
});

test("dashboard activities and lesson actions use dedicated responsive structure", async () => {
  const pages = await readFile(pagesPath, "utf8");
  assert.match(pages, /recent-activity-card/);
  assert.match(pages, /<time dateTime=\{item\.createdAt\}>/);
  assert.match(pages, /student-learning-grid/);
});
