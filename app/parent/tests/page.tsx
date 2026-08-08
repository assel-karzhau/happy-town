import { requireParent } from "../../../lib/auth/authorization";
import { getParentTestsAnalytics } from "../../../lib/repositories/parent-pages.repository";
import { ParentTestsAnalyticsPage } from "../../../components/parent-analytics-pages";
export const dynamic="force-dynamic";export const revalidate=0;
export default async function Page({searchParams}:{searchParams:Promise<{child?:string;period?:string}>}){const user=await requireParent(),params=await searchParams;return <ParentTestsAnalyticsPage data={await getParentTestsAnalytics(user.userId,params.child,params.period)}/>}
