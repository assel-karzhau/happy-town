import { AppError } from "../../../../../../lib/errors/app-error";
import { requireAdmin } from "../../../../../../lib/auth/authorization";
import { apiError } from "../../../../../../lib/http/api-response";
import { archiveKinds, getDeletePreview, permanentlyDeleteArchived, restoreArchived, type ArchiveKind } from "../../../../../../lib/services/archive-delete.service";

export const runtime="nodejs";export const dynamic="force-dynamic";
const kindOf=(value:string)=>{if(!archiveKinds.includes(value as ArchiveKind))throw new AppError("VALIDATION_ERROR","Неизвестный тип архивной записи",400);return value as ArchiveKind};
export async function GET(_:Request,{params}:{params:Promise<{kind:string;id:string}>}){try{const user=await requireAdmin(),{kind,id}=await params;return Response.json({ok:true,item:await getDeletePreview(kindOf(kind),id,{userId:user.userId,role:user.role})});}catch(error){return apiError(error)}}
export async function DELETE(request:Request,{params}:{params:Promise<{kind:string;id:string}>}){try{const user=await requireAdmin(),{kind,id}=await params;return Response.json({ok:true,item:await permanentlyDeleteArchived(kindOf(kind),id,await request.json(),{userId:user.userId,role:user.role})});}catch(error){return apiError(error)}}
export async function POST(_:Request,{params}:{params:Promise<{kind:string;id:string}>}){try{const user=await requireAdmin(),{kind,id}=await params;return Response.json({ok:true,item:await restoreArchived(kindOf(kind),id,{userId:user.userId,role:user.role})});}catch(error){return apiError(error)}}
