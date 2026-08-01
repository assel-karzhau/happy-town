"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Archive, BookOpen, CalendarDays, ChartNoAxesCombined, Check, ChevronDown, ChevronRight,
  ClipboardCheck, Clock3, FileText, GraduationCap, History, Home, LayoutGrid, Menu, MessageSquareText,
  MoreHorizontal, Plus, Search, Settings2, Star, TrendingUp, UserRound, UsersRound, X, Bell,
} from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { adminEntities, attendanceDays, currentStudent, groups, homework, lessons, pageTitles, progressData, tests, words } from "../lib/mock-data";
import type { NavItem, Role } from "../lib/types";
import { TeacherPortal } from "./teacher-portal";

const iconMap = { home: Home, lessons: BookOpen, words: GraduationCap, homework: ClipboardCheck, attendance: CalendarDays, tests: FileText, progress: TrendingUp, feedback: MessageSquareText, history: History, profile: UserRound, groups: UsersRound, group: UsersRound, lesson: Plus, grades: ChartNoAxesCombined, teachers: UserRound, parents: UsersRound, students: GraduationCap, courses: BookOpen, books: BookOpen, units: LayoutGrid, topics: FileText, periods: CalendarDays, skills: Star, archive: Archive } as const;

const nav: Record<Role, NavItem[]> = {
  parent: [
    ["Главная", "home"], ["Темы и уроки", "lessons"], ["Слова", "words"], ["Домашние задания", "homework"],
    ["Посещаемость", "attendance"], ["Тесты", "tests"], ["Прогресс", "progress"], ["Отзывы учителя", "feedback"],
    ["История обучения", "history"], ["Профиль", "profile"],
  ].map(([label, icon]) => ({ label, icon, href: icon === "home" ? "/parent" : `/parent/${icon}` })),
  teacher: [
    ["Главная", "home"], ["Мои группы", "groups"], ["Посещаемость", "attendance"], ["Уроки и темы", "lessons"],
    ["Домашние задания", "homework"], ["Слова", "words"], ["Тесты", "tests"], ["Ежемесячные оценки", "grades"],
    ["Отзывы", "feedback"], ["Ученики", "students"], ["Профиль", "profile"],
  ].map(([label, icon]) => ({ label, icon, href: icon === "home" ? "/teacher" : `/teacher/${icon}` })),
  admin: [
    ["Dashboard", "home"], ["Учителя", "teachers"], ["Родители", "parents"], ["Ученики", "students"], ["Группы", "groups"],
    ["Курсы", "courses"], ["Учебники", "books"], ["Разделы", "units"], ["Темы", "topics"], ["Учебные периоды", "periods"],
    ["Категории навыков", "skills"], ["Архив", "archive"],
  ].map(([label, icon]) => ({ label, icon, href: icon === "home" ? "/admin" : `/admin/${icon}` })),
};

function Logo({ size = 72 }: { size?: number }) {
  return <Image src="/images/happy-town-logo.png" width={size} height={size} alt="Happy Town" className="logo" priority unoptimized />;
}

