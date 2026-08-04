import "dotenv/config";
import assert from "node:assert/strict";
import { prisma } from "../lib/db/prisma";
import { adminCanAccessAll, parentCanAccessStudent, teacherCanAccessGroup, teacherCanAccessStudent } from "../lib/auth/authorization";
import { requireRole } from "../lib/permissions/actor";
import { requireOwnTeacherIdentity, requireTeacherGroupAccess } from "../lib/services/ownership.service";

try {
  const teacher=await prisma.user.findFirstOrThrow({where:{role:"TEACHER",archivedAt:null,teacherAssignments:{some:{isCurrent:true,endedAt:null}}},select:{id:true,teacherAssignments:{where:{isCurrent:true,endedAt:null},take:1,select:{groupId:true,group:{select:{enrollments:{where:{status:"ACTIVE"},take:1,select:{studentId:true}}}}}}}});
  const parent=await prisma.user.findFirstOrThrow({where:{role:"PARENT",archivedAt:null,parentRelations:{some:{archivedAt:null}}},select:{id:true,parentRelations:{where:{archivedAt:null},take:1,select:{studentId:true}}}});
  const unrelatedStudent=await prisma.student.findFirstOrThrow({where:{id:{not:parent.parentRelations[0].studentId}},select:{id:true}});
  const unrelatedGroup=await prisma.group.findFirstOrThrow({where:{id:{not:teacher.teacherAssignments[0].groupId}},select:{id:true}});
  assert.equal(adminCanAccessAll("ADMIN"),true);
  assert.equal(await parentCanAccessStudent(parent.id,parent.parentRelations[0].studentId),true);
  assert.equal(await parentCanAccessStudent(parent.id,unrelatedStudent.id),false);
  assert.equal(await teacherCanAccessGroup(teacher.id,teacher.teacherAssignments[0].groupId),true);
  assert.equal(await teacherCanAccessGroup(teacher.id,unrelatedGroup.id),false);
  assert.equal(await teacherCanAccessStudent(teacher.id,teacher.teacherAssignments[0].group.enrollments[0].studentId),true);
  await prisma.$transaction(tx=>requireTeacherGroupAccess(tx,{userId:teacher.id,role:"TEACHER"},teacher.teacherAssignments[0].groupId));
  await assert.rejects(
    prisma.$transaction(tx=>requireTeacherGroupAccess(tx,{userId:teacher.id,role:"TEACHER"},unrelatedGroup.id)),
    (error:unknown)=>Boolean(error&&typeof error==="object"&&"status" in error&&error.status===404),
  );
  assert.throws(()=>requireOwnTeacherIdentity({userId:teacher.id,role:"TEACHER"},parent.id),/Запись не найдена/);
  assert.throws(()=>requireRole({userId:parent.id,role:"PARENT"},["ADMIN"]),/Недостаточно прав/);
  console.log("Access verification passed: role and ownership boundaries are enforced.");
} finally { await prisma.$disconnect(); }
