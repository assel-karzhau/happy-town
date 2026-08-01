import type { UserRole } from "../../generated/prisma/enums";
import { AppError } from "../errors/app-error";

export interface AuthenticatedActor { userId: string; role: UserRole }

export function requireRole(actor: AuthenticatedActor | null, roles: UserRole[]) {
  if (!actor) throw new AppError("UNAUTHORIZED", "Требуется авторизация", 401);
  if (!roles.includes(actor.role)) throw new AppError("FORBIDDEN", "Недостаточно прав", 403);
  return actor;
}
