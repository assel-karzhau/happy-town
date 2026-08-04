import { AppError } from "../../../../../lib/errors/app-error";
import { requireAdmin } from "../../../../../lib/auth/authorization";
import { apiError } from "../../../../../lib/http/api-response";
import { archiveGroup, archiveUser, restoreGroup, restoreStudent, restoreUser, updateGroup, updateStudent, updateUser } from "../../../../../lib/services/management.service";
import { archiveStudent } from "../../../../../lib/services/student.service";
import type { AdminEntityKind } from "../../../../../lib/types/admin-api";
import { revalidatePath } from "next/cache";

export const runtime="nodejs"; export const dynamic="force-dynamic";
const kinds=new Set<AdminEntityKind>(["parents","teachers","students","groups"]);
const kindOf=(value:unknown)=>{if(typeof value!=="string"||!kinds.has(value as AdminEntityKind))throw new AppError("VALIDATION_ERROR","Неизвестный тип сущности",400);return value as AdminEntityKind};

export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){try{const user=await requireAdmin(),{id}=await params,body=await request.json(),kind=kindOf(body.kind),actor={userId:user.userId,role:user.role};const item=kind==="students"?await updateStudent(id,body.data,actor):kind==="groups"?await updateGroup(id,body.data,actor):await updateUser(id,body.data,actor);for(const path of [`/admin/${kind}`,"/parent","/teacher","/teacher/groups"])revalidatePath(path);return Response.json({ok:true,item});}catch(error){return apiError(error)}}
export async function DELETE(request:Request,{params}:{params:Promise<{id:string}>}){try{const user=await requireAdmin(),{id}=await params,kind=kindOf(new URL(request.url).searchParams.get("kind")),actor={userId:user.userId,role:user.role};const item=kind==="students"?await archiveStudent(id,"Архивировано администратором",actor):kind==="groups"?await archiveGroup(id,actor):await archiveUser(id,actor);return Response.json({ok:true,item});}catch(error){return apiError(error)}}
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){try{const user=await requireAdmin(),{id}=await params,body=await request.json(),kind=kindOf(body.kind),actor={userId:user.userId,role:user.role};if(body.action!=="restore")throw new AppError("VALIDATION_ERROR","Неизвестное действие",400);const item=kind==="students"?await restoreStudent(id,actor):kind==="groups"?await restoreGroup(id,actor):await restoreUser(id,actor);return Response.json({ok:true,item});}catch(error){return apiError(error)}}
