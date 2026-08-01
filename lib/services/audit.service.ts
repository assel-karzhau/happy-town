import type { Prisma } from "../../generated/prisma/client";
import type { AuditAction } from "../../generated/prisma/enums";
import { prisma } from "../db/prisma";

const sensitiveKeys = new Set(["password","passwordHash","token","secret","authorization","cookie"]);

function sanitize(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined) return undefined;
  if (value === null || ["string","number","boolean"].includes(typeof value)) return value as Prisma.InputJsonValue;
  if (Array.isArray(value)) return value.map(item=>sanitize(item) ?? null);
  if (typeof value === "object") return Object.fromEntries(Object.entries(value as Record<string,unknown>).filter(([key])=>!sensitiveKeys.has(key)).map(([key,item])=>[key,sanitize(item)??null]));
  return String(value);
}

type DbClient = Prisma.TransactionClient | typeof prisma;

export async function writeAuditLog(db:DbClient, input:{actorUserId?:string;action:AuditAction;entityType:string;entityId:string;previousData?:unknown;newData?:unknown;metadata?:unknown}) {
  return db.auditLog.create({ data:{ actorUserId:input.actorUserId, action:input.action, entityType:input.entityType, entityId:input.entityId, previousData:sanitize(input.previousData), newData:sanitize(input.newData), metadata:sanitize(input.metadata) } });
}
