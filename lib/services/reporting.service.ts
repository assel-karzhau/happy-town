import { prisma } from "../db/prisma";
import { AppError } from "../errors/app-error";
import type { AuthenticatedActor } from "../permissions/actor";
import { requireRole } from "../permissions/actor";
import { monthlyAssessmentSchema, teacherReviewSchema, testResultSchema } from "../validators";
import { writeAuditLog } from "./audit.service";

export async function saveTestResult(raw:unknown, actor:AuthenticatedActor|null) {
  const trusted=requireRole(actor,["ADMIN","TEACHER"]), input=testResultSchema.parse(raw);
  return prisma.$transaction(async tx=>{
    const test=await tx.test.findFirst({where:{id:input.testId,archivedAt:null},select:{id:true,groupId:true,maxScore:true}}); if(!test) throw new AppError("NOT_FOUND","Тест не найден",404);
    if(Number(test.maxScore)!==input.maxScore) throw new AppError("BUSINESS_RULE_VIOLATION","Максимальный балл не совпадает с тестом",409);
    const enrollment=await tx.studentGroupEnrollment.findFirst({where:{studentId:input.studentId,groupId:test.groupId},select:{id:true}}); if(!enrollment) throw new AppError("BUSINESS_RULE_VIOLATION","Ученик не зачислен в группу теста",409);
    const saved=await tx.testResult.upsert({where:{testId_studentId:{testId:input.testId,studentId:input.studentId}},create:{...input,assessedById:trusted.userId},update:{score:input.score,maxScore:input.maxScore,teacherComment:input.teacherComment,assessedById:trusted.userId},select:{id:true,testId:true,studentId:true,score:true,maxScore:true,updatedAt:true}});
    await writeAuditLog(tx,{actorUserId:trusted.userId,action:"UPDATE",entityType:"TestResult",entityId:saved.id,newData:saved}); return saved;
  });
}

export async function saveMonthlyAssessment(raw:unknown, actor:AuthenticatedActor|null) {
  const trusted=requireRole(actor,["ADMIN","TEACHER"]), input=monthlyAssessmentSchema.parse(raw);
  return prisma.$transaction(async tx=>{
    const assessment=await tx.monthlyAssessment.upsert({where:{studentId_year_month_groupId:{studentId:input.studentId,year:input.year,month:input.month,groupId:input.groupId}},create:{studentId:input.studentId,groupId:input.groupId,teacherId:input.teacherId,academicPeriodId:input.academicPeriodId,year:input.year,month:input.month},update:{teacherId:input.teacherId,academicPeriodId:input.academicPeriodId,status:"DRAFT",publishedAt:null},select:{id:true,studentId:true,groupId:true,year:true,month:true,status:true}});
    for(const score of input.scores) await tx.monthlySkillScore.upsert({where:{assessmentId_skillCategoryId:{assessmentId:assessment.id,skillCategoryId:score.skillCategoryId}},create:{assessmentId:assessment.id,...score},update:{score:score.score,teacherComment:score.teacherComment}});
    await writeAuditLog(tx,{actorUserId:trusted.userId,action:"UPDATE",entityType:"MonthlyAssessment",entityId:assessment.id,newData:{...assessment,scoreCount:input.scores.length}}); return assessment;
  });
}

export async function saveTeacherReview(raw:unknown, actor:AuthenticatedActor|null) {
  const trusted=requireRole(actor,["ADMIN","TEACHER"]), input=teacherReviewSchema.parse(raw);
  return prisma.$transaction(async tx=>{
    const review=await tx.teacherReview.upsert({where:{studentId_groupId_year_month:{studentId:input.studentId,groupId:input.groupId,year:input.year,month:input.month}},create:input,update:{...input,status:"DRAFT",publishedAt:null,archivedAt:null},select:{id:true,studentId:true,groupId:true,year:true,month:true,progressLevel:true,status:true}});
    await writeAuditLog(tx,{actorUserId:trusted.userId,action:"UPDATE",entityType:"TeacherReview",entityId:review.id,newData:review}); return review;
  });
}

export async function publishMonthlyAssessment(assessmentId:string, actor:AuthenticatedActor|null) {
  const trusted=requireRole(actor,["ADMIN","TEACHER"]);
  return prisma.$transaction(async tx=>{
    const assessment=await tx.monthlyAssessment.findUnique({where:{id:assessmentId},select:{id:true,studentId:true,groupId:true,status:true,skillScores:{select:{id:true}}}});
    if(!assessment) throw new AppError("NOT_FOUND","Оценка не найдена",404);
    if(!assessment.skillScores.length) throw new AppError("BUSINESS_RULE_VIOLATION","Добавьте хотя бы одну оценку навыка",409);
    const publishedAt=new Date();
    const published=await tx.monthlyAssessment.update({where:{id:assessmentId},data:{status:"PUBLISHED",publishedAt},select:{id:true,status:true,publishedAt:true}});
    await writeAuditLog(tx,{actorUserId:trusted.userId,action:"PUBLISH",entityType:"MonthlyAssessment",entityId:assessmentId,previousData:{status:assessment.status},newData:published});
    return published;
  });
}

export async function publishTeacherReview(reviewId:string, actor:AuthenticatedActor|null) {
  const trusted=requireRole(actor,["ADMIN","TEACHER"]);
  return prisma.$transaction(async tx=>{
    const review=await tx.teacherReview.findFirst({where:{id:reviewId,archivedAt:null},select:{id:true,studentId:true,groupId:true,status:true,achievements:true,improvements:true,recommendations:true,generalComment:true}});
    if(!review) throw new AppError("NOT_FOUND","Отзыв не найден",404);
    if(![review.achievements,review.improvements,review.recommendations,review.generalComment].some(value=>value?.trim())) throw new AppError("BUSINESS_RULE_VIOLATION","Нельзя публиковать пустой отзыв",409);
    const publishedAt=new Date();
    const published=await tx.teacherReview.update({where:{id:reviewId},data:{status:"PUBLISHED",publishedAt},select:{id:true,status:true,publishedAt:true}});
    await tx.learningHistoryEvent.create({data:{studentId:review.studentId,eventType:"REVIEW_PUBLISHED",eventDate:publishedAt,actorUserId:trusted.userId,groupId:review.groupId,title:"Опубликован ежемесячный отзыв"}});
    await writeAuditLog(tx,{actorUserId:trusted.userId,action:"PUBLISH",entityType:"TeacherReview",entityId:reviewId,previousData:{status:review.status},newData:published});
    return published;
  });
}
