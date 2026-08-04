const statusMap: Record<string, { label: string; tone: "green" | "gray" | "orange" | "blue" | "red" }> = {
  active: { label: "Активен", tone: "green" },
  recruiting: { label: "Набор", tone: "blue" },
  inactive: { label: "Неактивен", tone: "gray" },
  archived: { label: "В архиве", tone: "gray" },
  completed: { label: "Завершён", tone: "gray" },
  draft: { label: "Черновик", tone: "orange" },
  upcoming: { label: "Предстоящий", tone: "blue" },
  planned: { label: "Запланирован", tone: "blue" },
};

export function EntityStatusBadge({ status, label, tone }: { status?: string; label?: string; tone?: "green" | "gray" | "orange" | "blue" | "red" }) {
  const normalized = String(status ?? "active").toLowerCase();
  const preset = statusMap[normalized] ?? { label: label ?? status ?? "Статус", tone: "gray" as const };
  return <span className={`entity-status-badge badge ${tone ?? preset.tone}`}>{label ?? preset.label}</span>;
}
