import { requireUser, parentCanAccessStudent, teacherCanAccessStudent } from "../../../../lib/auth/authorization";
import { apiError } from "../../../../lib/http/api-response";
import { prisma } from "../../../../lib/db/prisma";

export const runtime="nodejs"; export const dynamic="force-dynamic";
export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){try{const user=await requireUser(),{id}=await params;const allowed=user.role==="ADMIN"||user.role==="TEACHER"&&await teacherCanAccessStudent(user.userId,id)||user.role==="PARENT"&&await parentCanAccessStudent(user.userId,id);if(!allowed)return Response.json({ok:false,error:"Ученик не найден"},{status:404});const student=await prisma.student.findFirst({where:{id,archivedAt:null},select:{id:true,firstName:true,lastName:true,dateOfBirth:true,currentLevel:true,status:true,enrollments:{where:{status:"ACTIVE"},take:1,select:{group:{select:{id:true,name:true,level:true}}}}}});if(!student)return Response.json({ok:false,error:"Ученик не найден"},{status:404});return Response.json({ok:true,student});}catch(error){return apiError(error)}}
