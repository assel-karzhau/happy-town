import { z } from "zod";
import { prisma } from "../db/prisma";
import { AppError } from "../errors/app-error";
import type { AuthenticatedActor } from "../permissions/actor";
import { requireRole } from "../permissions/actor";
import { writeAuditLog } from "./audit.service";
import { restoreGroup, restoreStudent, restoreUser } from "./management.service";

export const archiveKinds=["parents","teachers","students","groups","courses","books","units","topics"] as const;
export type ArchiveKind=(typeof archiveKinds)[number];
export type DeletePreview={kind:ArchiveKind;id:string;name:string;confirmation:string;dependencies:Record<string,number>;blocked:boolean};

const idSchema=z.string().uuid();
const dependencySum=(dependencies:Record<string,number>)=>Object.values(dependencies).reduce((sum,value)=>sum+value,0);
const preview=(kind:ArchiveKind,id:string,name:string,confirmation:string,dependencies:Record<string,number>):DeletePreview=>({kind,id,name,confirmation,dependencies,blocked:dependencySum(dependencies)>0});

export async function getDeletePreview(kind:ArchiveKind,rawId:string,actor:AuthenticatedActor|null):Promise<DeletePreview>{
  requireRole(actor,["ADMIN"]);const id=idSchema.parse(rawId);
  if(kind==="parents"||kind==="teachers"){
    const role=kind==="parents"?"PARENT":"TEACHER";
    const row=await prisma.user.findFirst({where:{id,role,archivedAt:{not:null}},select:{id:true,email:true,firstName:true,lastName:true,_count:{select:{parentRelations:true,teacherAssignments:true,lessonsTaught:true,attendanceMarked:true,homeworksCreated:true,homeworkChecks:true,wordsCreated:true,wordAssessments:true,testsCreated:true,testResultsAssessed:true,monthlyAssessments:true,teacherReviews:true,learningHistoryActions:true,learningHistoryTeacherRefs:true}}}});
    if(!row)throw new AppError("NOT_FOUND","Архивная запись не найдена",404);
    const c=row._count;const dependencies:Record<string,number>=kind==="parents"?{"Связи с детьми":c.parentRelations,"Действия в истории":c.learningHistoryActions}:{"Назначения группам":c.teacherAssignments,"Уроки":c.lessonsTaught,"Посещаемость":c.attendanceMarked,"Домашние задания":c.homeworksCreated+c.homeworkChecks,"Слова":c.wordsCreated+c.wordAssessments,"Тесты":c.testsCreated+c.testResultsAssessed,"Оценки и отзывы":c.monthlyAssessments+c.teacherReviews,"События истории":c.learningHistoryActions+c.learningHistoryTeacherRefs};
    return preview(kind,row.id,`${row.firstName} ${row.lastName}`,row.email??`${row.firstName} ${row.lastName}`,dependencies);
  }
  if(kind==="students"){
    const row=await prisma.student.findFirst({where:{id,archivedAt:{not:null}},select:{id:true,firstName:true,lastName:true,_count:{select:{parentRelations:true,enrollments:true,attendance:true,homeworkStatuses:true,wordProgress:true,testResults:true,monthlyAssessments:true,teacherReviews:true,learningHistory:true}}}});
    if(!row)throw new AppError("NOT_FOUND","Архивный ученик не найден",404);const c=row._count;
    return preview(kind,row.id,`${row.firstName} ${row.lastName}`,`${row.firstName} ${row.lastName}`,{"Родители":c.parentRelations,"Зачисления":c.enrollments,"Посещаемость":c.attendance,"Домашние задания":c.homeworkStatuses,"Слова":c.wordProgress,"Тесты":c.testResults,"Оценки и отзывы":c.monthlyAssessments+c.teacherReviews,"История обучения":c.learningHistory});
  }
  if(kind==="groups"){
    const row=await prisma.group.findFirst({where:{id,archivedAt:{not:null}},select:{id:true,name:true,_count:{select:{teacherAssignments:true,enrollments:true,lessons:true,homeworks:true,tests:true,assessments:true,reviews:true,historyEvents:true}}}});
    if(!row)throw new AppError("NOT_FOUND","Архивная группа не найдена",404);const c=row._count;
    return preview(kind,row.id,row.name,row.name,{"Учителя":c.teacherAssignments,"Зачисления":c.enrollments,"Уроки":c.lessons,"Домашние задания":c.homeworks,"Тесты":c.tests,"Оценки и отзывы":c.assessments+c.reviews,"История обучения":c.historyEvents});
  }
  if(kind==="courses"){
    const row=await prisma.course.findFirst({where:{id,archivedAt:{not:null}},select:{id:true,name:true,_count:{select:{books:true,groups:true,skillCategories:true}}}});if(!row)throw new AppError("NOT_FOUND","Архивный курс не найден",404);
    return preview(kind,row.id,row.name,row.name,{"Учебники":row._count.books,"Группы":row._count.groups,"Категории навыков":row._count.skillCategories});
  }
  if(kind==="books"){
    const row=await prisma.book.findFirst({where:{id,archivedAt:{not:null}},select:{id:true,name:true,_count:{select:{courses:true,units:true,groups:true,lessons:true,homeworks:true,historyEvents:true}}}});if(!row)throw new AppError("NOT_FOUND","Архивный учебник не найден",404);const c=row._count;
    return preview(kind,row.id,row.name,row.name,{"Курсы":c.courses,"Разделы":c.units,"Группы":c.groups,"Уроки":c.lessons,"Домашние задания":c.homeworks,"История обучения":c.historyEvents});
  }
  if(kind==="units"){
    const row=await prisma.unit.findFirst({where:{id,archivedAt:{not:null}},select:{id:true,name:true,_count:{select:{topics:true,lessons:true,tests:true,historyEvents:true}}}});if(!row)throw new AppError("NOT_FOUND","Архивный раздел не найден",404);const c=row._count;
    return preview(kind,row.id,row.name,row.name,{"Темы":c.topics,"Уроки":c.lessons,"Тесты":c.tests,"История обучения":c.historyEvents});
  }
  const row=await prisma.topic.findFirst({where:{id,archivedAt:{not:null}},select:{id:true,name:true,_count:{select:{lessons:true,words:true}}}});if(!row)throw new AppError("NOT_FOUND","Архивная тема не найдена",404);
  return preview(kind,row.id,row.name,row.name,{"Уроки":row._count.lessons,"Слова":row._count.words});
}

