import { requireParent } from "../../lib/auth/authorization";
import { RoleShell } from "../../components/role-shell";

export const dynamic="force-dynamic";
export const revalidate=0;
export default async function ParentLayout({children}:{children:React.ReactNode}){const user=await requireParent();return <RoleShell role="parent" user={{name:user.name}}>{children}</RoleShell>}
