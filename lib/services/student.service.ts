import { prisma } from "../db/prisma";
import { AppError } from "../errors/app-error";
import type { AuthenticatedActor } from "../permissions/actor";
import { requireRole } from "../permissions/actor";
import { linkParentSchema, transferStudentSchema } from "../validators";
import { writeAuditLog } from "./audit.service";

export async function linkParentToStudent(raw:unknown, actor:AuthenticatedActor|null) {
  const trusted=requireRole(actor,["ADMIN"]); const input=linkParentSchema.parse(raw);
  return prisma.$transaction(async tx=>{
    const [parent,student]=await Promise.all([tx.user.findFirst({where:{id:input.parentId,role:"PARENT",archivedAt:null},select:{id:true}}),tx.student.findFirst({where:{id:input.studentId,archivedAt:null},select:{id:true}})]);
    if(!parent||!student) throw new AppError("NOT_FOUND","Родитель или ученик не найден",404);
    const existing=await tx.parentStudentRelation.findFirst({where:{parentId:input.parentId,studentId:input.studentId,archivedAt:null},select:{id:true}});
    if(existing) throw new AppError("CONFLICT","Активная связь уже существует",409);
    if(input.isPrimary) await tx.parentStudentRelation.updateMany({where:{studentId:input.studentId,isPrimary:true,archivedAt:null},data:{isPrimary:false}});
    const relation=await tx.parentStudentRelation.create({data:input,select:{id:true,parentId:true,studentId:true,relationType:true,isPrimary:true,createdAt:true}});
    await tx.learningHistoryEvent.create({data:{studentId:input.studentId,eventType:"PARENT_LINKED",eventDate:new Date(),actorUserId:trusted.userId,title:"Привязан представитель",newData:{parentId:input.parentId,relationType:input.relationType,isPrimary:input.isPrimary}}});
    await writeAuditLog(tx,{actorUserId:trusted.userId,action:"LINK",entityType:"ParentStudentRelation",entityId:relation.id,newData:relation});
    return relation;
  });
}

export async function transferStudent(raw:unknown, actor:AuthenticatedActor|null) {
  const trusted=requireRole(actor,["ADMIN"]); const input=transferStudentSchema.parse(raw);
  return prisma.$transaction(async tx=>{
    const student=await tx.student.findFirst({where:{id:input.studentId,archivedAt:null,status:"ACTIVE"},select:{id:true}});
    const target=await tx.group.findFirst({where:{id:input.targetGroupId,archivedAt:null,status:{in:["RECRUITING","ACTIVE"]}},select:{id:true,capacity:true,_count:{select:{enrollments:{where:{status:"ACTIVE"}}}}}});
    if(!student||!target) throw new AppError("NOT_FOUND","Ученик или целевая группа не найдены",404);
    if(target._count.enrollments>=target.capacity) throw new AppError("BUSINESS_RULE_VIOLATION","В группе нет свободных мест",409);
    const current=await tx.studentGroupEnrollment.findFirst({where:{studentId:input.studentId,status:"ACTIVE"},select:{id:true,groupId:true,startedAt:true}});
    if(current?.groupId===input.targetGroupId) throw new AppError("CONFLICT","Ученик уже состоит в этой группе",409);
    if(current) await tx.studentGroupEnrollment.update({where:{id:current.id},data:{status:"TRANSFERRED",endedAt:input.transferDate,transferReason:input.reason}});
    const enrollment=await tx.studentGroupEnrollment.create({data:{studentId:input.studentId,groupId:input.targetGroupId,startedAt:input.transferDate,status:"ACTIVE",transferReason:input.reason},select:{id:true,groupId:true,startedAt:true,status:true}});
    await tx.learningHistoryEvent.create({data:{studentId:input.studentId,eventType:"GROUP_TRANSFERRED",eventDate:input.transferDate,actorUserId:trusted.userId,groupId:input.targetGroupId,title:"Перевод в другую группу",description:input.reason,previousData:current?{groupId:current.groupId,enrollmentId:current.id}:undefined,newData:{groupId:input.targetGroupId,enrollmentId:enrollment.id}}});
    await writeAuditLog(tx,{actorUserId:trusted.userId,action:"TRANSFER",entityType:"Student",entityId:input.studentId,previousData:current,newData:enrollment,metadata:{reason:input.reason}});
    return enrollment;
  });
}

export async function archiveStudent(studentId:string, reason:string, actor:AuthenticatedActor|null) {
  const trusted=requireRole(actor,["ADMIN"]);
  return prisma.$transaction(async tx=>{
    const student=await tx.student.findFirst({where:{id:studentId,archivedAt:null},select:{id:true,status:true,currentLevel:true}});
    if(!student) throw new AppError("NOT_FOUND","Ученик не найден",404);
    const now=new Date();
    await tx.studentGroupEnrollment.updateMany({where:{studentId,status:"ACTIVE"},data:{status:"COMPLETED",endedAt:now,transferReason:reason}});
    const archived=await tx.student.update({where:{id:studentId},data:{status:"ARCHIVED",archivedAt:now},select:{id:true,status:true,archivedAt:true}});
    await tx.learningHistoryEvent.create({data:{studentId,eventType:"STUDENT_ARCHIVED",eventDate:now,actorUserId:trusted.userId,title:"Ученик архивирован",description:reason,previousData:student,newData:archived}});
    await writeAuditLog(tx,{actorUserId:trusted.userId,action:"ARCHIVE",entityType:"Student",entityId:studentId,previousData:student,newData:archived,metadata:{reason}});
    return archived;
  });
}
