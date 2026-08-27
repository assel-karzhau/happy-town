CREATE TYPE "PaymentStatus" AS ENUM ('PAID', 'UNPAID');

CREATE TABLE "student_payments" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "periodNumber" INTEGER NOT NULL,
    "lessonFrom" INTEGER NOT NULL,
    "lessonTo" INTEGER NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_payments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "student_payments_period_positive" CHECK ("periodNumber" > 0),
    CONSTRAINT "student_payments_lesson_range_valid" CHECK ("lessonFrom" > 0 AND "lessonTo" >= "lessonFrom")
);

CREATE UNIQUE INDEX "student_payments_studentId_periodNumber_key" ON "student_payments"("studentId", "periodNumber");
CREATE INDEX "student_payments_studentId_status_idx" ON "student_payments"("studentId", "status");
CREATE INDEX "student_payments_status_lessonTo_idx" ON "student_payments"("status", "lessonTo");

ALTER TABLE "student_payments"
ADD CONSTRAINT "student_payments_studentId_fkey"
FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
