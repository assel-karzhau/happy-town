import { revalidatePath } from "next/cache";
import { requireTeacher } from "../../../../lib/auth/authorization";
import { apiError } from "../../../../lib/http/api-response";
import { createLesson, saveAttendance } from "../../../../lib/services/lesson.service";
import { archiveHomework, archiveTest, createHomework, createTest, updateHomework, updateTest } from "../../../../lib/services/management.service";
import { publishMonthlyAssessment, publishTeacherReview, saveMonthlyAssessment, saveTeacherReview, saveTestResult } from "../../../../lib/services/reporting.service";
import { archiveLesson, archiveVocabularyWord, createVocabularyWords, saveHomeworkStatus, saveWordProgress, updateLesson, updateOwnProfile, updateVocabularyWord } from "../../../../lib/services/teacher-content.service";
import { AppError } from "../../../../lib/errors/app-error";

export const runtime="nodejs";export const dynamic="force-dynamic";
export async function POST(request:Request){
  try{
    const user=await requireTeacher(),body=await request.json(),actor={userId:user.userId,role:user.role};
    const data={...(body.data??{})};if(["createLesson","saveMonthlyAssessment","saveTeacherReview"].includes(body.action))data.teacherId=user.userId;
    const actions:Record<string,()=>Promise<unknown>>={
      saveAttendance:()=>saveAttendance(data,actor),createLesson:()=>createLesson(data,actor),updateLesson:()=>updateLesson(data,actor),archiveLesson:()=>archiveLesson(data,actor),
      createHomework:()=>createHomework(data,actor),updateHomework:()=>updateHomework(String(data.homeworkId),data,actor),archiveHomework:()=>archiveHomework(String(data.homeworkId),actor),saveHomeworkStatus:()=>saveHomeworkStatus(data,actor),
      createWords:()=>createVocabularyWords(data,actor),updateWord:()=>updateVocabularyWord(data,actor),archiveWord:()=>archiveVocabularyWord(data,actor),saveWordProgress:()=>saveWordProgress(data,actor),
      createTest:()=>createTest(data,actor),updateTest:()=>updateTest(String(data.testId),data,actor),archiveTest:()=>archiveTest(String(data.testId),actor),saveTestResult:()=>saveTestResult(data,actor),
      saveMonthlyAssessment:()=>saveMonthlyAssessment(data,actor),publishMonthlyAssessment:()=>publishMonthlyAssessment(String(data.assessmentId),actor),saveTeacherReview:()=>saveTeacherReview(data,actor),publishTeacherReview:()=>publishTeacherReview(String(data.reviewId),actor),updateProfile:()=>updateOwnProfile(data,actor)
    };
    const action=actions[body.action];if(!action)throw new AppError("VALIDATION_ERROR","Неизвестное действие",400);
    const item=await action();
    for(const path of ["/teacher","/teacher/attendance","/teacher/lessons","/teacher/homework","/teacher/words","/teacher/tests","/teacher/assessments","/teacher/reviews","/teacher/students","/teacher/profile","/parent","/parent/topics","/parent/homework","/parent/words","/parent/attendance","/parent/tests","/parent/progress","/parent/reviews","/parent/history","/parent/profile"])revalidatePath(path);
    return Response.json({ok:true,item});
  }catch(error){return apiError(error)}
}