function StatusBadge({ children, tone = "green" }: { children: React.ReactNode; tone?: string }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

function Button({ children, secondary = false, onClick, type = "button", disabled = false }: { children: React.ReactNode; secondary?: boolean; onClick?: () => void; type?: "button" | "submit"; disabled?: boolean }) {
  return <button type={type} onClick={onClick} disabled={disabled} className={secondary ? "btn secondary" : "btn"}>{children}</button>;
}

function SectionCard({ title, action, children, className = "" }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return <section className={`section-card ${className}`}>
    {(title || action) && <div className="section-head">{title && <h2>{title}</h2>}{action}</div>}
    {children}
  </section>;
}

function StatCard({ icon: Icon, label, value, note, color = "red" }: { icon: typeof BookOpen; label: string; value: string; note: string; color?: string }) {
  return <div className="stat-card"><span className={`stat-icon ${color}`}><Icon size={21} /></span><div><p>{label}</p><strong>{value}</strong><small>{note}</small></div></div>;
}

function AppSidebar({ role, active }: { role: Role; active: string }) {
  return <aside className="sidebar">
    <div className="brand"><Logo size={84} /></div>
    <nav aria-label="Основная навигация">{nav[role].map((item) => {
      const Icon = iconMap[item.icon as keyof typeof iconMap] ?? Home;
      return <a key={item.href} href={item.href} className={active === item.icon ? "active" : ""}><Icon size={18} /><span>{item.label}</span></a>;
    })}</nav>
    <div className="help-card"><b>Есть вопросы?</b><span>Свяжитесь с нами</span><strong>+7 701 524 1191</strong></div>
    <small className="copyright">© Happy Town · 2026</small>
  </aside>;
}

function RoleSwitcher({ role }: { role: Role }) {
  const router = useRouter();
  return <label className="role-switch"><span>Demo:</span><select value={role} onChange={(event) => router.push(`/${event.target.value}`)} aria-label="Демонстрационная роль"><option value="parent">Родитель</option><option value="teacher">Учитель</option><option value="admin">Администратор</option></select><ChevronDown size={14} /></label>;
}

function Topbar({ role, title, onMenu }: { role: Role; title: string; onMenu: () => void }) {
  return <header className="topbar">
    <div className="mobile-header-row">
      <Logo size={62} />
      <div className="mobile-header-actions">
        <button className="icon-btn notification" aria-label="Уведомления"><Bell size={19} /><i /></button>
        <button className="icon-btn menu-trigger" onClick={onMenu} aria-label="Открыть меню"><Menu size={21} /></button>
      </div>
    </div>
    <div className="page-heading"><p className="eyebrow">Электронный дневник</p><h1>{title}</h1></div>
    <div className="top-actions desktop-actions"><RoleSwitcher role={role} /><button className="icon-btn notification" aria-label="Уведомления"><Bell size={19} /><i /></button><div className="profile-chip"><span className="avatar">МС</span><b>{role === "parent" ? "Мама Амины" : role === "teacher" ? "Айгуль Сериковна" : "Администратор"}</b><ChevronDown size={15} /></div></div>
  </header>;
}

function MobileNav({ role, active }: { role: Role; active: string }) {
  const [moreOpen,setMoreOpen]=useState(false);
  if(role==="teacher") {
    const items=[{label:"Главная",icon:"home",href:"/teacher"},{label:"Группы",icon:"groups",href:"/teacher/groups"},{label:"Посещаемость",icon:"attendance",href:"/teacher/attendance"},{label:"Ученики",icon:"students",href:"/teacher/students"}];
    const moreItems=nav.teacher.filter((item)=>["lessons","homework","words","tests","grades","feedback","profile"].includes(item.icon));
    return <><nav className="mobile-nav" aria-label="Мобильная навигация">{items.map((item)=>{const Icon=iconMap[item.icon as keyof typeof iconMap]??Home;return <Link href={item.href} className={active===item.icon?"active":""} key={item.href}><Icon size={21}/><span>{item.label}</span></Link>})}<button className={moreItems.some((item)=>item.icon===active)?"active":""} onClick={()=>setMoreOpen(true)}><MoreHorizontal size={22}/><span>Ещё</span></button></nav>{moreOpen&&<div className="dialog-layer mobile-more-layer" onMouseDown={(event)=>event.target===event.currentTarget&&setMoreOpen(false)}><div className="mobile-more-sheet"><div><h2>Ещё</h2><button onClick={()=>setMoreOpen(false)} aria-label="Закрыть"><X/></button></div><nav>{moreItems.map((item)=>{const Icon=iconMap[item.icon as keyof typeof iconMap]??BookOpen;return <Link href={item.href} onClick={()=>setMoreOpen(false)} key={item.href}><Icon size={20}/><span>{item.label}</span><ChevronRight size={17}/></Link>})}</nav></div></div>}</>;
  }
  const items = nav[role].slice(0, 4);
  return <nav className="mobile-nav" aria-label="Мобильная навигация">{items.map((item) => { const Icon = iconMap[item.icon as keyof typeof iconMap] ?? Home; return <a href={item.href} className={active === item.icon ? "active" : ""} key={item.href}><Icon size={21} /><span>{item.label.split(" ")[0]}</span></a>; })}<a href={`/${role}/${role === "admin" ? "archive" : "profile"}`}><MoreHorizontal size={22} /><span>Ещё</span></a></nav>;
}

function FilterBar({ search = true }: { search?: boolean }) {
  return <div className="filter-bar">{search && <label className="search"><Search size={18} /><input placeholder="Поиск" aria-label="Поиск" /></label>}<button className="filter"><Settings2 size={17} />Все разделы<ChevronDown size={15} /></button><button className="filter"><CalendarDays size={17} />Май 2025<ChevronDown size={15} /></button></div>;
}

function EmptyState({ title = "Пока ничего нет" }: { title?: string }) {
  return <div className="empty-state"><span><FileText /></span><h3>{title}</h3><p>Новые данные появятся здесь после добавления.</p><Button secondary>Обновить</Button></div>;
}

function DataTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return <div className="table-wrap"><table><thead><tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={`${row[0]}-${i}`}>{row.map((cell, j) => <td key={`${cell}-${j}`}>{j === row.length - 1 ? <StatusBadge tone={cell.includes("Нужно") || cell.includes("отпуск") ? "orange" : cell.includes("82") || cell.includes("Актив") || cell.includes("Осво") || cell.includes("Провер") || cell.includes("Выполн") ? "green" : "gray"}>{cell}</StatusBadge> : j === 0 ? <b>{cell}</b> : cell}</td>)}</tr>)}</tbody></table>
    <div className="mobile-data-list">{rows.map((row, i) => <article className="mobile-data-card" key={`${row[0]}-mobile-${i}`}><div><b>{row[0]}</b><StatusBadge>{row[row.length - 1]}</StatusBadge></div>{headers.slice(1, -1).map((h, k) => <p key={h}><span>{h}</span><strong>{row[k + 1]}</strong></p>)}<button>Открыть <ChevronRight size={15} /></button></article>)}</div></div>;
}

