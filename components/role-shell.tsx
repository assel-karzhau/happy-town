"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  BarChart3, BookOpen, CalendarDays, ChevronRight, ClipboardCheck, FileText,
  GraduationCap, History, Home, LogOut, Menu, MessageSquareText, MoreHorizontal,
  Star, UserRound, UsersRound, X,
} from "lucide-react";

type Role = "teacher" | "parent";
type NavKey = "home" | "groups" | "attendance" | "lessons" | "topics" | "homework" | "words" | "tests" | "assessments" | "reviews" | "students" | "profile" | "progress" | "history";
type NavItem = { label: string; href: string; key: NavKey };

const icons: Record<NavKey, typeof Home> = {
  home: Home, groups: UsersRound, attendance: CalendarDays, lessons: BookOpen, topics: BookOpen,
  homework: ClipboardCheck, words: GraduationCap, tests: FileText, assessments: Star,
  reviews: MessageSquareText, students: UsersRound, profile: UserRound, progress: BarChart3, history: History,
};

const navigation: Record<Role, NavItem[]> = {
  teacher: [
    { label: "Главная", href: "/teacher", key: "home" },
    { label: "Мои группы", href: "/teacher/groups", key: "groups" },
    { label: "Посещаемость", href: "/teacher/attendance", key: "attendance" },
    { label: "Уроки и темы", href: "/teacher/lessons", key: "lessons" },
    { label: "Домашние задания", href: "/teacher/homework", key: "homework" },
    { label: "Слова", href: "/teacher/words", key: "words" },
    { label: "Тесты", href: "/teacher/tests", key: "tests" },
    { label: "Ежемесячные оценки", href: "/teacher/assessments", key: "assessments" },
    { label: "Отзывы", href: "/teacher/reviews", key: "reviews" },
    { label: "Ученики", href: "/teacher/students", key: "students" },
    { label: "Профиль", href: "/teacher/profile", key: "profile" },
  ],
  parent: [
    { label: "Главная", href: "/parent", key: "home" },
    { label: "Темы", href: "/parent/topics", key: "topics" },
    { label: "Слова", href: "/parent/words", key: "words" },
    { label: "Домашние задания", href: "/parent/homework", key: "homework" },
    { label: "Посещаемость", href: "/parent/attendance", key: "attendance" },
    { label: "Тесты", href: "/parent/tests", key: "tests" },
    { label: "Прогресс", href: "/parent/progress", key: "progress" },
    { label: "Отзывы учителя", href: "/parent/reviews", key: "reviews" },
    { label: "История обучения", href: "/parent/history", key: "history" },
    { label: "Профиль", href: "/parent/profile", key: "profile" },
  ],
};

const titles: Record<string, string> = {
  teacher: "Кабинет учителя", parent: "Кабинет родителя", groups: "Мои группы", attendance: "Посещаемость",
  lessons: "Уроки и темы", topics: "Темы и уроки", homework: "Домашние задания", words: "Слова",
  tests: "Тесты", assessments: "Ежемесячные оценки", reviews: "Отзывы", students: "Ученики",
  profile: "Профиль", progress: "Прогресс", history: "История обучения",
};

function Logo({ size = 72 }: { size?: number }) {
  return <Image src="/images/happy-town-logo.png" width={size} height={size} alt="Happy Town" className="logo" priority unoptimized />;
}

