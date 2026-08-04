import type { Prisma } from "../../generated/prisma/client";
import { AppError } from "../errors/app-error";
import type { AuthenticatedActor } from "../permissions/actor";

export async function requireTeacherGroupAccess(
  tx: Prisma.TransactionClient,
  actor: AuthenticatedActor,
  groupId: string,
) {
  if (actor.role === "ADMIN") return;
  const assignment = await tx.teacherGroupAssignment.findFirst({
    where: { teacherId: actor.userId, groupId, isCurrent: true, endedAt: null },
    select: { id: true },
  });
  // A scoped 404 does not reveal whether an unrelated group exists.
  if (!assignment) throw new AppError("NOT_FOUND", "Запись не найдена", 404);
}

export function requireOwnTeacherIdentity(actor: AuthenticatedActor, teacherId: string) {
  if (actor.role === "TEACHER" && actor.userId !== teacherId) {
    throw new AppError("NOT_FOUND", "Запись не найдена", 404);
  }
}
