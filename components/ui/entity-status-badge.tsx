"use client";

import { useI18n } from "../i18n-provider";
import { teacherMessage, type TeacherMessage } from "../../lib/i18n/teacher";

const statusMap: Record<string, { label: TeacherMessage; tone: "green" | "gray" | "orange" | "blue" | "red" }> = {
  active: { label: "Активен", tone: "green" },
  recruiting: { label: "Набор", tone: "blue" },
  inactive: { label: "Неактивен", tone: "gray" },
  paused: { label: "Обучение приостановлено", tone: "orange" },
  archived: { label: "В архиве", tone: "gray" },
  completed: { label: "Завершён", tone: "gray" },
  draft: { label: "Черновик", tone: "orange" },
  upcoming: { label: "Предстоящий", tone: "blue" },
  planned: { label: "Запланирован", tone: "blue" },
};

export function EntityStatusBadge({ status, label, tone }: { status?: string; label?: string; tone?: "green" | "gray" | "orange" | "blue" | "red" }) {
  const {locale} = useI18n();
  const normalized = String(status ?? "active").toLowerCase();
  const preset = statusMap[normalized];
  return <span className={`entity-status-badge badge ${tone ?? preset?.tone ?? "gray"}`}>{label ?? (preset ? teacherMessage(locale,preset.label) : status ?? teacherMessage(locale,"Статус"))}</span>;
}
