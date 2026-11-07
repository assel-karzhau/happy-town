// Detect untranslated literal copy rendered in JSX. Dictionaries, fixtures, and
// server data are outside this scan; dynamic values require manual review.
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const roots = ["app", "components"];
const sourceFiles = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const name = path.join(dir, entry.name);
  return entry.isDirectory() ? sourceFiles(name) : /\.tsx$/.test(name) ? [name] : [];
});
const cyrillic = /[А-Яа-яЁё]/u;
const issues = [];
const warnings = [];
// These legacy modules have no source references today. Re-check that evidence
// on every run, including import(), require(), and named exports; a newly added
// reference promotes their findings to violations.
const legacyExports = {
  "components/teacher-portal.tsx": ["TeacherPortal"],
  "components/role-database-portal.tsx": ["TeacherDatabasePortal", "ParentDatabasePortal"],
  "components/teacher-record-actions.tsx": ["TeacherRecordActions"],
};
const referenceSources = ["app", "components", "lib", "scripts", "tests"].flatMap((dir) => {
  const walk = (name) => fs.readdirSync(name, { withFileTypes: true }).flatMap((entry) => {
    const next = path.join(name, entry.name);
    return entry.isDirectory() ? walk(next) : /\.(?:ts|tsx|js|mjs)$/.test(next) ? [next] : [];
  });
  return walk(dir);
}).filter((name) => !name.endsWith("check-i18n-coverage.mjs"));
function legacyIsReferenced(file) {
  const normalized = file.replaceAll("\\", "/");
  const names = legacyExports[normalized];
  if (!names) return true;
  const basename = path.basename(normalized, ".tsx");
  return referenceSources.some((other) => {
    if (other.replaceAll("\\", "/") === normalized) return false;
    const text = fs.readFileSync(other, "utf8");
    return text.includes(basename) || names.some((name) => new RegExp(`\\b(?:import|export)\\s*\\{[^}]*\\b${name}\\b[^}]*\\}`, "s").test(text));
  });
}
for (const file of roots.flatMap(sourceFiles)) {
  const referenced = legacyIsReferenced(file);
  const source = ts.createSourceFile(file, fs.readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  function visit(node, inJsx = false, inTranslation = false) {
    const jsx = inJsx || ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node);
    const translated = inTranslation || (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && ["t", "parentMessage", "teacherMessage", "adminMessage", "managementMessage", "countLabel"].includes(node.expression.text));
    const comparison = node.parent && ts.isBinaryExpression(node.parent) && [ts.SyntaxKind.EqualsEqualsToken, ts.SyntaxKind.EqualsEqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsToken, ts.SyntaxKind.ExclamationEqualsEqualsToken].includes(node.parent.operatorToken.kind);
    const languageName = file.replaceAll("\\", "/") === "components/i18n-provider.tsx" && node.text === "Русский";
    if (jsx && !translated && !comparison && !languageName && (ts.isJsxText(node) || ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) && cyrillic.test(node.text)) {
      // Literal values in expressions can be comparisons, request values, or
      // interface fallbacks. Flag them for review instead of silently ignoring them.
      const { line } = source.getLineAndCharacterOfPosition(node.getStart(source));
      (referenced ? issues : warnings).push(`${file}:${line + 1}: ${node.text.trim().replace(/\s+/g, " ")}`);
    }
    ts.forEachChild(node, (child) => visit(child, jsx, translated));
  }
  visit(source);
}
if (issues.length) console.log(`Active JSX literal violations:\n${issues.join("\n")}`);
if (warnings.length) console.log(`\nUnreferenced legacy module warnings:\n${warnings.join("\n")}`);
if (issues.length) {
  console.log(`\n${issues.length} active literal violations; ${warnings.length} legacy warnings. Dynamic strings and API errors require a separate audit.`);
  process.exitCode = 1;
} else {
  console.log(`No active JSX literal violations; ${warnings.length} legacy warnings. Dynamic strings and API errors still require review.`);
}
