import { redirect } from "next/navigation";
import type { UserRole } from "../../generated/prisma/enums";
import { auth } from "../../auth";
import { AppError } from "../errors/app-error";
import { prisma } from "../db/prisma";

export type SessionUser = { userId: string; role: UserRole; name: string; email: string };

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) return null;
  const current = await prisma.user.findFirst({ where: { id: session.user.id, status: "ACTIVE", archivedAt: null }, select: { id:true,role:true,email:true,firstName:true,lastName:true } });
  if (!current) return null;
  return { userId: current.id, role: current.role, name: `${current.firstName} ${current.lastName}`, email: current.email??"" };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new AppError("UNAUTHORIZED", "Требуется авторизация", 401);
  return user;
}

export async function requireRole(...roles: UserRole[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) throw new AppError("FORBIDDEN", "Недостаточно прав", 403);
  return user;
}

export const requireAdmin = () => requireRole("ADMIN");
export const requireTeacher = () => requireRole("TEACHER");
export const requireParent = () => requireRole("PARENT");

export async function requirePageRole(role: UserRole, returnTo: string): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?callbackUrl=${encodeURIComponent(returnTo)}`);
  if (user.role !== role) redirect(`/${user.role.toLowerCase()}`);
  return user;
}

export async function teacherCanAccessGroup(teacherId: string, groupId: string) {
  return Boolean(await prisma.teacherGroupAssignment.findFirst({ where: { teacherId, groupId, isCurrent: true, endedAt: null, teacher:{status:"ACTIVE",archivedAt:null}, group:{archivedAt:null} }, select: { id: true } }));
}

export async function teacherCanAccessStudent(teacherId: string, studentId: string) {
  return Boolean(await prisma.studentGroupEnrollment.findFirst({ where: { studentId, status: "ACTIVE", group: { teacherAssignments: { some: { teacherId, isCurrent: true, endedAt: null } } } }, select: { id: true } }));
}

export async function parentCanAccessStudent(parentId: string, studentId: string) {
  return Boolean(await prisma.parentStudentRelation.findFirst({ where: { parentId, studentId, archivedAt: null }, select: { id: true } }));
}

export const adminCanAccessAll = (role: UserRole) => role === "ADMIN";
