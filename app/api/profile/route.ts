import { revalidatePath } from "next/cache";
import { requireRole } from "../../../lib/auth/authorization";
import { apiError } from "../../../lib/http/api-response";
import { updateOwnProfile } from "../../../lib/services/teacher-content.service";

export const runtime="nodejs";export const dynamic="force-dynamic";
export async function PATCH(request:Request){try{const user=await requireRole("TEACHER","PARENT"),item=await updateOwnProfile(await request.json(),{userId:user.userId,role:user.role});revalidatePath(`/${user.role.toLowerCase()}/profile`);return Response.json({ok:true,item})}catch(error){return apiError(error)}}
