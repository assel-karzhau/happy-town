import type { Locale } from "./messages";

const englishErrors: Record<string, string> = {
  VALIDATION_ERROR: "Please check the information entered and try again.",
  NOT_FOUND: "The requested item could not be found.",
  CONFLICT: "This change conflicts with an existing record.",
  FORBIDDEN: "You do not have permission to perform this action.",
  UNAUTHORIZED: "Your session has expired. Please sign in again.",
  BUSINESS_RULE_VIOLATION: "This action cannot be completed with the current data.",
  INTERNAL_ERROR: "Something went wrong. Please try again later.",
};

// Keep API responses unchanged; localize their stable codes only at the display boundary.
export function apiErrorMessage(locale: Locale, result: { code?: unknown; error?: unknown }, fallback: string): string {
  if (locale === "en") return typeof result.code === "string" ? englishErrors[result.code] ?? fallback : fallback;
  return typeof result.error === "string" && result.error ? result.error : fallback;
}
