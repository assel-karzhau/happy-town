import { revalidatePath } from "next/cache";
import { requireAdmin } from "../../../../lib/auth/authorization";
import { AppError } from "../../../../lib/errors/app-error";
import { apiError } from "../../../../lib/http/api-response";
import { createCatalogEntity } from "../../../../lib/services/admin-catalog.service";
import type { AdminCatalogKind } from "../../../../lib/types/admin-api";

export const runtime="nodejs";export const dynamic="force-dynamic";
const kinds=new Set<AdminCatalogKind>(["books","units","skills"]);
const kindOf=(value:unknown)=>{if(typeof value!=="string"||!kinds.has(value as AdminCatalogKind))throw new AppError("VALIDATION_ERROR","Неизвестный тип каталога",400);return value as AdminCatalogKind};
const refresh=()=>["/admin/books","/admin/units","/admin/skills","/admin/groups","/teacher/lessons","/teacher/tests"].forEach(path=>revalidatePath(path));

export async function POST(request:Request){try{const user=await requireAdmin(),body=await request.json(),kind=kindOf(body.kind);const item=await createCatalogEntity(kind,body.data,{userId:user.userId,role:user.role});refresh();return Response.json({ok:true,item},{status:201});}catch(error){return apiError(error)}}