export function RoleShell({ role, user, children }: { role: Role; user: { name: string; email: string }; children: React.ReactNode }) {
  const pathname = usePathname();
  const [drawer, setDrawer] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const nav = navigation[role];
  const pageKey = pathname.split("/").filter(Boolean)[1] ?? role;
  const title = titles[pageKey] ?? "Happy Town";
  const primary = role === "teacher" ? nav.slice(0, 4) : [nav[0], nav[1], nav[3], nav[6]];
  const more = nav.filter((item) => !primary.some((primaryItem) => primaryItem.href === item.href));
  const initials = user.name.split(" ").map((item) => item[0]).slice(0, 2).join("");
  const isActive = (item: NavItem) => item.href === `/${role}` ? pathname === item.href : pathname.startsWith(item.href);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setDrawer(false); setMoreOpen(false); setLogoutOpen(false); }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  const links = (variant: "desktop" | "drawer") => <nav className={variant === "drawer" ? "role-drawer-links" : ""} aria-label="Основная навигация">
    {nav.map((item) => {
      const Icon = icons[item.key];
      return <Link className={isActive(item) ? "active" : ""} href={item.href} key={item.href} onClick={() => setDrawer(false)}><Icon size={18} /><span>{item.label}</span></Link>;
    })}
  </nav>;

  return <div className={`app-shell role-layout ${role}-layout`}>
    <aside className="sidebar role-sidebar">
      <Link className="brand role-logo" href={`/${role}`} aria-label="Happy Town"><Logo size={84} /></Link>
      {links("desktop")}
      <div className="help-card"><b>Есть вопросы?</b><span>Свяжитесь с нами</span><strong>+7 701 524 1191</strong></div>
      <small className="copyright">© Happy Town · 2026</small>
    </aside>

    {drawer && <button className="drawer-backdrop" onClick={() => setDrawer(false)} aria-label="Закрыть меню" />}
    <aside className={`mobile-drawer role-mobile-drawer ${drawer ? "open" : ""}`} aria-hidden={!drawer}>
      <header>
        <Link href={`/${role}`} onClick={() => setDrawer(false)} aria-label="Главная Happy Town"><Logo size={54} /></Link>
        <button className="icon-btn" onClick={() => setDrawer(false)} aria-label="Закрыть меню"><X size={20} /></button>
      </header>
      {links("drawer")}
      <div className="drawer-footer">
        <div className="help-card"><b>Нужна помощь?</b><span>Поддержка Happy Town</span></div>
        <button className="mobile-logout" onClick={() => { setDrawer(false); setLogoutOpen(true); }}><LogOut size={19} /><span>Выйти из аккаунта</span><ChevronRight size={17} /></button>
      </div>
    </aside>

    <main>
      <header className="topbar role-topbar">
        <div className="mobile-header-row">
          <Logo size={54} />
          <button className="icon-btn menu-trigger" onClick={() => setDrawer(true)} aria-label="Открыть меню"><Menu size={21} /></button>
        </div>
        <div className="page-heading"><p className="eyebrow">Электронный дневник</p><h1>{title}</h1></div>
        <div className="top-actions desktop-actions">
          <div className="profile-chip"><span className="avatar">{initials}</span><span><b>{user.name}</b><small>{user.email}</small></span></div>
          <button className="icon-btn" onClick={() => setLogoutOpen(true)} aria-label="Выйти"><LogOut size={18} /></button>
        </div>
      </header>
      <div className="content role-content">{children}</div>
    </main>

    <nav className="mobile-nav role-mobile-nav" aria-label="Мобильная навигация">
      {primary.map((item) => { const Icon = icons[item.key]; return <Link href={item.href} className={isActive(item) ? "active" : ""} key={item.href}><Icon size={21} /><span>{item.label}</span></Link>; })}
      <button className={more.some(isActive) ? "active" : ""} onClick={() => setMoreOpen(true)} aria-label="Открыть дополнительные разделы"><MoreHorizontal size={22} /><span>Ещё</span></button>
    </nav>

    {moreOpen && <div className="dialog-layer mobile-more-layer role-more-layer" onMouseDown={(event) => event.target === event.currentTarget && setMoreOpen(false)}>
      <section className="mobile-more-sheet" role="dialog" aria-modal="true" aria-label="Дополнительные разделы">
        <div className="mobile-sheet-title"><span /><h2>Ещё</h2><button onClick={() => setMoreOpen(false)} aria-label="Закрыть"><X size={20} /></button></div>
        <nav>{more.map((item) => { const Icon = icons[item.key]; return <Link href={item.href} className={isActive(item) ? "active" : ""} onClick={() => setMoreOpen(false)} key={item.href}><Icon size={20} /><span>{item.label}</span><ChevronRight size={17} /></Link>; })}
          <button className="mobile-logout" onClick={() => { setMoreOpen(false); setLogoutOpen(true); }}><LogOut size={20} /><span>Выйти из аккаунта</span><ChevronRight size={17} /></button>
        </nav>
      </section>
    </div>}

    {logoutOpen && <div className="admin-modal-layer" onMouseDown={(event) => event.target === event.currentTarget && setLogoutOpen(false)}>
      <section className="admin-modal compact" role="dialog" aria-modal="true" aria-labelledby="role-logout-title">
        <header><div><span>Happy Town</span><h2 id="role-logout-title">Выйти из аккаунта?</h2></div><button onClick={() => setLogoutOpen(false)} aria-label="Закрыть"><X /></button></header>
        <p className="logout-copy">Вы уверены, что хотите выйти из аккаунта?</p>
        <div className="admin-form-actions"><button className="btn secondary" onClick={() => setLogoutOpen(false)}>Отмена</button><button className="btn danger-btn" onClick={() => signOut({ callbackUrl: "/login" })}><LogOut size={17} />Выйти</button></div>
      </section>
    </div>}
  </div>;
}