function Donut() { return <div className="donut"><span>87%</span></div>; }

function StudentHero() {
  return <div className="student-row"><div className="student-hero"><div className="student-avatar">АС</div><div><StatusBadge>Мой ребёнок</StatusBadge><h2>{currentStudent.name}</h2><p>Группа: <b>{currentStudent.group}</b></p><p>Преподаватель: <b>{currentStudent.teacher}</b></p><p>Учебник: <b>{currentStudent.book}</b></p><p>Уровень: <StatusBadge tone="red">{currentStudent.level}</StatusBadge></p><Button>Подробнее о ребёнке <ChevronRight size={16} /></Button></div></div><div className="attendance-mini"><h3>Посещаемость за месяц</h3><div><Donut /><strong>7 из 8<small>занятий</small></strong></div><Link href="/parent/attendance">Смотреть посещаемость <ChevronRight size={14} /></Link></div></div>;
}

function ParentHome() {
  return <><StudentHero /><div className="stats-grid"><StatCard icon={BookOpen} label="Пройдено тем" value="5" note="из 8"/><StatCard icon={GraduationCap} label="Изучено слов" value="34" note="новых слов"/><StatCard icon={ClipboardCheck} label="Домашние задания" value="6 / 7" note="выполнено"/><StatCard icon={Star} label="Последний тест" value="82%" note="Unit 2 Test"/></div><div className="two-col"><SectionCard title="Недавние события" action={<Link href="/parent/history">Все события <ChevronRight size={14}/></Link>}><div className="event-list">{[[BookOpen,"Новая тема","My Family","15 мая"],[ClipboardCheck,"Добавлено домашнее задание","Workbook, page 24","14 мая"],[Star,"Результат теста","Unit 2 Test — 82%","12 мая"],[MessageSquareText,"Новый отзыв учителя","Майский отзыв","10 мая"]].map(([Icon,title,text,date]) => <div className="event" key={String(title)}><span><Icon size={18}/></span><p><b>{String(title)}</b><small>{String(text)}</small></p><time>{String(date)}</time></div>)}</div></SectionCard><SectionCard title="Последний отзыв учителя" action={<StatusBadge>Май 2025</StatusBadge>}><blockquote>Амина стала увереннее отвечать на вопросы и использовать новые слова в предложениях.</blockquote><p className="muted">Нужно уделить больше внимания письменным заданиям и правописанию.</p><Link href="/parent/feedback">Читать полностью <ChevronRight size={14}/></Link></SectionCard></div></>;
}

