import { requireTeacher } from "../../lib/auth/authorization";
import { RoleShell } from "../../components/role-shell";

export const dynamic="force-dynamic";
export const revalidate=0;
export default async function TeacherLayout({children}:{children:React.ReactNode}){const user=await requireTeacher();return <RoleShell role="teacher" user={{name:user.name}}>{children}</RoleShell>}
