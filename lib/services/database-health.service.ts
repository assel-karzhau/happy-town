import { prisma } from "../db/prisma";

export async function getDatabaseHealth() {
  await prisma.$queryRaw`SELECT 1`;
  const [users,students,groups,lessons,periods,skills,history,auditLogs]=await Promise.all([prisma.user.count(),prisma.student.count(),prisma.group.count(),prisma.lesson.count(),prisma.academicPeriod.count(),prisma.skillCategory.count(),prisma.learningHistoryEvent.count(),prisma.auditLog.count()]);
  return {connected:true,counts:{users,students,groups,lessons,periods,skills,history,auditLogs}};
}