function LessonsPage() {
  return <><FilterBar /><div className="lesson-cards">{lessons.map((lesson) => <SectionCard key={lesson.id} className="lesson-card"><div className="lesson-title"><div><small>{lesson.unit}</small><h3>{lesson.title}</h3></div><StatusBadge>{lesson.status}</StatusBadge></div><dl><div><dt>Дата</dt><dd>{lesson.date}</dd></div><div><dt>Что изучали</dt><dd>{lesson.learned}</dd></div><div><dt>Грамматика</dt><dd>{lesson.grammar}</dd></div><div><dt>Домашнее задание</dt><dd>{lesson.homework}</dd></div></dl><button>Смотреть детали <ChevronRight size={15}/></button></SectionCard>)}</div></>;
}

function AttendancePage({ editable = false }: { editable?: boolean }) {
  const [saved, setSaved] = useState(true);
  const [statuses, setStatuses] = useState(["Присутствовал", "Присутствовал", "Опоздал", "Присутствовал", "Отсутствовал"]);
  if (editable) return <><div className="notice"><span><Clock3 /></span><div><b>{saved ? "Все изменения сохранены" : "Есть несохранённые изменения"}</b><p>Занятие · 20 мая 2025 · Kids Starter</p></div><Button onClick={() => setSaved(true)}>Сохранить</Button></div><SectionCard title="Отметить посещаемость" action={<button className="filter">Всем: присутствовал <ChevronDown size={15}/></button>}><div className="attendance-editor">{["Амина Серикова", "Алан Мусин", "Мария Ли", "Данияр Омаров", "София Ким"].map((name, i) => <div key={name}><span className="avatar">{name.split(" ").map(x=>x[0]).join("")}</span><b>{name}</b><select value={statuses[i]} onChange={(e) => { const next=[...statuses]; next[i]=e.target.value; setStatuses(next); setSaved(false); }}><option>Присутствовал</option><option>Опоздал</option><option>Отсутствовал</option><option>Уважительная причина</option></select></div>)}</div></SectionCard></>;
  return <><div className="stats-grid compact"><StatCard icon={CalendarDays} label="Проведено занятий" value="8" note="в мае"/><StatCard icon={Check} label="Посещено" value="7" note="занятий" color="green"/><StatCard icon={X} label="Пропущено" value="1" note="занятие"/><StatCard icon={TrendingUp} label="Посещаемость" value="87%" note="за месяц" color="green"/></div><div className="two-col attendance-layout"><SectionCard title="Май 2025" action={<button className="filter">Выбрать месяц <ChevronDown size={15}/></button>}><div className="calendar-head">{["Пн","Вт","Ср","Чт","Пт","Сб","Вс"].map(d=><b key={d}>{d}</b>)}</div><div className="calendar-grid">{Array.from({length:35},(_,i)=>{const day=i-2; const status=attendanceDays.find(x=>x[0]===String(day))?.[1]; return <span key={i} className={`${day<1||day>31?"muted-day":""} ${status??""}`}>{day<1?28+day:day>31?day-31:day}{status&&<i>{status==="ok"?<Check size={11}/>:status==="late"?<Clock3 size={11}/>:<X size={11}/>}</i>}</span>})}</div><div className="legend"><span><i className="dot green"/>Присутствовал</span><span><i className="dot orange"/>Опоздал</span><span><i className="dot red"/>Отсутствовал</span></div></SectionCard><SectionCard title="Занятия"><div className="simple-list">{[["16 мая, Пт","Unit 2 Lesson 6","ok"],["14 мая, Ср","Unit 2 Lesson 5","ok"],["12 мая, Пн","Unit 2 Lesson 4","ok"],["9 мая, Пт","Unit 2 Lesson 3","ok"],["7 мая, Ср","Unit 2 Lesson 2","late"]].map(([date,title,status])=><div key={date}><time>{date}</time><b>{title}</b><StatusBadge tone={status==="late"?"orange":"green"}>{status==="late"?"Опоздал":"Был(а)"}</StatusBadge></div>)}</div></SectionCard></div></>;
}