export async function permanentlyDeleteArchived(kind:ArchiveKind,rawId:string,raw:unknown,actor:AuthenticatedActor|null){
  const trusted=requireRole(actor,["ADMIN"]),input=z.object({confirmation:z.string().trim().min(1).max(300)}).parse(raw);const deletion=await getDeletePreview(kind,rawId,trusted);
  if(deletion.blocked)throw new AppError("BUSINESS_RULE_VIOLATION","Запись связана с учебной историей. Оставьте её в архиве.",409);
  if(input.confirmation!==deletion.confirmation)throw new AppError("VALIDATION_ERROR","Контрольное значение не совпадает",400);
  await prisma.$transaction(async tx=>{
    if(kind==="parents"){await tx.parentProfile.deleteMany({where:{userId:deletion.id}});await tx.user.delete({where:{id:deletion.id}});}
    else if(kind==="teachers"){await tx.teacherProfile.deleteMany({where:{userId:deletion.id}});await tx.user.delete({where:{id:deletion.id}});}
    else if(kind==="students")await tx.student.delete({where:{id:deletion.id}});
    else if(kind==="groups")await tx.group.delete({where:{id:deletion.id}});
    else if(kind==="courses")await tx.course.delete({where:{id:deletion.id}});
    else if(kind==="books")await tx.book.delete({where:{id:deletion.id}});
    else if(kind==="units")await tx.unit.delete({where:{id:deletion.id}});
    else await tx.topic.delete({where:{id:deletion.id}});
    await writeAuditLog(tx,{actorUserId:trusted.userId,action:"DELETE",entityType:kind,entityId:deletion.id,previousData:{name:deletion.name,archived:true},metadata:{permanent:true}});
  });
  return {id:deletion.id,deleted:true};
}

export async function restoreArchived(kind:ArchiveKind,rawId:string,actor:AuthenticatedActor|null){
  const trusted=requireRole(actor,["ADMIN"]),id=idSchema.parse(rawId);
  if(kind==="parents"||kind==="teachers")return restoreUser(id,trusted);
  if(kind==="students")return restoreStudent(id,trusted);
  if(kind==="groups")return restoreGroup(id,trusted);
  await getDeletePreview(kind,id,trusted);
  return prisma.$transaction(async tx=>{
    // Prisma's generated delegates have model-specific overloads, so use a
    // narrow branch while keeping the transaction and audit atomic.
    let restored:{id:string;name:string;archivedAt:Date|null};
    if(kind==="courses")restored=await tx.course.update({where:{id},data:{status:"ACTIVE",archivedAt:null},select:{id:true,name:true,archivedAt:true}});
    else if(kind==="books")restored=await tx.book.update({where:{id},data:{status:"ACTIVE",archivedAt:null},select:{id:true,name:true,archivedAt:true}});
    else if(kind==="units")restored=await tx.unit.update({where:{id},data:{status:"ACTIVE",archivedAt:null},select:{id:true,name:true,archivedAt:true}});
    else restored=await tx.topic.update({where:{id},data:{status:"ACTIVE",archivedAt:null},select:{id:true,name:true,archivedAt:true}});
    await writeAuditLog(tx,{actorUserId:trusted.userId,action:"RESTORE",entityType:kind,entityId:id,newData:restored});return restored;
  });
}
