import { requireUser, teacherCanAccessGroup } from "../../../../lib/auth/authorization";
import { apiError } from "../../../../lib/http/api-response";
import { prisma } from "../../../../lib/db/prisma";

export const runtime="nodejs"; export const dynamic="force-dynamic";
export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){try{const user=await requireUser(),{id}=await params;const allowed=user.role==="ADMIN"||user.role==="TEACHER"&&await teacherCanAccessGroup(user.userId,id);if(!allowed)return Response.json({ok:false,error:"Группа не найдена"},{status:404});const group=await prisma.group.findFirst({where:{id,archivedAt:null},select:{id:true,name:true,level:true,capacity:true,status:true,enrollments:{where:{status:"ACTIVE"},select:{student:{select:{id:true,firstName:true,lastName:true,currentLevel:true}}}}}});if(!group)return Response.json({ok:false,error:"Группа не найдена"},{status:404});return Response.json({ok:true,group});}catch(error){return apiError(error)}}
