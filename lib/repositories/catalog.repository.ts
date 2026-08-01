import { prisma } from "../db/prisma";

export const catalogRepository = {
  listAcademicPeriods: () => prisma.academicPeriod.findMany({ where:{archivedAt:null}, select:{id:true,name:true,type:true,startDate:true,endDate:true,status:true,isCurrent:true}, orderBy:{startDate:"desc"} }),
  listSkillCategories: () => prisma.skillCategory.findMany({ where:{archivedAt:null}, select:{id:true,code:true,name:true,description:true,order:true,isActive:true}, orderBy:{order:"asc"} }),
  listGroups: () => prisma.group.findMany({ where:{archivedAt:null}, select:{id:true,name:true,level:true,capacity:true,status:true,startDate:true,endDate:true,course:{select:{id:true,name:true}},book:{select:{id:true,name:true}},academicPeriod:{select:{id:true,name:true}},teacherAssignments:{where:{isCurrent:true},select:{teacher:{select:{id:true,firstName:true,lastName:true}}},take:1},_count:{select:{enrollments:{where:{status:"ACTIVE"}}}}}, orderBy:{name:"asc"} }),
};
