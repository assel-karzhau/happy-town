"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, CircleDollarSign, LoaderCircle, Search, X } from "lucide-react";
import type { AdminPaymentRow, AdminPaymentsData } from "../lib/types/admin-api";

type Filter = "all" | "due" | "paid";
type Confirmation = { row: AdminPaymentRow; nextStatus: "PAID" | "UNPAID" } | null;

async function requestJson(url: string, options?: RequestInit) {
  const response = await fetch(url, { ...options, headers: { "content-type": "application/json", ...(options?.headers ?? {}) } });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error ?? "Не удалось выполнить операцию");
  return payload;
}

const date = (value: string | null) => value ? new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium" }).format(new Date(value)) : "—";
const period = (row: AdminPaymentRow) => `${row.lessonFrom}–${row.lessonTo}`;
const paymentInfo = (row: AdminPaymentRow) => row.paidAt ? date(row.paidAt) : row.isDue ? "Срок наступил" : `После ${row.lessonTo} урока`;

function PaymentBadge({ status }: { status: "PAID" | "UNPAID" }) {
  return <span className={`entity-status-badge badge ${status === "PAID" ? "green" : "red"}`}>{status === "PAID" ? "Оплачено" : "Не оплачено"}</span>;
}

function Summary({ data }: { data: AdminPaymentsData }) {
  return <div className="payment-summary-grid">
    <article><span><CircleDollarSign size={19}/></span><div><small>Всего учеников</small><strong>{data.summary.students}</strong></div></article>
    <article className={data.summary.due ? "warning" : ""}><span><CircleDollarSign size={19}/></span><div><small>Требуют оплаты</small><strong>{data.summary.due}</strong></div></article>
    <article><span><Check size={19}/></span><div><small>Оплачено текущих периодов</small><strong>{data.summary.paidCurrentPeriods}</strong></div></article>
  </div>;
}

export function AdminPayments() {
  const [data, setData] = useState<AdminPaymentsData | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState<Confirmation>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setData(await requestJson("/api/admin/payments")); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Ошибка загрузки"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const rows = useMemo(() => (data?.rows ?? []).filter(row => {
    const matched = !query || row.studentName.toLocaleLowerCase("ru").includes(query.toLocaleLowerCase("ru"));
    return matched && (!teacherId || row.teacherId === teacherId) && (filter === "all" || filter === "due" && row.isDue || filter === "paid" && row.status === "PAID");
  }), [data, filter, query, teacherId]);

  async function save() {
    if (!confirmation) return;
    setSaving(true); setError("");
    try {
      await requestJson("/api/admin/payments", { method: "PATCH", body: JSON.stringify({ studentId: confirmation.row.studentId, periodNumber: confirmation.row.periodNumber, status: confirmation.nextStatus }) });
      setConfirmation(null); await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Не удалось сохранить статус"); }
    finally { setSaving(false); }
  }

  return <div className="payments-page">
    {data && <Summary data={data}/>} 
    <div className="payment-toolbar">
      <div className="payment-filter-tabs" role="tablist" aria-label="Статус оплаты">
        <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>Все</button>
        <button className={filter === "due" ? "active" : ""} onClick={() => setFilter("due")}>Требуют оплаты</button>
        <button className={filter === "paid" ? "active" : ""} onClick={() => setFilter("paid")}>Оплачено</button>
      </div>
      <label className="admin-search"><Search size={17}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Поиск ученика" aria-label="Поиск ученика"/></label>
      <select value={teacherId} onChange={event => setTeacherId(event.target.value)} aria-label="Фильтр по преподавателю"><option value="">Все преподаватели</option>{data?.teachers.map(teacher => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}</select>
    </div>
    <section className="section-card payment-table-card">
      <div className="section-head admin-list-heading"><div><h2>Контроль оплаты</h2><p>Период обучения — каждые 12 проведённых уроков.</p></div>{loading && <LoaderCircle className="spin" size={18}/>}</div>
      {error && <p className="payment-error">{error}</p>}
      <div className="payment-table-wrap"><table><thead><tr><th>Ученик</th><th>Преподаватель</th><th>Проведено</th><th>Период</th><th>Оплата / срок</th><th>Статус</th><th>Действие</th></tr></thead><tbody>{rows.map(row => <tr key={`${row.studentId}:${row.periodNumber}`} className={row.isDue ? "payment-overdue" : ""}><td><b>{row.studentName}</b></td><td>{row.teacherName}</td><td>{row.completedLessons}</td><td>{period(row)}</td><td>{paymentInfo(row)}</td><td><PaymentBadge status={row.status}/></td><td><button className={`payment-action ${row.status === "PAID" ? "secondary" : ""}`} onClick={() => setConfirmation({ row, nextStatus: row.status === "PAID" ? "UNPAID" : "PAID" })}>{row.status === "PAID" ? "Отменить оплату" : "Отметить оплаченной"}</button></td></tr>)}</tbody></table></div>
      <div className="payment-mobile-list">{rows.map(row => <article key={`${row.studentId}:${row.periodNumber}`} className={row.isDue ? "payment-overdue" : ""}><div className="payment-mobile-head"><div><h3>{row.studentName}</h3><p>{row.teacherName}</p></div><PaymentBadge status={row.status}/></div><dl><div><dt>Проведено уроков</dt><dd>{row.completedLessons}</dd></div><div><dt>Период</dt><dd>{period(row)}</dd></div><div><dt>Оплата / срок</dt><dd>{paymentInfo(row)}</dd></div></dl><button className={`payment-action ${row.status === "PAID" ? "secondary" : ""}`} onClick={() => setConfirmation({ row, nextStatus: row.status === "PAID" ? "UNPAID" : "PAID" })}>{row.status === "PAID" ? "Отменить оплату" : "Отметить оплаченной"}</button></article>)}</div>
      {!loading && !rows.length && <p className="admin-empty">Платёжных периодов по выбранным фильтрам нет.</p>}
    </section>
    {confirmation && <div className="admin-modal-layer" onMouseDown={event => event.target === event.currentTarget && !saving && setConfirmation(null)}><section className="admin-modal payment-confirmation" role="dialog" aria-modal="true" aria-label="Подтверждение оплаты"><header><div><span>Happy Town</span><h2>{confirmation.nextStatus === "PAID" ? "Подтвердить оплату?" : "Отменить оплату?"}</h2></div><button onClick={() => setConfirmation(null)} disabled={saving} aria-label="Закрыть"><X size={20}/></button></header><p>Подтвердить {confirmation.nextStatus === "PAID" ? "оплату" : "отмену оплаты"} за уроки {period(confirmation.row)} для ученика «{confirmation.row.studentName}»?</p><div className="admin-form-actions"><button className="btn secondary" onClick={() => setConfirmation(null)} disabled={saving}>Отмена</button><button className="btn" onClick={() => void save()} disabled={saving}>{saving ? <><LoaderCircle className="spin" size={17}/>Сохраняем…</> : confirmation.nextStatus === "PAID" ? "Подтвердить оплату" : "Отменить оплату"}</button></div></section></div>}
  </div>;
}
