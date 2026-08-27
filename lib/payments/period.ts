export const PAYMENT_PERIOD_SIZE = 12;

export function paymentPeriodForLessons(periodNumber: number) {
  const lessonFrom = (periodNumber - 1) * PAYMENT_PERIOD_SIZE + 1;
  return { lessonFrom, lessonTo: lessonFrom + PAYMENT_PERIOD_SIZE - 1 };
}

export function paymentPeriodCount(completedLessons: number) {
  return Math.max(1, Math.ceil(completedLessons / PAYMENT_PERIOD_SIZE));
}
