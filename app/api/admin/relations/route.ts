import { AppError } from "../../../../lib/errors/app-error";
import { requireAdmin } from "../../../../lib/auth/authorization";
import { apiError } from "../../../../lib/http/api-response";
import { assignTeacherToGroup, endTeacherAssignment, removeStudentFromGroup, unlinkParentFromStudent } from "../../../../lib/services/admin-relations.service";
import { linkParentToStudent, transferStudent } from "../../../../lib/services/student.service";

export const runtime="nodejs"; export const dynamic="force-dynamic";
export async function POST(request:Request){try{const user=await requireAdmin(),body=await request.json(),actor={userId:user.userId,role:user.role};const actions={linkParent:linkParentToStudent,unlinkParent:unlinkParentFromStudent,transferStudent,assignTeacher:assignTeacherToGroup,endTeacher:endTeacherAssignment,removeStudent:removeStudentFromGroup} as const;const action=actions[body.action as keyof typeof actions];if(!action)throw new AppError("VALIDATION_ERROR","Неизвестное действие",400);return Response.json({ok:true,item:await action(body.data,actor)});}catch(error){return apiError(error)}}
