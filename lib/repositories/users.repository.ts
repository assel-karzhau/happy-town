import { prisma } from "../db/prisma";

export const publicUserSelect = { id:true, email:true, phone:true, firstName:true, lastName:true, middleName:true, role:true, status:true, createdAt:true, updatedAt:true, archivedAt:true } as const;

export const usersRepository = {
  findById: (id:string) => prisma.user.findUnique({ where:{id}, select:publicUserSelect }),
  listByRole: (role:"ADMIN"|"TEACHER"|"PARENT") => prisma.user.findMany({ where:{role,archivedAt:null}, select:publicUserSelect, orderBy:[{lastName:"asc"},{firstName:"asc"}] }),
};
