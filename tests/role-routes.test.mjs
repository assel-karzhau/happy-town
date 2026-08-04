import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const teacher={"":"getTeacherDashboard","groups":"getTeacherGroups","students":"getTeacherStudents","attendance":"getTeacherAttendance","lessons":"getTeacherLessons","homework":"getTeacherHomework","words":"getTeacherWords","tests":"getTeacherTests","assessments":"getTeacherAssessments","reviews":"getTeacherReviews","profile":"getTeacherProfile"};
const parent={"":"getParentDashboard","topics":"getParentChildTopics","words":"getParentChildWords","homework":"getParentChildHomework","attendance":"getParentChildAttendance","tests":"getParentChildTests","progress":"getParentChildProgress","reviews":"getParentChildReviews","history":"getParentChildHistory","profile":"getParentProfile"};
const root=new URL("../app/",import.meta.url);

for(const [role,routes] of Object.entries({teacher,parent}))for(const [route,query] of Object.entries(routes))test(`${role}/${route||"dashboard"} has an independent server page`,async()=>{const url=new URL(`${role}/${route?`${route}/`:""}page.tsx`,root);await stat(url);const source=await readFile(url,"utf8");assert.match(source,new RegExp(`\\b${query}\\b`));assert.match(source,/require(Teacher|Parent)\(\)/);assert.match(source,/force-dynamic/);assert.doesNotMatch(source,/mock-data|mockData|TeacherDatabasePortal|ParentDatabasePortal/)});

test("dynamic detail routes use scoped queries",async()=>{for(const [path,query] of [["teacher/groups/[groupId]/page.tsx","getTeacherGroup"],["teacher/students/[studentId]/page.tsx","getTeacherStudent"]]){const source=await readFile(new URL(path,root),"utf8");assert.match(source,new RegExp(query));assert.match(source,/requireTeacher\(\)/)}});

test("teacher and parent menus point to their separate pages",async()=>{const shell=await readFile(new URL("../components/role-shell.tsx",import.meta.url),"utf8");for(const route of Object.keys(teacher).filter(Boolean))assert.match(shell,new RegExp(`/teacher/${route}`));for(const route of Object.keys(parent).filter(Boolean))assert.match(shell,new RegExp(`/parent/${route}`))});

test("role pages do not expose implementation language",async()=>{for(const file of ["../components/teacher-pages.tsx","../components/parent-pages.tsx","../components/role-shell.tsx"]){const source=await readFile(new URL(file,import.meta.url),"utf8");assert.doesNotMatch(source,/PostgreSQL|Prisma|API|server-side|таблиц[аы] БД|техническ/i)}});
