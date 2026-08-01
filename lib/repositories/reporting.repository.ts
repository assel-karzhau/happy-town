import { prisma } from "../db/prisma";

export const reportingRepository = {
  listTestsForGroup: (groupId:string) => prisma.test.findMany({ where:{groupId,archivedAt:null}, select:{id:true,title:true,testDate:true,maxScore:true,status:true,_count:{select:{results:true}}}, orderBy:{testDate:"desc"} }),
  listAssessmentsForStudent: (studentId:string) => prisma.monthlyAssessment.findMany({ where:{studentId}, select:{id:true,year:true,month:true,status:true,publishedAt:true,group:{select:{id:true,name:true}},skillScores:{select:{score:true,skillCategory:{select:{code:true,name:true}}}}}, orderBy:[{year:"desc"},{month:"desc"}] }),
  listReviewsForStudent: (studentId:string) => prisma.teacherReview.findMany({ where:{studentId,archivedAt:null}, select:{id:true,year:true,month:true,status:true,progressLevel:true,achievements:true,improvements:true,recommendations:true,generalComment:true,publishedAt:true}, orderBy:[{year:"desc"},{month:"desc"}] }),
  listHistory: (studentId:string) => prisma.learningHistoryEvent.findMany({ where:{studentId}, select:{id:true,eventType:true,eventDate:true,title:true,description:true,previousData:true,newData:true}, orderBy:{eventDate:"desc"} }),
};
