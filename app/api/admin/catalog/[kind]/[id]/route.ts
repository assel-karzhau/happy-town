import { revalidatePath } from "next/cache";
import { requireAdmin } from "../../../../../../lib/auth/authorization";
import { AppError } from "../../../../../../lib/errors/app-error";
import { apiError } from "../../../../../../lib/http/api-response";
import { archiveCatalogEntity, updateCatalogEntity } from "../../../../../../lib/services/admin-catalog.service";
import type { AdminCatalogKind } from "../../../../../../lib/types/admin-api";

export const runtime="nodejs";export const dynamic="force-dynamic";
const kinds=new Set<AdminCatalogKind>(["books","units","skills"]);
const kindOf=(value:string)=>{if(!kinds.has(value as AdminCatalogKind))throw new AppError("VALIDATION_ERROR","Неизвестный тип каталога",400);return value as AdminCatalogKind};
const refresh=()=>["/admin/books","/admin/units","/admin/skills","/admin/groups","/teacher/lessons","/teacher/tests"].forEach(path=>revalidatePath(path));

export async function PATCH(request:Request,{params}:{params:Promise<{kind:string;id:string}>}){try{const user=await requireAdmin(),{kind:rawKind,id}=await params,kind=kindOf(rawKind),body=await request.json();const item=await updateCatalogEntity(kind,id,body.data,{userId:user.userId,role:user.role});refresh();return Response.json({ok:true,item});}catch(error){return apiError(error)}}
export async function DELETE(_:Request,{params}:{params:Promise<{kind:string;id:string}>}){try{const user=await requireAdmin(),{kind:rawKind,id}=await params,kind=kindOf(rawKind);const item=await archiveCatalogEntity(kind,id,{userId:user.userId,role:user.role});refresh();return Response.json({ok:true,item});}catch(error){return apiError(error)}}