function ProgressPage() {
  const [period, setPeriod] = useState("6 месяцев");
  return <><div className="tabs">{["6 месяцев","3 месяца","Месяц","Всё время"].map(x=><button onClick={()=>setPeriod(x)} className={period===x?"active":""} key={x}>{x}</button>)}</div><SectionCard title="Прогресс по навыкам" action={<StatusBadge>{period}</StatusBadge>}><div className="chart-legend">{[["#ff1028","Speaking"],["#ff8a00","Listening"],["#2878ee","Reading"],["#19a445","Writing"],["#8b3fd1","Vocabulary"]].map(([c,n])=><span key={n}><i style={{background:c}}/>{n}</span>)}</div><div className="chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={progressData} margin={{top:10,right:10,left:-22,bottom:0}}><CartesianGrid stroke="#eef0f3" vertical={false}/><XAxis dataKey="month" tickLine={false} axisLine={false}/><YAxis domain={[0,10]} tickLine={false} axisLine={false}/><Tooltip/><Line type="monotone" dataKey="Speaking" stroke="#ff1028" strokeWidth={3}/><Line type="monotone" dataKey="Listening" stroke="#ff8a00" strokeWidth={2}/><Line type="monotone" dataKey="Reading" stroke="#2878ee" strokeWidth={2}/><Line type="monotone" dataKey="Writing" stroke="#19a445" strokeWidth={2}/><Line type="monotone" dataKey="Vocabulary" stroke="#8b3fd1" strokeWidth={2}/></LineChart></ResponsiveContainer></div></SectionCard><div className="progress-overview"><SectionCard title="Результаты тестов"><strong>68% → 82%</strong><div className="mini-bars"><i style={{height:"48%"}}/><i style={{height:"64%"}}/><i style={{height:"78%"}}/><i style={{height:"82%"}}/></div></SectionCard><SectionCard title="Посещаемость"><strong>87%</strong><div className="metric-track"><i style={{width:"87%"}}/></div><small>7 из 8 занятий в мае</small></SectionCard><SectionCard title="Изучено слов"><strong>34</strong><div className="mini-bars green"><i style={{height:"42%"}}/><i style={{height:"55%"}}/><i style={{height:"72%"}}/><i style={{height:"90%"}}/></div></SectionCard></div><div className="two-col"><SectionCard title="Последние достижения"><div className="achievement"><Star/><div><b>Лучший результат в тесте</b><p>Unit 2 Test — 82%</p></div></div><div className="achievement"><GraduationCap/><div><b>Изучено новых слов</b><p>34 слова за май</p></div></div></SectionCard><SectionCard title="Фокус на следующий месяц"><p className="muted">Продолжить развивать уверенную устную речь и уделить больше внимания письменным заданиям.</p><div className="progress-bar"><i style={{width:"68%"}}/></div><small>Общий прогресс · 68%</small></SectionCard></div></>;
}

function FeedbackPage() { return <div className="feedback-list">{[["Май 2025","Амина стала увереннее отвечать на вопросы и использовать новые слова в предложениях.","Нужно уделить больше внимания письменным заданиям и правописанию.","Читайте вместе по 10 минут и просите пересказать текст.","Уверенный прогресс, мотивация сохраняется."],["Апрель 2025","Хороший прогресс в чтении и словарном запасе.","Рекомендуется больше практиковать устную речь.","Повторяйте новые слова в бытовых диалогах.","Цели месяца достигнуты."],["Март 2025","Ребёнок активно участвует в уроках.","Нужно повторять новые слова после каждого занятия.","Используйте карточки 2–3 раза в неделю.","Хороший старт учебного периода."]].map(([month,good,improve,recommendation,summary])=><SectionCard key={month} title={month} action={<StatusBadge>Хороший прогресс</StatusBadge>}><p className="label">Достижения</p><p>{good}</p><p className="label">Что улучшить</p><p>{improve}</p><p className="label">Рекомендации родителям</p><p>{recommendation}</p><p className="label">Общий комментарий</p><p>{summary}</p><div className="teacher-sign"><span className="avatar">АС</span><div><b>Айгуль Сериковна</b><small>10 мая 2025</small></div></div></SectionCard>)}</div> }

