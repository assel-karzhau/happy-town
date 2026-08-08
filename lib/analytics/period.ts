export const periodPresets = ["3m", "6m", "academic", "all"] as const;
export type PeriodPreset = (typeof periodPresets)[number];

export type AnalyticsPeriod = {
  preset: PeriodPreset;
  from: Date | null;
  to: Date;
  label: string;
};

const APP_OFFSET_MINUTES = Number(process.env.APP_TIMEZONE_OFFSET_MINUTES ?? 300);
const offsetMs = APP_OFFSET_MINUTES * 60_000;

export function parsePeriodPreset(value?: string): PeriodPreset {
  return periodPresets.includes(value as PeriodPreset) ? (value as PeriodPreset) : "academic";
}

function localParts(date: Date) {
  const shifted = new Date(date.getTime() + offsetMs);
  return { year: shifted.getUTCFullYear(), month: shifted.getUTCMonth(), day: shifted.getUTCDate() };
}

export function localDateBoundary(year: number, monthIndex: number, day = 1) {
  return new Date(Date.UTC(year, monthIndex, day) - offsetMs);
}

export function getAnalyticsPeriod(value?: string, now = new Date()): AnalyticsPeriod {
  const preset = parsePeriodPreset(value);
  const { year, month } = localParts(now);
  const to = localDateBoundary(year, month + 1, 1);
  if (preset === "all") return { preset, from: null, to, label: "Весь период" };
  if (preset === "academic") {
    const startYear = month >= 8 ? year : year - 1;
    return { preset, from: localDateBoundary(startYear, 8, 1), to, label: "Текущий учебный год" };
  }
  const months = preset === "3m" ? 3 : 6;
  return { preset, from: localDateBoundary(year, month - months + 1, 1), to, label: `Последние ${months} месяцев` };
}

export function dateRangeWhere(period: AnalyticsPeriod) {
  return period.from ? { gte: period.from, lt: period.to } : { lt: period.to };
}

export function calendarMonthKey(value: Date) {
  const { year, month } = localParts(value);
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

export function monthKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function monthWithinPeriod(year: number, month: number, period: AnalyticsPeriod) {
  const instant = localDateBoundary(year, month - 1, 1);
  return (!period.from || instant >= period.from) && instant < period.to;
}

export function monthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("ru-RU", { month: "short", year: "2-digit", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, 1)));
}

export function formatCalendarDate(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "long", year: "numeric", timeZone: "Asia/Aqtau" }).format(date);
}
