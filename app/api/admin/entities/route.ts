import { AppError } from "../../../../lib/errors/app-error";
import { requireAdmin } from "../../../../lib/auth/authorization";
import { apiError } from "../../../../lib/http/api-response";
import { listAdminEntities } from "../../../../lib/repositories/admin.repository";
import { createGroupWithTeacher, createStudentWithRelations, createUser } from "../../../../lib/services/management.service";
import type { AdminEntityKind } from "../../../../lib/types/admin-api";
import { revalidatePath } from "next/cache";

export const runtime="nodejs"; export const dynamic="force-dynamic";
const kinds=new Set<AdminEntityKind>(["parents","teachers","students","groups"]);
const kindOf=(value:string|null)=>{if(!value||!kinds.has(value as AdminEntityKind))throw new AppError("VALIDATION_ERROR","Неизвестный тип сущности",400);return value as AdminEntityKind};

export async function GET(request:Request){try{await requireAdmin();const url=new URL(request.url),kind=kindOf(url.searchParams.get("kind"));const page=Math.max(1,Number(url.searchParams.get("page")||1)),pageSize=Math.min(50,Math.max(1,Number(url.searchParams.get("pageSize")||8)));const status=url.searchParams.get("status")==="archived"?"archived":"active";const sort=url.searchParams.get("sort")==="name"?"name":"newest";return Response.json({ok:true,...await listAdminEntities(kind,{query:url.searchParams.get("query")||"",status,sort,page,pageSize})});}catch(error){return apiError(error)}}

export async function POST(request:Request){try{const user=await requireAdmin(),body=await request.json(),kind=kindOf(body.kind),actor={userId:user.userId,role:user.role};let item;if(kind==="parents"||kind==="teachers")item=await createUser({...body.data,role:kind==="parents"?"PARENT":"TEACHER"},actor);else if(kind==="students")item=await createStudentWithRelations(body.data,actor);else item=await createGroupWithTeacher(body.data,actor);for(const path of ["/admin/parents","/admin/teachers","/admin/students","/admin/groups","/parent","/teacher","/teacher/groups"])revalidatePath(path);return Response.json({ok:true,item},{status:201});}catch(error){return apiError(error)}}
