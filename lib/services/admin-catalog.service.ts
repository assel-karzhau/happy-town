import { z } from "zod";
import { prisma } from "../db/prisma";
import { AppError } from "../errors/app-error";
import type { AuthenticatedActor } from "../permissions/actor";
import { requireRole } from "../permissions/actor";
import type { AdminCatalogKind } from "../types/admin-api";
import { writeAuditLog } from "./audit.service";

const optionalText = z.string().trim().max(500).optional().nullable();
const statusSchema = z.enum(["ACTIVE", "INACTIVE"]);

const bookCreateSchema = z.object({
  name:z.string().trim().min(1,"Укажите название").max(200), author:optionalText, publisher:optionalText,
  level:z.string().trim().min(1,"Укажите уровень").max(50), description:optionalText,
});
const bookUpdateSchema = bookCreateSchema.partial().extend({status:statusSchema.optional()});
const unitCreateSchema = z.object({bookId:z.string().uuid(),name:z.string().trim().min(1,"Укажите название").max(200),description:optionalText});
const unitUpdateSchema = z.object({name:z.string().trim().min(1).max(200).optional(),description:optionalText,status:statusSchema.optional()});
const skillCreateSchema = z.object({code:z.string().trim().min(1,"Укажите код").max(30).transform(value=>value.toUpperCase()),name:z.string().trim().min(1,"Укажите название").max(150),description:optionalText,isActive:z.boolean().default(true)});
const skillUpdateSchema = z.object({code:z.string().trim().min(1).max(30).transform(value=>value.toUpperCase()).optional(),name:z.string().trim().min(1).max(150).optional(),description:optionalText,isActive:z.boolean().optional()});

export async function createCatalogEntity(kind:AdminCatalogKind, raw:unknown, actor:AuthenticatedActor|null) {
  const trusted=requireRole(actor,["ADMIN"]);
  if(kind==="books") {
    const input=bookCreateSchema.parse(raw);
    return prisma.$transaction(async tx=>{
      const course=await tx.course.findFirst({where:{archivedAt:null,status:"ACTIVE"},select:{id:true},orderBy:{createdAt:"asc"}});
      if(!course)throw new AppError("BUSINESS_RULE_VIOLATION","Не найден базовый активный курс для системной привязки учебника",409);
      const created=await tx.book.create({data:{...input,courses:{create:{courseId:course.id,isPrimary:false}}},select:{id:true,name:true,author:true,publisher:true,level:true,description:true,status:true}});
      await writeAuditLog(tx,{actorUserId:trusted.userId,action:"CREATE",entityType:"Book",entityId:created.id,newData:created});
      return created;
    });
  }
  if(kind==="units") {
    const input=unitCreateSchema.parse(raw);
    return prisma.$transaction(async tx=>{
      const book=await tx.book.findFirst({where:{id:input.bookId,archivedAt:null,status:"ACTIVE"},select:{id:true}});
      if(!book)throw new AppError("NOT_FOUND","Активный учебник не найден",404);
      const last=await tx.unit.aggregate({where:{bookId:input.bookId},_max:{order:true}});
      const created=await tx.unit.create({data:{...input,order:(last._max.order??0)+1},select:{id:true,bookId:true,name:true,description:true,order:true,status:true}});
      await writeAuditLog(tx,{actorUserId:trusted.userId,action:"CREATE",entityType:"Unit",entityId:created.id,newData:created});
      return created;
    });
  }
  const input=skillCreateSchema.parse(raw);
  return prisma.$transaction(async tx=>{
    const last=await tx.skillCategory.aggregate({_max:{order:true}});
    const created=await tx.skillCategory.create({data:{...input,order:(last._max.order??0)+1},select:{id:true,code:true,name:true,description:true,isActive:true,order:true}});
    await writeAuditLog(tx,{actorUserId:trusted.userId,action:"CREATE",entityType:"SkillCategory",entityId:created.id,newData:created});
    return created;
  });
}

