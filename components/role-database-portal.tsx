"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, ChevronRight, UsersRound } from "lucide-react";
import type { ParentPortalData, RoleStudent, TeacherPortalData } from "../lib/types/role-portal";
import { EntityStatusBadge } from "./ui/entity-status-badge";

function Empty({ children }: { children: React.ReactNode }) {
  return <section className="section-card"><div className="empty-state"><span><UsersRound/></span><h3>{children}</h3></div></section>;
}

function StudentCard({ student, href }: { student: RoleStudent; href?: string }) {
  const content = <article className="teacher-student-card"><div className="student-card-main"><span className="avatar teacher-avatar">{student.initials}</span><div><h3>{student.name}</h3><p>{student.groupName ?? "Без группы"} · {student.level}</p></div><EntityStatusBadge status={student.status}/></div><dl><div><dt>Учебник</dt><dd>{student.bookName ?? "—"}</dd></div><div><dt>Учитель</dt><dd>{student.teacherName ?? "Не назначен"}</dd></div><div><dt>Родители</dt><dd>{student.parentNames.join(", ") || "Не привязаны"}</dd></div></dl>{href&&<span className="card-link">Открыть профиль <ChevronRight size={15}/></span>}</article>;
  return href ? <Link href={href}>{content}</Link> : content;
}

export function TeacherDatabasePortal({ data }: { data: TeacherPortalData }) {
  const parts = usePathname().split("/").filter(Boolean); const page = parts[1] ?? "home"; const entityId = parts[2];
  const allStudents = data.groups.flatMap(group => group.students);
  if (page === "profile") return <div className="dashboard-columns"><section className="section-card"><div className="section-head"><h2>Профиль учителя</h2></div><div className="profile-hero"><span className="avatar big">{data.teacher.name.split(" ").map(v=>v[0]).slice(0,2).join("")}</span><div><h3>{data.teacher.name}</h3><p>{data.teacher.email}</p><p>{data.teacher.phone}</p></div></div></section><section className="section-card"><div className="section-head"><h2>Моя нагрузка</h2></div><div className="student-metrics profile-metrics"><article><span>Группы</span><b>{data.groups.length}</b></article><article><span>Ученики</span><b>{allStudents.length}</b></article></div></section></div>;
  if (page === "students") {
    const selected = entityId ? allStudents.find(student => student.id === entityId) : null;
    if (entityId && !selected) return <Empty>Ученик не найден среди назначенных групп</Empty>;
    return selected ? <><Link className="back-link" href="/teacher/students">Все ученики</Link><StudentCard student={selected}/></> : allStudents.length ? <section className="section-card"><div className="section-head"><h2>Мои ученики</h2></div><div className="teacher-student-grid">{allStudents.map(student=><StudentCard key={student.id} student={student} href={`/teacher/students/${student.id}`}/>)}</div></section> : <Empty>В назначенных группах пока нет учеников</Empty>;
  }
  if (page === "groups" && entityId) {
    const group=data.groups.find(item=>item.id===entityId); if(!group)return <Empty>Группа не назначена этому учителю</Empty>;
    return <><Link className="back-link" href="/teacher/groups">Все группы</Link><section className="group-header"><div className="group-header-top"><span className="group-mark large"><UsersRound/></span><div><EntityStatusBadge status={group.status}/><h2>{group.name}</h2><p>{group.bookName} · {group.level} · {group.periodName}</p></div></div></section>{group.students.length?<div className="teacher-student-grid">{group.students.map(student=><StudentCard key={student.id} student={student} href={`/teacher/students/${student.id}`}/>)}</div>:<Empty>В этой группе пока нет учеников</Empty>}</>;
  }
  if (!data.groups.length) return <Empty>Вам пока не назначены группы</Empty>;
  return <><section className="welcome teacher-welcome"><div><p>Добрый день, {data.teacher.name}!</p><h2>{data.groups.length} назначенных групп</h2><span>Данные загружены из PostgreSQL</span></div></section><div className="teacher-group-grid cards">{data.groups.map(group=><Link href={`/teacher/groups/${group.id}`} key={group.id}><article className="group-card"><div className="card-top"><span className="group-mark"><UsersRound/></span><EntityStatusBadge status={group.status}/></div><h3>{group.name}</h3><p>{group.level} · {group.bookName}</p><div className="group-meta"><span><b>{group.students.length}</b> учеников</span><span>{group.periodName}</span></div></article></Link>)}</div></>;
}

export function ParentDatabasePortal({ data }: { data: ParentPortalData }) {
  if (!data.children.length) return <Empty>К вашему аккаунту пока не привязан ребёнок. Обратитесь к администратору</Empty>;
  return <><section className="welcome"><div><p>Кабинет родителя</p><h2>{data.parent.name}</h2><span>{data.children.length > 1 ? `Привязано детей: ${data.children.length}` : "Привязан 1 ребёнок"}</span></div></section><div className="teacher-student-grid">{data.children.map(child=><StudentCard key={child.id} student={child}/>)}</div><section className="section-card"><div className="section-head"><h2>Данные обучения</h2></div><p className="muted"><BookOpen size={16}/> Отображаются только дети из активных связей ParentStudentRelation. Учебная группа и учитель получены через активное зачисление.</p></section></>;
}
