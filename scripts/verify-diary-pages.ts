import "dotenv/config";
import assert from "node:assert/strict";
import { prisma } from "../lib/db/prisma";
import * as teacherPages from "../lib/repositories/teacher-pages.repository";
import * as parentPages from "../lib/repositories/parent-pages.repository";

try{
  const teacher=await prisma.user.findFirstOrThrow({where:{role:"TEACHER",status:"ACTIVE",archivedAt:null,teacherAssignments:{some:{isCurrent:true,endedAt:null}}},select:{id:true}});
  const groups=await teacherPages.getTeacherGroups(teacher.id);assert.ok(groups.length,"У учителя должна быть назначенная группа");
  const teacherResults=await Promise.all([teacherPages.getTeacherDashboard(teacher.id),teacherPages.getTeacherStudents(teacher.id),teacherPages.getTeacherAttendance(teacher.id),teacherPages.getTeacherLessons(teacher.id),teacherPages.getTeacherHomework(teacher.id),teacherPages.getTeacherWords(teacher.id),teacherPages.getTeacherTests(teacher.id),teacherPages.getTeacherAssessments(teacher.id),teacherPages.getTeacherReviews(teacher.id),teacherPages.getTeacherProfile(teacher.id),teacherPages.getTeacherGroup(teacher.id,groups[0].id)]);
  const students=await teacherPages.getTeacherStudents(teacher.id);if(students[0])await teacherPages.getTeacherStudent(teacher.id,students[0].id);
  for(const result of teacherResults)assert.ok(result);

  const parent=await prisma.user.findFirstOrThrow({where:{role:"PARENT",status:"ACTIVE",archivedAt:null,parentRelations:{some:{archivedAt:null}}},select:{id:true}}),children=await parentPages.getParentChildren(parent.id);assert.ok(children.children.length,"У родителя должен быть привязанный ребёнок");const childId=children.children[0].id;
  const parentResults=await Promise.all([parentPages.getParentDashboard(parent.id,childId),parentPages.getParentChildTopics(parent.id,childId),parentPages.getParentChildWords(parent.id,childId),parentPages.getParentChildHomework(parent.id,childId),parentPages.getParentChildAttendance(parent.id,childId),parentPages.getParentChildTests(parent.id,childId),parentPages.getParentChildProgress(parent.id,childId),parentPages.getParentChildReviews(parent.id,childId),parentPages.getParentChildHistory(parent.id,childId),parentPages.getParentProfile(parent.id)]);for(const result of parentResults)assert.ok(result);
  const foreign=await prisma.student.findFirst({where:{parentRelations:{none:{parentId:parent.id,archivedAt:null}}},select:{id:true}});if(foreign)await assert.rejects(()=>parentPages.getParentDashboard(parent.id,foreign.id));
  console.log(`Diary verification passed: teacher routes=${teacherResults.length+2}, parent routes=${parentResults.length}, children=${children.children.length}.`);
}finally{await prisma.$disconnect()}
