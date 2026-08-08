import { requireParent } from "../../../lib/auth/authorization";
import { getParentAttendanceAnalytics } from "../../../lib/repositories/parent-pages.repository";
import { ParentAttendanceAnalyticsPage } from "../../../components/parent-analytics-pages";
export const dynamic="force-dynamic";export const revalidate=0;
export default async function Page({searchParams}:{searchParams:Promise<{child?:string;period?:string}>}){const user=await requireParent(),params=await searchParams;return <ParentAttendanceAnalyticsPage data={await getParentAttendanceAnalytics(user.userId,params.child,params.period)}/>}