function HistoryPage() { return <SectionCard><div className="timeline">{[["15 мая 2025","Завершён раздел My World","Пройдено 5 тем, итоговый тест — 82%"],["1 мая 2025","Ежемесячный отчёт","Хороший прогресс по Speaking и Vocabulary"],["2 фев 2025","Смена учебника","Начат Family and Friends 1"],["10 янв 2025","Смена группы и преподавателя","Перевод в Kids Starter · Айгуль Сериковна"],["20 дек 2024","Важный тест","Starter Checkpoint — 74%"],["1 сен 2024","Начало обучения","Уровень Starter"]].map(([date,title,text],i)=><div key={date}><i>{i===0?<Star size={16}/>:<Check size={16}/>}</i><time>{date}</time><h3>{title}</h3><p>{text}</p></div>)}</div></SectionCard> }

function ProfilePage() { return <div className="two-col"><SectionCard title="Данные родителя"><div className="profile-hero"><span className="avatar big">МС</span><div><h3>Мама Амины</h3><p>Родитель · 2 ребёнка</p></div></div><dl className="profile-dl"><div><dt>Телефон</dt><dd>+7 701 524 1191</dd></div><div><dt>Email</dt><dd>serikova@example.com</dd></div><div><dt>Язык интерфейса</dt><dd>Русский</dd></div></dl><Button secondary>Редактировать данные</Button></SectionCard><SectionCard title="Дети"><div className="child-profile"><div className="student-avatar small">АС</div><div><h3>{currentStudent.name}</h3><p>{currentStudent.group} · {currentStudent.level}</p><small>{currentStudent.teacher} · {currentStudent.book}</small><small>Период: сентябрь 2024 — май 2025</small></div><ChevronRight/></div><div className="child-profile"><div className="student-avatar small blue">ДС</div><div><h3>Данияр Сериков</h3><p>Kids A1 · Beginner</p><small>Максим Станиславов · Academy Stars 1</small><small>Период: январь — май 2025</small></div><ChevronRight/></div></SectionCard></div> }

function AdminDashboard() { return <><div className="stats-grid"><StatCard icon={GraduationCap} label="Ученики" value="148" note="+12 за месяц"/><StatCard icon={UserRound} label="Учителя" value="12" note="10 активны"/><StatCard icon={UsersRound} label="Группы" value="21" note="4 уровня"/><StatCard icon={CalendarDays} label="Занятия" value="326" note="в этом месяце"/></div><div className="two-col"><SectionCard title="Наполняемость групп"><div className="bar-list">{groups.map(g=><div key={g[0]}><span>{g[0]}</span><i><b style={{width:g[5]}}/></i><strong>{g[3]}</strong></div>)}</div></SectionCard><SectionCard title="Последние действия"><div className="event-list">{[[Plus,"Создана группа Kids A1","Сегодня, 10:42"],[UserRound,"Добавлен учитель","Вчера, 16:20"],[Archive,"Ученик перемещён в архив","30 июля, 12:04"]].map(([Icon,text,date])=><div className="event" key={String(text)}><span><Icon size={18}/></span><p><b>{String(text)}</b><small>{String(date)}</small></p></div>)}</div></SectionCard></div></> }

