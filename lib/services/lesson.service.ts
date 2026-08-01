import { prisma } from "../db/prisma";
import { AppError } from "../errors/app-error";
import type { AuthenticatedActor } from "../permissions/actor";
import { requireRole } from "../permissions/actor";
import { createLessonSchema, saveAttendanceSchema } from "../validators";
import { writeAuditLog } from "./audit.service";

export async function createLesson(raw:unknown, actor:AuthenticatedActor|null) {
  const trusted=requireRole(actor,["ADMIN","TEACHER"]); const input=createLessonSchema.parse(raw);
  return prisma.$transaction(async tx=>{
    const [group,unit,topic,assignment]=await Promise.all([
      tx.group.findFirst({where:{id:input.groupId,archivedAt:null,status:{not:"ARCHIVED"}},select:{id:true,bookId:true,academicPeriodId:true}}),
      tx.unit.findFirst({where:{id:input.unitId,bookId:input.bookId,archivedAt:null},select:{id:true}}),
      tx.topic.findFirst({where:{id:input.topicId,unitId:input.unitId,archivedAt:null},select:{id:true}}),
      tx.teacherGroupAssignment.findFirst({where:{teacherId:input.teacherId,groupId:input.groupId,startedAt:{lte:input.lessonDate},OR:[{endedAt:null},{endedAt:{gte:input.lessonDate}}]},select:{id:true}}),
    ]);
    if(!group||!unit||!topic) throw new AppError("BUSINESS_RULE_VIOLATION","Учебник, раздел или тема не соответствуют группе",409);
    if(group.bookId!==input.bookId||group.academicPeriodId!==input.academicPeriodId) throw new AppError("BUSINESS_RULE_VIOLATION","Урок не соответствует программе группы",409);
    if(!assignment) throw new AppError("BUSINESS_RULE_VIOLATION","Учитель не назначен группе на дату урока",409);
    const lesson=await tx.lesson.create({data:input,select:{id:true,title:true,lessonDate:true,status:true,groupId:true,teacherId:true}});
    await writeAuditLog(tx,{actorUserId:trusted.userId,action:"CREATE",entityType:"Lesson",entityId:lesson.id,newData:lesson});
    return lesson;
  });
}

export async function saveAttendance(raw:unknown, actor:AuthenticatedActor|null) {
  const trusted=requireRole(actor,["ADMIN","TEACHER"]); const input=saveAttendanceSchema.parse(raw);
  return prisma.$transaction(async tx=>{
    const lesson=await tx.lesson.findFirst({where:{id:input.lessonId,archivedAt:null},select:{id:true,groupId:true,lessonDate:true,status:true}});
    if(!lesson) throw new AppError("NOT_FOUND","Урок не найден",404);
    const studentIds=input.entries.map(entry=>entry.studentId);
    const enrolled=await tx.studentGroupEnrollment.findMany({where:{studentId:{in:studentIds},groupId:lesson.groupId,startedAt:{lte:lesson.lessonDate},OR:[{endedAt:null},{endedAt:{gte:lesson.lessonDate}}]},select:{studentId:true}});
    const allowed=new Set(enrolled.map(row=>row.studentId));
    if(studentIds.some(studentId=>!allowed.has(studentId))) throw new AppError("BUSINESS_RULE_VIOLATION","Один или несколько учеников не состояли в группе на дату урока",409);
    const statuses=lesson.status==="CANCELLED"?input.entries.map(entry=>({...entry,status:"LESSON_CANCELLED" as const})):input.entries;
    for(const entry of statuses) await tx.attendance.upsert({where:{lessonId_studentId:{lessonId:lesson.id,studentId:entry.studentId}},create:{lessonId:lesson.id,studentId:entry.studentId,status:entry.status,comment:entry.comment,markedById:trusted.userId},update:{status:entry.status,comment:entry.comment,markedById:trusted.userId}});
    await writeAuditLog(tx,{actorUserId:trusted.userId,action:"UPDATE",entityType:"AttendanceBatch",entityId:lesson.id,newData:{entries:statuses.length}});
    return {lessonId:lesson.id,updated:statuses.length};
  });
}
