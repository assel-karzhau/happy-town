import { prisma } from "../db/prisma";
import { hash } from "bcryptjs";
import { AppError } from "../errors/app-error";
import type { AuthenticatedActor } from "../permissions/actor";
import { requireRole } from "../permissions/actor";
import { createGroupSchema, createStudentSchema, createUserSchema, homeworkSchema, testSchema, updateGroupSchema, updateHomeworkSchema, updateStudentSchema, updateTestSchema, updateUserSchema } from "../validators";
import { writeAuditLog } from "./audit.service";
import { requireTeacherGroupAccess } from "./ownership.service";

const publicUser = { id:true,email:true,phone:true,firstName:true,lastName:true,middleName:true,role:true,status:true,createdAt:true,updatedAt:true,archivedAt:true } as const;

export async function createUser(raw:unknown, actor:AuthenticatedActor|null) {
  const trusted=requireRole(actor,["ADMIN"]), input=createUserSchema.parse(raw);
  return prisma.$transaction(async tx=>{
    const {password,...profile}=input; const passwordHash=await hash(password,12);
    const created=await tx.user.create({data:{...profile,passwordHash,teacherProfile:input.role==="TEACHER"?{create:{}}:undefined,parentProfile:input.role==="PARENT"?{create:{}}:undefined},select:publicUser});
    await writeAuditLog(tx,{actorUserId:trusted.userId,action:"CREATE",entityType:"User",entityId:created.id,newData:created}); return created;
  });
}

export async function updateUser(userId:string, raw:unknown, actor:AuthenticatedActor|null) {
  const trusted=requireRole(actor,["ADMIN"]), input=updateUserSchema.parse(raw);
  return prisma.$transaction(async tx=>{
    const previous=await tx.user.findFirst({where:{id:userId,archivedAt:null},select:publicUser});
    if(!previous) throw new AppError("NOT_FOUND","Пользователь не найден",404);
    const {password,...profile}=input; const passwordHash=password?await hash(password,12):undefined;
    const updated=await tx.user.update({where:{id:userId},data:{...profile,passwordHash},select:publicUser});
    await writeAuditLog(tx,{actorUserId:trusted.userId,action:"UPDATE",entityType:"User",entityId:userId,previousData:previous,newData:updated}); return updated;
  });
}

export async function archiveUser(userId:string, actor:AuthenticatedActor|null) {
  const trusted=requireRole(actor,["ADMIN"]);
  if(userId===trusted.userId) throw new AppError("BUSINESS_RULE_VIOLATION","Нельзя архивировать текущего пользователя",409);
  return prisma.$transaction(async tx=>{
    const previous=await tx.user.findFirst({where:{id:userId,archivedAt:null},select:publicUser}); if(!previous) throw new AppError("NOT_FOUND","Пользователь не найден",404);
    const now=new Date();
    if(previous.role==="TEACHER") await tx.teacherGroupAssignment.updateMany({where:{teacherId:userId,isCurrent:true},data:{isCurrent:false,endedAt:now}});
    const updated=await tx.user.update({where:{id:userId},data:{status:"ARCHIVED",archivedAt:now},select:publicUser});
    await writeAuditLog(tx,{actorUserId:trusted.userId,action:"ARCHIVE",entityType:"User",entityId:userId,previousData:previous,newData:updated}); return updated;
  });
}

export async function restoreUser(userId:string, actor:AuthenticatedActor|null) {
  const trusted=requireRole(actor,["ADMIN"]);
  return prisma.$transaction(async tx=>{
    const previous=await tx.user.findFirst({where:{id:userId,archivedAt:{not:null}},select:publicUser});
    if(!previous) throw new AppError("NOT_FOUND","Архивный пользователь не найден",404);
    const restored=await tx.user.update({where:{id:userId},data:{status:"ACTIVE",archivedAt:null},select:publicUser});
    await writeAuditLog(tx,{actorUserId:trusted.userId,action:"RESTORE",entityType:"User",entityId:userId,previousData:previous,newData:restored});
    return restored;
  });
}

export async function createStudent(raw:unknown, actor:AuthenticatedActor|null) {
  const trusted=requireRole(actor,["ADMIN"]), input=createStudentSchema.parse(raw);
  return prisma.$transaction(async tx=>{
    const created=await tx.student.create({data:input,select:{id:true,firstName:true,lastName:true,status:true,currentLevel:true,createdAt:true}});
    await tx.learningHistoryEvent.create({data:{studentId:created.id,eventType:"STUDENT_CREATED",eventDate:new Date(),actorUserId:trusted.userId,title:"Ученик создан"}});
    await writeAuditLog(tx,{actorUserId:trusted.userId,action:"CREATE",entityType:"Student",entityId:created.id,newData:created}); return created;
  });
}

