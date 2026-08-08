import { requireTeacher } from "../../../lib/auth/authorization";
import { getTeacherReviews } from "../../../lib/repositories/teacher-pages.repository";
import { TeacherReviewWorkspace } from "../../../components/teacher-reporting-workspaces";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  const user = await requireTeacher();
  return <TeacherReviewWorkspace data={await getTeacherReviews(user.userId)} />;
}
