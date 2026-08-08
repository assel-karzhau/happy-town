import { requireParent } from "../../../lib/auth/authorization";
import { getParentProgressAnalytics } from "../../../lib/repositories/parent-pages.repository";
import { ParentProgressAnalyticsPage } from "../../../components/parent-analytics-pages";
export const dynamic="force-dynamic";export const revalidate=0;
export default async function Page({searchParams}:{searchParams:Promise<{child?:string;period?:string}>}){const user=await requireParent(),params=await searchParams;return <ParentProgressAnalyticsPage data={await getParentProgressAnalytics(user.userId,params.child,params.period)}/>}