export async function updateStudent(studentId:string, raw:unknown, actor:AuthenticatedActor|null) {
  const trusted=requireRole(actor,["ADMIN"]), input=updateStudentSchema.parse(raw);
  return prisma.$transaction(async tx=>{
    const previous=await tx.student.findFirst({where:{id:studentId,archivedAt:null},select:{id:true,firstName:true,lastName:true,status:true,currentLevel:true,note:true}}); if(!previous) throw new AppError("NOT_FOUND","Ученик не найден",404);
    const updated=await tx.student.update({where:{id:studentId},data:input,select:{id:true,firstName:true,lastName:true,status:true,currentLevel:true,note:true,updatedAt:true}});
    await writeAuditLog(tx,{actorUserId:trusted.userId,action:"UPDATE",entityType:"Student",entityId:studentId,previousData:previous,newData:updated}); return updated;
  });
}

export async function restoreStudent(studentId:string, actor:AuthenticatedActor|null) {
  const trusted=requireRole(actor,["ADMIN"]);
  return prisma.$transaction(async tx=>{
    const previous=await tx.student.findFirst({where:{id:studentId,archivedAt:{not:null}},select:{id:true,status:true,archivedAt:true}});
    if(!previous) throw new AppError("NOT_FOUND","Архивный ученик не найден",404);
    const restored=await tx.student.update({where:{id:studentId},data:{status:"ACTIVE",archivedAt:null},select:{id:true,status:true,archivedAt:true}});
    await tx.learningHistoryEvent.create({data:{studentId,eventType:"STUDENT_RESTORED",eventDate:new Date(),actorUserId:trusted.userId,title:"Ученик восстановлен"}});
    await writeAuditLog(tx,{actorUserId:trusted.userId,action:"RESTORE",entityType:"Student",entityId:studentId,previousData:previous,newData:restored}); return restored;
  });
}

export async function createGroup(raw:unknown, actor:AuthenticatedActor|null) {
  const trusted=requireRole(actor,["ADMIN"]), input=createGroupSchema.parse(raw);
  return prisma.$transaction(async tx=>{
    const link=await tx.courseBook.findUnique({where:{courseId_bookId:{courseId:input.courseId,bookId:input.bookId}},select:{id:true}}); if(!link) throw new AppError("BUSINESS_RULE_VIOLATION","Учебник не входит в выбранный курс",409);
    const created=await tx.group.create({data:input,select:{id:true,name:true,level:true,capacity:true,status:true,startDate:true,endDate:true}});
    await writeAuditLog(tx,{actorUserId:trusted.userId,action:"CREATE",entityType:"Group",entityId:created.id,newData:created}); return created;
  });
}

export async function updateGroup(groupId:string, raw:unknown, actor:AuthenticatedActor|null) {
  const trusted=requireRole(actor,["ADMIN"]), input=updateGroupSchema.parse(raw);
  return prisma.$transaction(async tx=>{
    const previous=await tx.group.findFirst({where:{id:groupId,archivedAt:null},select:{id:true,name:true,level:true,capacity:true,status:true,endDate:true,note:true}}); if(!previous) throw new AppError("NOT_FOUND","Группа не найдена",404);
    const updated=await tx.group.update({where:{id:groupId},data:input,select:{id:true,name:true,level:true,capacity:true,status:true,endDate:true,note:true}});
    await writeAuditLog(tx,{actorUserId:trusted.userId,action:"UPDATE",entityType:"Group",entityId:groupId,previousData:previous,newData:updated}); return updated;
  });
}

export async function archiveGroup(groupId:string, actor:AuthenticatedActor|null) {
  const trusted=requireRole(actor,["ADMIN"]);
  return prisma.$transaction(async tx=>{
    const active=await tx.studentGroupEnrollment.count({where:{groupId,status:"ACTIVE"}}); if(active) throw new AppError("BUSINESS_RULE_VIOLATION","Сначала завершите активные зачисления",409);
    const updated=await tx.group.update({where:{id:groupId},data:{status:"ARCHIVED",archivedAt:new Date()},select:{id:true,status:true,archivedAt:true}});
    await writeAuditLog(tx,{actorUserId:trusted.userId,action:"ARCHIVE",entityType:"Group",entityId:groupId,newData:updated}); return updated;
  });
}

export async function restoreGroup(groupId:string, actor:AuthenticatedActor|null) {
  const trusted=requireRole(actor,["ADMIN"]);
  return prisma.$transaction(async tx=>{
    const previous=await tx.group.findFirst({where:{id:groupId,archivedAt:{not:null}},select:{id:true,status:true,archivedAt:true}});
    if(!previous) throw new AppError("NOT_FOUND","Архивная группа не найдена",404);
    const restored=await tx.group.update({where:{id:groupId},data:{status:"RECRUITING",archivedAt:null},select:{id:true,status:true,archivedAt:true}});
    await writeAuditLog(tx,{actorUserId:trusted.userId,action:"RESTORE",entityType:"Group",entityId:groupId,previousData:previous,newData:restored}); return restored;
  });
}

