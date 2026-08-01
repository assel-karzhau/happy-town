export type AppErrorCode = "VALIDATION_ERROR" | "NOT_FOUND" | "CONFLICT" | "FORBIDDEN" | "UNAUTHORIZED" | "BUSINESS_RULE_VIOLATION" | "INTERNAL_ERROR";

export class AppError extends Error {
  constructor(public readonly code: AppErrorCode, message: string, public readonly status = 400, public readonly details?: Record<string, unknown>) {
    super(message);
    this.name = "AppError";
  }
}

export function toSafeError(error: unknown) {
  if (error instanceof AppError) return { code: error.code, message: error.message, details: error.details };
  if (process.env.NODE_ENV !== "production") console.error("Unhandled server error", error);
  return { code: "INTERNAL_ERROR" as const, message: "Не удалось выполнить операцию" };
}
