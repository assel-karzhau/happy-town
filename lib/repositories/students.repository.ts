import { prisma } from "../db/prisma";

export const studentListSelect = { id:true, firstName:true, lastName:true, middleName:true, dateOfBirth:true, startedAt:true, status:true, currentLevel:true, archivedAt:true } as const;

export const studentsRepository = {
  listActive: () => prisma.student.findMany({ where:{archivedAt:null,status:"ACTIVE"}, select:studentListSelect, orderBy:[{lastName:"asc"},{firstName:"asc"}] }),
  findWithCurrentGroup: (id:string) => prisma.student.findUnique({ where:{id}, select:{...studentListSelect,enrollments:{where:{status:"ACTIVE"},select:{id:true,startedAt:true,group:{select:{id:true,name:true,level:true}}},take:1}} }),
};