export async function createHomework(raw:unknown, actor:AuthenticatedActor|null) {
  const trusted=requireRole(actor,["ADMIN","TEACHER"]), input=homeworkSchema.parse(raw);
  return prisma.$transaction(async tx=>{
    await requireTeacherGroupAccess(tx,trusted,input.groupId);
    const created=await tx.homework.create({data:{...input,createdById:trusted.userId},select:{id:true,groupId:true,title:true,dueDate:true,createdAt:true}});
    const students=await tx.studentGroupEnrollment.findMany({where:{groupId:input.groupId,status:"ACTIVE"},select:{studentId:true}});
    if(students.length) await tx.studentHomeworkStatus.createMany({data:students.map(({studentId})=>({homeworkId:created.id,studentId})),skipDuplicates:true});
    await writeAuditLog(tx,{actorUserId:trusted.userId,action:"CREATE",entityType:"Homework",entityId:created.id,newData:created}); return created;
  });
}

export async function updateHomework(homeworkId:string, raw:unknown, actor:AuthenticatedActor|null) {
  const trusted=requireRole(actor,["ADMIN","TEACHER"]), input=updateHomeworkSchema.parse(raw);
  return prisma.$transaction(async tx=>{ const current=await tx.homework.findFirst({where:{id:homeworkId,archivedAt:null},select:{groupId:true}}); if(!current)throw new AppError("NOT_FOUND","Домашнее задание не найдено",404);await requireTeacherGroupAccess(tx,trusted,current.groupId);const updated=await tx.homework.update({where:{id:homeworkId},data:input,select:{id:true,title:true,dueDate:true,updatedAt:true}}); await writeAuditLog(tx,{actorUserId:trusted.userId,action:"UPDATE",entityType:"Homework",entityId:homeworkId,newData:updated}); return updated; });
}

export async function archiveHomework(homeworkId:string, actor:AuthenticatedActor|null) {
  const trusted=requireRole(actor,["ADMIN","TEACHER"]); return prisma.$transaction(async tx=>{const current=await tx.homework.findFirst({where:{id:homeworkId,archivedAt:null},select:{groupId:true}});if(!current)throw new AppError("NOT_FOUND","Домашнее задание не найдено",404);await requireTeacherGroupAccess(tx,trusted,current.groupId);const updated=await tx.homework.update({where:{id:homeworkId},data:{archivedAt:new Date()},select:{id:true,archivedAt:true}}); await writeAuditLog(tx,{actorUserId:trusted.userId,action:"ARCHIVE",entityType:"Homework",entityId:homeworkId,newData:updated}); return updated; });
}

export async function createTest(raw:unknown, actor:AuthenticatedActor|null) {
  const trusted=requireRole(actor,["ADMIN","TEACHER"]), input=testSchema.parse(raw); return prisma.$transaction(async tx=>{await requireTeacherGroupAccess(tx,trusted,input.groupId);const created=await tx.test.create({data:{...input,createdById:trusted.userId},select:{id:true,groupId:true,title:true,testDate:true,maxScore:true,status:true}}); await writeAuditLog(tx,{actorUserId:trusted.userId,action:"CREATE",entityType:"Test",entityId:created.id,newData:created}); return created; });
}

export async function updateTest(testId:string, raw:unknown, actor:AuthenticatedActor|null) {
  const trusted=requireRole(actor,["ADMIN","TEACHER"]), input=updateTestSchema.parse(raw); return prisma.$transaction(async tx=>{const current=await tx.test.findFirst({where:{id:testId,archivedAt:null},select:{groupId:true}});if(!current)throw new AppError("NOT_FOUND","Тест не найден",404);await requireTeacherGroupAccess(tx,trusted,current.groupId);const updated=await tx.test.update({where:{id:testId},data:input,select:{id:true,title:true,testDate:true,maxScore:true,status:true}}); await writeAuditLog(tx,{actorUserId:trusted.userId,action:"UPDATE",entityType:"Test",entityId:testId,newData:updated}); return updated; });
}

export async function archiveTest(testId:string, actor:AuthenticatedActor|null) {
  const trusted=requireRole(actor,["ADMIN","TEACHER"]); return prisma.$transaction(async tx=>{const current=await tx.test.findFirst({where:{id:testId,archivedAt:null},select:{groupId:true}});if(!current)throw new AppError("NOT_FOUND","Тест не найден",404);await requireTeacherGroupAccess(tx,trusted,current.groupId);const updated=await tx.test.update({where:{id:testId},data:{status:"ARCHIVED",archivedAt:new Date()},select:{id:true,status:true,archivedAt:true}}); await writeAuditLog(tx,{actorUserId:trusted.userId,action:"ARCHIVE",entityType:"Test",entityId:testId,newData:updated}); return updated; });
}
