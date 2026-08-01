import { prisma } from "../db/prisma";

export const learningRepository = {
  listLessonsForGroup: (groupId:string) => prisma.lesson.findMany({ where:{groupId,archivedAt:null}, select:{id:true,lessonDate:true,lessonType:true,title:true,status:true,topic:{select:{id:true,name:true}},teacher:{select:{id:true,firstName:true,lastName:true}}}, orderBy:{lessonDate:"desc"} }),
  listAttendanceForLesson: (lessonId:string) => prisma.attendance.findMany({ where:{lessonId}, select:{id:true,status:true,comment:true,student:{select:{id:true,firstName:true,lastName:true}},updatedAt:true} }),
  listHomeworksForGroup: (groupId:string) => prisma.homework.findMany({ where:{groupId,archivedAt:null}, select:{id:true,title:true,description:true,dueDate:true,page:true,exercises:true,_count:{select:{studentStatuses:true}}}, orderBy:{createdAt:"desc"} }),
};
