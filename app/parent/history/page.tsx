import { requireParent } from "../../../lib/auth/authorization";
import { getParentHistoryAnalytics } from "../../../lib/repositories/parent-pages.repository";
import { ParentHistoryAnalyticsPage } from "../../../components/parent-analytics-pages";
export const dynamic="force-dynamic";export const revalidate=0;
export default async function Page({searchParams}:{searchParams:Promise<{child?:string;period?:string}>}){const user=await requireParent(),params=await searchParams;return <ParentHistoryAnalyticsPage data={await getParentHistoryAnalytics(user.userId,params.child,params.period)}/>}
