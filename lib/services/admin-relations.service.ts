import { z } from "zod";
import { prisma } from "../db/prisma";
import { AppError } from "../errors/app-error";
import type { AuthenticatedActor } from "../permissions/actor";
import { requireRole } from "../permissions/actor";
import { writeAuditLog } from "./audit.service";

const id=z.string().uuid();

export async function unlinkParentFromStudent(raw:unknown,actor:AuthenticatedActor|null){
  const trusted=requireRole(actor,["ADMIN"]),input=z.object({parentId:id,studentId:id}).parse(raw);
  return prisma.$transaction(async tx=>{
    const relation=await tx.parentStudentRelation.findFirst({where:{parentId:input.parentId,studentId:input.studentId,archivedAt:null},select:{id:true,parentId:true,studentId:true,relationType:true,isPrimary:true}});
    if(!relation) throw new AppError("NOT_FOUND","Активная связь не найдена",404);
    const now=new Date(); await tx.parentStudentRelation.update({where:{id:relation.id},data:{archivedAt:now,isPrimary:false}});
    await tx.learningHistoryEvent.create({data:{studentId:input.studentId,eventType:"PARENT_UNLINKED",eventDate:now,actorUserId:trusted.userId,title:"Представитель отвязан",previousData:relation}});
    await writeAuditLog(tx,{actorUserId:trusted.userId,action:"UNLINK",entityType:"ParentStudentRelation",entityId:relation.id,previousData:relation,newData:{archivedAt:now}});
    return {id:relation.id,archivedAt:now};
  });
}

export async function assignTeacherToGroup(raw:unknown,actor:AuthenticatedActor|null){
  const trusted=requireRole(actor,["ADMIN"]),input=z.object({teacherId:id,groupId:id,startedAt:z.coerce.date().default(()=>new Date())}).parse(raw);
  return prisma.$transaction(async tx=>{
    const [teacher,group,current]=await Promise.all([
      tx.user.findFirst({where:{id:input.teacherId,role:"TEACHER",status:"ACTIVE",archivedAt:null},select:{id:true}}),
      tx.group.findFirst({where:{id:input.groupId,archivedAt:null},select:{id:true}}),
      tx.teacherGroupAssignment.findFirst({where:{groupId:input.groupId,isCurrent:true,endedAt:null},select:{id:true,teacherId:true}}),
    ]);
    if(!teacher||!group) throw new AppError("NOT_FOUND","Учитель или группа не найдены",404);
    if(current?.teacherId===input.teacherId) throw new AppError("CONFLICT","Учитель уже назначен этой группе",409);
    if(current) await tx.teacherGroupAssignment.update({where:{id:current.id},data:{isCurrent:false,endedAt:input.startedAt}});
    const assignment=await tx.teacherGroupAssignment.create({data:input,select:{id:true,teacherId:true,groupId:true,startedAt:true}});
    const students=await tx.studentGroupEnrollment.findMany({where:{groupId:input.groupId,status:"ACTIVE"},select:{studentId:true}});
    if(students.length) await tx.learningHistoryEvent.createMany({data:students.map(({studentId})=>({studentId,eventType:"TEACHER_CHANGED" as const,eventDate:input.startedAt,actorUserId:trusted.userId,groupId:input.groupId,teacherId:input.teacherId,title:"Назначен новый учитель"}))});
    await writeAuditLog(tx,{actorUserId:trusted.userId,action:"LINK",entityType:"TeacherGroupAssignment",entityId:assignment.id,previousData:current,newData:assignment}); return assignment;
  });
}

export async function endTeacherAssignment(raw:unknown,actor:AuthenticatedActor|null){
  const trusted=requireRole(actor,["ADMIN"]),input=z.object({groupId:id,endedAt:z.coerce.date().default(()=>new Date())}).parse(raw);
  return prisma.$transaction(async tx=>{
    const current=await tx.teacherGroupAssignment.findFirst({where:{groupId:input.groupId,isCurrent:true,endedAt:null},select:{id:true,teacherId:true,groupId:true}});
    if(!current) throw new AppError("NOT_FOUND","Активное назначение не найдено",404);
    const ended=await tx.teacherGroupAssignment.update({where:{id:current.id},data:{isCurrent:false,endedAt:input.endedAt},select:{id:true,teacherId:true,groupId:true,endedAt:true}});
    await writeAuditLog(tx,{actorUserId:trusted.userId,action:"UNLINK",entityType:"TeacherGroupAssignment",entityId:current.id,previousData:current,newData:ended}); return ended;
  });
}

export async function removeStudentFromGroup(raw:unknown,actor:AuthenticatedActor|null){
  const trusted=requireRole(actor,["ADMIN"]),input=z.object({studentId:id,groupId:id,reason:z.string().trim().min(3).max(500).default("Завершено администратором")}).parse(raw);
  return prisma.$transaction(async tx=>{
    const enrollment=await tx.studentGroupEnrollment.findFirst({where:{studentId:input.studentId,groupId:input.groupId,status:"ACTIVE"},select:{id:true,studentId:true,groupId:true,startedAt:true}});
    if(!enrollment) throw new AppError("NOT_FOUND","Активное зачисление не найдено",404);
    const now=new Date(); const ended=await tx.studentGroupEnrollment.update({where:{id:enrollment.id},data:{status:"COMPLETED",endedAt:now,transferReason:input.reason},select:{id:true,status:true,endedAt:true}});
    await tx.learningHistoryEvent.create({data:{studentId:input.studentId,eventType:"GROUP_COMPLETED",eventDate:now,actorUserId:trusted.userId,groupId:input.groupId,title:"Обучение в группе завершено",description:input.reason,previousData:enrollment,newData:ended}});
    await writeAuditLog(tx,{actorUserId:trusted.userId,action:"UNLINK",entityType:"StudentGroupEnrollment",entityId:enrollment.id,previousData:enrollment,newData:ended}); return ended;
  });
}
