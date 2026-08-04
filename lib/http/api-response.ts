import { Prisma } from "../../generated/prisma/client";
import { ZodError } from "zod";
import { AppError } from "../errors/app-error";

export function apiError(error: unknown) {
  if (error instanceof AppError) return Response.json({ ok: false, error: error.message, code: error.code }, { status: error.status });
  if (error instanceof ZodError) return Response.json({ ok: false, error: error.issues[0]?.message ?? "Некорректные данные", code: "VALIDATION_ERROR", fields: error.flatten().fieldErrors }, { status: 400 });
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return Response.json({ ok: false, error: "Email или телефон уже используется", code: "CONFLICT" }, { status: 409 });
  console.error("Unhandled API error", error instanceof Error ? error.message : "Unknown error");
  return Response.json({ ok: false, error: "Внутренняя ошибка сервера", code: "INTERNAL_ERROR" }, { status: 500 });
}
