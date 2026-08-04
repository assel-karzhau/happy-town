import { AppError } from "../../../../lib/errors/app-error";
import { requireAdmin } from "../../../../lib/auth/authorization";
import { apiError } from "../../../../lib/http/api-response";
import { addStudentsToGroup, assignTeacherToGroup, endTeacherAssignment, removeStudentFromGroup, unlinkParentFromStudent } from "../../../../lib/services/admin-relations.service";
import { linkParentToStudent, transferStudent } from "../../../../lib/services/student.service";
import { revalidatePath } from "next/cache";

export const runtime="nodejs"; export const dynamic="force-dynamic";
export async function POST(request:Request){try{const user=await requireAdmin(),body=await request.json(),actor={userId:user.userId,role:user.role};const actions={linkParent:linkParentToStudent,unlinkParent:unlinkParentFromStudent,transferStudent,addStudents:addStudentsToGroup,assignTeacher:assignTeacherToGroup,endTeacher:endTeacherAssignment,removeStudent:removeStudentFromGroup} as const;const action=actions[body.action as keyof typeof actions];if(!action)throw new AppError("VALIDATION_ERROR","Неизвестное действие",400);const item=await action(body.data,actor);for(const path of ["/admin/parents","/admin/teachers","/admin/students","/admin/groups","/parent","/teacher","/teacher/groups","/teacher/students"])revalidatePath(path);return Response.json({ok:true,item});}catch(error){return apiError(error)}}