export async function updateCatalogEntity(kind:AdminCatalogKind, id:string, raw:unknown, actor:AuthenticatedActor|null) {
  const trusted=requireRole(actor,["ADMIN"]);
  return prisma.$transaction(async tx=>{
    if(kind==="books") {
      const input=bookUpdateSchema.parse(raw);
      const previous=await tx.book.findFirst({where:{id,archivedAt:null},select:{id:true,name:true,author:true,publisher:true,level:true,description:true,status:true}});
      if(!previous)throw new AppError("NOT_FOUND","Учебник не найден",404);
      const updated=await tx.book.update({where:{id},data:input,select:{id:true,name:true,author:true,publisher:true,level:true,description:true,status:true}});
      await writeAuditLog(tx,{actorUserId:trusted.userId,action:"UPDATE",entityType:"Book",entityId:id,previousData:previous,newData:updated});return updated;
    }
    if(kind==="units") {
      const input=unitUpdateSchema.parse(raw);
      const previous=await tx.unit.findFirst({where:{id,archivedAt:null},select:{id:true,bookId:true,name:true,description:true,status:true}});
      if(!previous)throw new AppError("NOT_FOUND","Раздел не найден",404);
      const updated=await tx.unit.update({where:{id},data:input,select:{id:true,bookId:true,name:true,description:true,status:true}});
      await writeAuditLog(tx,{actorUserId:trusted.userId,action:"UPDATE",entityType:"Unit",entityId:id,previousData:previous,newData:updated});return updated;
    }
    const input=skillUpdateSchema.parse(raw);
    const previous=await tx.skillCategory.findFirst({where:{id,archivedAt:null},select:{id:true,code:true,name:true,description:true,isActive:true}});
    if(!previous)throw new AppError("NOT_FOUND","Категория навыков не найдена",404);
    const updated=await tx.skillCategory.update({where:{id},data:input,select:{id:true,code:true,name:true,description:true,isActive:true}});
    await writeAuditLog(tx,{actorUserId:trusted.userId,action:"UPDATE",entityType:"SkillCategory",entityId:id,previousData:previous,newData:updated});return updated;
  });
}

export async function archiveCatalogEntity(kind:AdminCatalogKind, id:string, actor:AuthenticatedActor|null) {
  const trusted=requireRole(actor,["ADMIN"]),now=new Date();
  return prisma.$transaction(async tx=>{
    if(kind==="books") {
      const previous=await tx.book.findFirst({where:{id,archivedAt:null},select:{id:true,name:true,status:true}});
      if(!previous)throw new AppError("NOT_FOUND","Учебник не найден",404);
      const activeGroups=await tx.group.count({where:{bookId:id,archivedAt:null,status:{in:["RECRUITING","ACTIVE"]}}});
      if(activeGroups)throw new AppError("BUSINESS_RULE_VIOLATION",`Учебник используется в активных группах: ${activeGroups}`,409);
      const updated=await tx.book.update({where:{id},data:{status:"ARCHIVED",archivedAt:now},select:{id:true,name:true,status:true,archivedAt:true}});
      await writeAuditLog(tx,{actorUserId:trusted.userId,action:"ARCHIVE",entityType:"Book",entityId:id,previousData:previous,newData:updated});return updated;
    }
    if(kind==="units") {
      const previous=await tx.unit.findFirst({where:{id,archivedAt:null},select:{id:true,name:true,status:true}});
      if(!previous)throw new AppError("NOT_FOUND","Раздел не найден",404);
      const dependencies=await tx.topic.count({where:{unitId:id,archivedAt:null}});
      if(dependencies)throw new AppError("BUSINESS_RULE_VIOLATION",`Сначала архивируйте темы раздела: ${dependencies}`,409);
      const updated=await tx.unit.update({where:{id},data:{status:"ARCHIVED",archivedAt:now},select:{id:true,name:true,status:true,archivedAt:true}});
      await writeAuditLog(tx,{actorUserId:trusted.userId,action:"ARCHIVE",entityType:"Unit",entityId:id,previousData:previous,newData:updated});return updated;
    }
    const previous=await tx.skillCategory.findFirst({where:{id,archivedAt:null},select:{id:true,code:true,name:true,isActive:true}});
    if(!previous)throw new AppError("NOT_FOUND","Категория навыков не найдена",404);
    const updated=await tx.skillCategory.update({where:{id},data:{isActive:false,archivedAt:now},select:{id:true,code:true,name:true,isActive:true,archivedAt:true}});
    await writeAuditLog(tx,{actorUserId:trusted.userId,action:"ARCHIVE",entityType:"SkillCategory",entityId:id,previousData:previous,newData:updated});return updated;
  });
}
