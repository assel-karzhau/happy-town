import { requireAdmin } from "../../../../lib/auth/authorization";
import { AppError } from "../../../../lib/errors/app-error";
import { apiError } from "../../../../lib/http/api-response";
import { getAdminPayments, setStudentPaymentStatus } from "../../../../lib/services/payment.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    return Response.json({ ok: true, ...(await getAdminPayments()) });
  } catch (error) { return apiError(error); }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireAdmin();
    const body = await request.json();
    if (typeof body.studentId !== "string" || !["PAID", "UNPAID"].includes(body.status)) throw new AppError("VALIDATION_ERROR", "Некорректные данные оплаты", 400);
    const payment = await setStudentPaymentStatus({ studentId: body.studentId, periodNumber: Number(body.periodNumber), status: body.status, actorUserId: user.userId });
    return Response.json({ ok: true, payment });
  } catch (error) { return apiError(error); }
}
