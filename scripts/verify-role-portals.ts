import "dotenv/config";
import assert from "node:assert/strict";
import { prisma } from "../lib/db/prisma";
import { getParentPortalData, getTeacherPortalData } from "../lib/repositories/role-portal.repository";

try {
  const parent = await prisma.user.findFirstOrThrow({ where: { role:"PARENT", status:"ACTIVE", archivedAt:null, parentRelations:{some:{archivedAt:null}} }, select:{id:true} });
  const parentData = await getParentPortalData(parent.id);
  const expectedChildren = await prisma.parentStudentRelation.findMany({ where:{parentId:parent.id,archivedAt:null,student:{archivedAt:null}}, select:{studentId:true} });
  assert.deepEqual(new Set(parentData.children.map(child=>child.id)),new Set(expectedChildren.map(row=>row.studentId)));

  const teacher = await prisma.user.findFirstOrThrow({ where: { role:"TEACHER", status:"ACTIVE", archivedAt:null, teacherAssignments:{some:{isCurrent:true,endedAt:null}} }, select:{id:true} });
  const teacherData = await getTeacherPortalData(teacher.id);
  const expectedGroups = await prisma.teacherGroupAssignment.findMany({ where:{teacherId:teacher.id,isCurrent:true,endedAt:null,group:{archivedAt:null,status:{in:["RECRUITING","ACTIVE"]}}}, select:{groupId:true} });
  assert.deepEqual(new Set(teacherData.groups.map(group=>group.id)),new Set(expectedGroups.map(row=>row.groupId)));
  for(const group of teacherData.groups){
    const expectedStudents=await prisma.studentGroupEnrollment.findMany({where:{groupId:group.id,status:"ACTIVE",endedAt:null,student:{archivedAt:null}},select:{studentId:true}});
    assert.deepEqual(new Set(group.students.map(student=>student.id)),new Set(expectedStudents.map(row=>row.studentId)));
  }
  console.log(`Role portal verification passed: parent children=${parentData.children.length}, teacher groups=${teacherData.groups.length}, teacher students=${teacherData.groups.flatMap(group=>group.students).length}.`);
} finally {
  await prisma.$disconnect();
}
