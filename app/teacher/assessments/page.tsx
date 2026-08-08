import { requireTeacher } from "../../../lib/auth/authorization";
import { getTeacherAssessments } from "../../../lib/repositories/teacher-pages.repository";
import { TeacherAssessmentWorkspace } from "../../../components/teacher-reporting-workspaces";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  const user = await requireTeacher();
  return <TeacherAssessmentWorkspace data={await getTeacherAssessments(user.userId)} />;
}
