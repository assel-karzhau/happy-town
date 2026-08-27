import type { PaymentStatus } from "../../generated/prisma/enums";
import { prisma } from "../db/prisma";
import { AppError } from "../errors/app-error";
import type { AdminPaymentsData, AdminPaymentRow } from "../types/admin-api";
import { PAYMENT_PERIOD_SIZE, paymentPeriodCount, paymentPeriodForLessons } from "../payments/period";

export { PAYMENT_PERIOD_SIZE, paymentPeriodCount, paymentPeriodForLessons } from "../payments/period";

const fullName = (person: { firstName: string; lastName: string }) => `${person.firstName} ${person.lastName}`;
const iso = (value: Date | null) => value?.toISOString() ?? null;

export async function getAdminPayments(): Promise<AdminPaymentsData> {
  const students = await prisma.student.findMany({
    where: { archivedAt: null, status: { not: "ARCHIVED" } },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    select: {
      id: true, firstName: true, lastName: true,
      payments: { select: { id: true, periodNumber: true, lessonFrom: true, lessonTo: true, status: true, paidAt: true } },
      attendance: {
        where: { status: { not: "LESSON_CANCELLED" }, lesson: { status: "COMPLETED", archivedAt: null } },
        select: { lesson: { select: { teacher: { select: { id: true, firstName: true, lastName: true } } } } },
      },
    },
  });

  // Once a 12-lesson threshold has been reached, materialise the unpaid period.
  // This keeps overdue periods in the database even before an administrator acts.
  const overduePeriods = students.flatMap(student => {
    const existing = new Set(student.payments.map(payment => payment.periodNumber));
    return Array.from({ length: Math.floor(student.attendance.length / PAYMENT_PERIOD_SIZE) }, (_, index) => index + 1)
      .filter(periodNumber => !existing.has(periodNumber))
      .map(periodNumber => ({ studentId: student.id, periodNumber, ...paymentPeriodForLessons(periodNumber), status: "UNPAID" as const }));
  });
  if (overduePeriods.length) await prisma.studentPayment.createMany({ data: overduePeriods, skipDuplicates: true });

  const teachers = new Map<string, string>();
  const rows: AdminPaymentRow[] = students.flatMap(student => {
    const completedLessons = student.attendance.length;
    const lessonsByTeacher = new Map<string, { name: string; count: number }>();
    for (const attendance of student.attendance) {
      const teacher = attendance.lesson.teacher;
      teachers.set(teacher.id, fullName(teacher));
      const current = lessonsByTeacher.get(teacher.id) ?? { name: fullName(teacher), count: 0 };
      current.count += 1;
      lessonsByTeacher.set(teacher.id, current);
    }
    const primaryTeacher = [...lessonsByTeacher.entries()].sort((a, b) => b[1].count - a[1].count || a[1].name.localeCompare(b[1].name))[0];
    const payments = new Map(student.payments.map(payment => [payment.periodNumber, payment]));
    return Array.from({ length: paymentPeriodCount(completedLessons) }, (_, index) => {
      const periodNumber = index + 1;
      const bounds = paymentPeriodForLessons(periodNumber);
      const payment = payments.get(periodNumber);
      const status: PaymentStatus = payment?.status ?? "UNPAID";
      return {
        id: payment?.id ?? null, studentId: student.id, studentName: fullName(student),
        teacherId: primaryTeacher?.[0] ?? null, teacherName: primaryTeacher?.[1].name ?? "Не назначен",
        completedLessons, periodNumber, lessonFrom: payment?.lessonFrom ?? bounds.lessonFrom, lessonTo: payment?.lessonTo ?? bounds.lessonTo,
        status, paidAt: iso(payment?.paidAt ?? null), isDue: completedLessons >= (payment?.lessonTo ?? bounds.lessonTo) && status !== "PAID",
      };
    });
  });
  rows.sort((a, b) => Number(b.isDue) - Number(a.isDue) || a.studentName.localeCompare(b.studentName, "ru") || a.periodNumber - b.periodNumber);
  const currentRows = rows.filter(row => row.periodNumber === paymentPeriodCount(row.completedLessons));
  return {
    rows,
    teachers: [...teachers.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name, "ru")),
    summary: { students: students.length, due: rows.filter(row => row.isDue).length, paidCurrentPeriods: currentRows.filter(row => row.status === "PAID").length },
  };
}

export async function setStudentPaymentStatus(input: { studentId: string; periodNumber: number; status: PaymentStatus; actorUserId: string }) {
  if (!Number.isInteger(input.periodNumber) || input.periodNumber < 1) throw new AppError("VALIDATION_ERROR", "Некорректный платёжный период", 400);
  const student = await prisma.student.findFirst({ where: { id: input.studentId, archivedAt: null, status: { not: "ARCHIVED" } }, select: { id: true } });
  if (!student) throw new AppError("NOT_FOUND", "Ученик не найден", 404);
  const bounds = paymentPeriodForLessons(input.periodNumber);
  const payment = await prisma.studentPayment.upsert({
    where: { studentId_periodNumber: { studentId: input.studentId, periodNumber: input.periodNumber } },
    create: { studentId: input.studentId, periodNumber: input.periodNumber, ...bounds, status: input.status, paidAt: input.status === "PAID" ? new Date() : null },
    update: { status: input.status, paidAt: input.status === "PAID" ? new Date() : null },
  });
  await prisma.auditLog.create({
    data: { actorUserId: input.actorUserId, action: "UPDATE", entityType: "StudentPayment", entityId: payment.id, newData: { studentId: input.studentId, periodNumber: input.periodNumber, status: input.status } },
  });
  return payment;
}
