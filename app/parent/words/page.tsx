import { requireParent } from "../../../lib/auth/authorization";
import { getParentWordsAnalytics } from "../../../lib/repositories/parent-pages.repository";
import { ParentWordsAnalyticsPage } from "../../../components/parent-analytics-pages";
export const dynamic="force-dynamic";export const revalidate=0;
export default async function Page({searchParams}:{searchParams:Promise<{child?:string;period?:string;book?:string;unit?:string;status?:string;q?:string}>}){const user=await requireParent(),params=await searchParams;const filters={book:params.book,unit:params.unit,status:params.status,q:params.q};return <ParentWordsAnalyticsPage data={await getParentWordsAnalytics(user.userId,params.child,params.period,filters)} filters={filters}/>}
