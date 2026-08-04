import { Portal } from "../../../components/portal";
import { notFound, redirect } from "next/navigation";
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
  const coreAdminPages=new Set(["home","parents","teachers","students","groups","archive"]);
  const page=slug[0]??"home";
  if(page==="periods") redirect("/admin");
  const adminData=requiredRole==="ADMIN"&&coreAdminPages.has(page)?await getAdminPortalData():undefined;
  return <Portal user={{name:user.name,email:user.email}} adminData={adminData}/>;
}