function AdminEntity({ entity }: { entity: string }) {
  const rows=adminEntities[entity]??[];
  const headersBy:Record<string,string[]>={teachers:["Учитель","Нагрузка","Ученики","Статус"],parents:["Родитель","Телефон","Дети","Статус"],students:["Ученик","Группа","Уровень","Статус"],groups:["Группа","Уровень","Учебник","Ученики","Раздел","Прогресс"],courses:["Курс","Уровни","Группы","Статус"],books:["Учебник","Уровень","Издательство","Разделы"],units:["Раздел","Учебник","Темы","Статус"],topics:["Тема","Раздел","Дата","Статус"],periods:["Период","Начало","Окончание","Статус"],skills:["Навык","Описание","Шкала","Статус"],archive:["Название","Тип","Причина","Дата"]};
  return <><div className="page-actions"><FilterBar/><Button><Plus size={17}/>Добавить</Button></div><SectionCard><DataTable headers={headersBy[entity]??["Название","Данные","Статус"]} rows={rows}/><div className="pagination"><button disabled>Назад</button><span>1 <b>из 4</b></span><button>Вперёд</button></div></SectionCard></>;
}

function GenericDataPage({ type }: { type: string }) {
  if(type==="words") return <><FilterBar/><SectionCard><DataTable headers={["Слово","Перевод","Тема","Раздел","Дата изучения","Статус"]} rows={words}/></SectionCard></>;
  if(type==="tests") return <><FilterBar search={false}/><SectionCard><DataTable headers={["Название теста","Раздел","Дата","Балл","Максимум","Процент","Комментарий","Статус"]} rows={tests}/></SectionCard><SectionCard title="Навыки · Unit 2 Test" className="skill-details"><div className="bar-list">{[["Speaking","9 / 10","90%"],["Listening","8 / 10","80%"],["Reading","8 / 10","80%"],["Writing","7 / 10","70%"]].map(([skill,value,width])=><div key={skill}><span>{skill}</span><i><b style={{width}}/></i><strong>{value}</strong></div>)}</div></SectionCard></>;
  if(type==="homework") return <><FilterBar/><SectionCard><DataTable headers={["Дата","Срок","Учебник","Страница","Упражнение","Описание","Материал / комментарий","Статус"]} rows={homework}/></SectionCard></>;
  if(type==="grades") return <><FilterBar/><SectionCard title="Оценки · Kids Starter"><DataTable headers={["Ученик","Speaking","Listening","Reading","Homework"]} rows={[["Амина Серикова","8","7","8","9"],["Алан Мусин","7","8","7","8"],["Мария Ли","9","9","8","9"]]}/><div className="form-actions"><Button>Сохранить оценки</Button></div></SectionCard></>;
  return <EmptyState/>;
}

function PageContent({ role, page }: { role: Role; page: string }) {
  if(role==="parent") {
    if(page==="home") return <ParentHome/>; if(page==="lessons") return <LessonsPage/>; if(page==="attendance") return <AttendancePage/>; if(page==="progress") return <ProgressPage/>; if(page==="feedback") return <FeedbackPage/>; if(page==="history") return <HistoryPage/>; if(page==="profile") return <ProfilePage/>; return <GenericDataPage type={page}/>;
  }
  if(role==="teacher") {
    return <TeacherPortal page={page} ui={{Button,SectionCard,StatusBadge,StatCard}}/>;
  }
  if(page==="home") return <AdminDashboard/>;
  return <AdminEntity entity={page}/>;
}

export function Portal() {
  const pathname=usePathname();
  const parts=pathname.split("/").filter(Boolean);
  const role=(parts[0]&&["parent","teacher","admin"].includes(parts[0])?parts[0]:"parent") as Role;
  const page=parts[1]||"home";
  const title=pageTitles[role][page]??"Happy Town";
  const [drawer,setDrawer]=useState(false);
  const active=useMemo(()=>page,[page]);
  return <div className="app-shell"><AppSidebar role={role} active={active}/><div className={`mobile-drawer ${drawer?"open":""}`}><button onClick={()=>setDrawer(false)} aria-label="Закрыть меню"><X/></button><AppSidebar role={role} active={active}/></div>{drawer&&<button className="drawer-backdrop" onClick={()=>setDrawer(false)} aria-label="Закрыть меню"/>}<main><Topbar role={role} title={title} onMenu={()=>setDrawer(true)}/><div className="content"><PageContent role={role} page={page}/></div></main><MobileNav role={role} active={active}/></div>;
}
