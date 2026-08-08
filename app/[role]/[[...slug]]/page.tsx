import { AdminShell } from "../../../components/admin-shell";
import { notFound } from "next/navigation";
import type { UserRole } from "../../../generated/prisma/enums";
import { requirePageRole } from "../../../lib/auth/authorization";
import { getAdminPortalData } from "../../../lib/repositories/admin.repository";

export const dynamic="force-dynamic";
export const runtime="nodejs";

export default async function PortalPage({params}:{params:Promise<{role:string;slug?:string[]}>}) {
  const {role,slug=[]}=await params;
  if(role!=="admin")notFound();
  const roleMap:Record<string,UserRole>={admin:"ADMIN"};
  const requiredRole=roleMap[role]; if(!requiredRole) notFound();
  const path=`/${role}${slug.length?`/${slug.join("/")}`:""}`;
  const user=await requirePageRole(requiredRole,path);
  if(slug.length>1) notFound();
  const page=slug[0]??"home";
  const adminPages=new Set(["home","parents","teachers","students","groups","courses","books","units","topics","skills","history","archive","profile"]);
  if(!adminPages.has(page)) notFound();
  const adminData=await getAdminPortalData();
  return <AdminShell page={page as Parameters<typeof AdminShell>[0]["page"]} user={{name:user.name,email:user.email}} data={adminData}/>;
}
