"use client";

import Image from "next/image";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { Archive, BookOpen, ChevronRight, GraduationCap, History, Home, Layers3, LogOut, Menu, MoreHorizontal, ShieldCheck, Star, UserRound, UsersRound, X } from "lucide-react";
import { AdminCatalogManager } from "./admin-catalog-manager";
import { AdminDatabasePortal } from "./admin-database-portal";
import { EntityStatusBadge } from "./ui/entity-status-badge";
import type { AdminCatalogData, AdminPortalData } from "../lib/types/admin-api";

type Page = "home"|"teachers"|"parents"|"students"|"groups"|"books"|"units"|"topics"|"skills"|"history"|"archive"|"profile";
type User = {name:string;email:string};
const navigation:Array<{page:Page;label:string;icon:typeof Home}>=[
  {page:"home",label:"Главная",icon:Home},{page:"teachers",label:"Учителя",icon:UserRound},{page:"parents",label:"Родители",icon:UsersRound},{page:"students",label:"Ученики",icon:GraduationCap},{page:"groups",label:"Группы",icon:UsersRound},
  {page:"books",label:"Учебники",icon:BookOpen},{page:"units",label:"Разделы и темы",icon:Layers3},{page:"skills",label:"Категории навыков",icon:Star},{page:"history",label:"История обучения",icon:History},{page:"archive",label:"Архив",icon:Archive},{page:"profile",label:"Профиль",icon:UserRound},
];
const titles:Record<Page,string>={home:"Главная",teachers:"Учителя",parents:"Родители",students:"Ученики",groups:"Группы",books:"Учебники",units:"Разделы и темы",topics:"Разделы и темы",skills:"Категории навыков",history:"История обучения",archive:"Архив",profile:"Профиль"};
const href=(page:Page)=>page==="home"?"/admin":`/admin/${page}`;

function Logo({size=72}:{size?:number}) { return <Image src="/images/happy-town-logo.png" width={size} height={size} alt="Happy Town" className="logo" priority unoptimized/>; }

function Sidebar({page,onNavigate,onLogout}:{page:Page;onNavigate?:()=>void;onLogout?:()=>void}) { return <aside className="sidebar"><div className="brand"><Logo size={84}/></div><nav aria-label="Основная навигация">{navigation.map(item=>{const Icon=item.icon;return <a key={item.page} href={href(item.page)} onClick={onNavigate} className={page===item.page||page==="topics"&&item.page==="units"?"active":""}><Icon size={18}/><span>{item.label}</span></a>;})}</nav>{onLogout&&<button className="drawer-logout" onClick={onLogout}><LogOut size={18}/><span>Выйти из аккаунта</span></button>}<div className="help-card"><b>Есть вопросы?</b><span>Свяжитесь с нами</span><strong>+7 701 524 1191</strong></div><small className="copyright">© Happy Town · 2026</small></aside>; }

function ProfileChip({user}:{user:User}) { return <div className="profile-chip"><span className="avatar">{user.name.split(" ").map(part=>part[0]).slice(0,2).join("")}</span><span><b>{user.name}</b><small>{user.email}</small></span></div>; }

function Empty({children}:{children:string}) { return <p className="admin-empty">{children}</p>; }

function CatalogPage({page,data,user}:{page:Page;data:AdminCatalogData;user:User}) {
  if(page==="books"||page==="skills") return <AdminCatalogManager kind={page} data={data}/>;
  if(page==="units"||page==="topics") return <AdminCatalogManager kind="units" data={data}/>;
  if(page==="history") return <section className="section-card">{data.history.length?<div className="timeline">{data.history.map(item=><div key={item.id}><i><History size={16}/></i><time>{new Intl.DateTimeFormat("ru-RU",{dateStyle:"medium"}).format(new Date(item.eventDate))}</time><h3>{item.title}</h3><p>{[item.studentName,item.actorName,item.description].filter(Boolean).join(" · ")}</p></div>)}</div>:<Empty>История обучения пока пуста.</Empty>}</section>;
  return <section className="section-card"><div className="profile-hero"><span className="avatar big">{user.name.split(" ").map(part=>part[0]).slice(0,2).join("")}</span><div><h3>{user.name}</h3><p>Администратор</p></div></div><dl className="profile-dl"><div><dt>Email</dt><dd>{user.email||"Не указан"}</dd></div><div><dt>Роль</dt><dd>Администратор</dd></div><div><dt>Статус</dt><dd><EntityStatusBadge status="active" label="Активен"/></dd></div></dl></section>;
}

function Content({page,data,user}:{page:Page;data:AdminPortalData;user:User}) { return ["home","teachers","parents","students","groups","archive"].includes(page)?<AdminDatabasePortal page={page} initial={data}/>:<CatalogPage page={page} data={data.catalogData} user={user}/>; }

export function AdminShell({page,data,user}:{page:Page;data:AdminPortalData;user:User}) {
  const [drawer,setDrawer]=useState(false);const [more,setMore]=useState(false);const [logout,setLogout]=useState(false);
  const mobile=["home","students","groups"] as Page[];const moreItems=navigation.filter(item=>!mobile.includes(item.page));
  return <div className="app-shell admin-layout"><Sidebar page={page}/><div className={`mobile-drawer ${drawer?"open":""}`}><button onClick={()=>setDrawer(false)} aria-label="Закрыть меню"><X/></button><Sidebar page={page} onNavigate={()=>setDrawer(false)} onLogout={()=>{setDrawer(false);setLogout(true)}}/></div>{drawer&&<button className="drawer-backdrop" onClick={()=>setDrawer(false)} aria-label="Закрыть меню"/>}<main><header className="topbar"><div className="mobile-header-row"><Logo size={62}/><div className="mobile-header-actions"><button className="icon-btn menu-trigger" onClick={()=>setDrawer(true)} aria-label="Открыть меню"><Menu size={21}/></button></div></div><div className="page-heading"><p className="eyebrow">Электронный дневник</p><h1>{titles[page]}</h1></div><div className="top-actions desktop-actions"><ProfileChip user={user}/><button className="icon-btn" onClick={()=>setLogout(true)} aria-label="Выйти"><LogOut size={18}/></button></div></header><div className="content"><Content page={page} data={data} user={user}/></div></main><nav className="mobile-nav" aria-label="Мобильная навигация администратора">{mobile.map(item=>{const navItem=navigation.find(entry=>entry.page===item)!;const Icon=navItem.icon;return <Link key={item} href={href(item)} className={page===item?"active":""}><Icon size={21}/><span>{navItem.label}</span></Link>})}<button className={moreItems.some(item=>item.page===page||page==="topics"&&item.page==="units")?"active":""} onClick={()=>setMore(true)}><MoreHorizontal size={22}/><span>Ещё</span></button></nav>{more&&<div className="dialog-layer mobile-more-layer" onMouseDown={event=>event.target===event.currentTarget&&setMore(false)}><div className="mobile-more-sheet" role="dialog" aria-modal="true" aria-label="Ещё"><div><h2>Ещё</h2><button onClick={()=>setMore(false)} aria-label="Закрыть"><X/></button></div><nav>{moreItems.map(item=>{const Icon=item.icon;return <Link href={href(item.page)} onClick={()=>setMore(false)} key={item.page}><Icon size={20}/><span>{item.label}</span><ChevronRight size={17}/></Link>})}<button className="mobile-logout" onClick={()=>{setMore(false);setLogout(true)}}><LogOut size={20}/><span>Выйти из аккаунта</span><ChevronRight size={17}/></button></nav></div></div>}{logout&&<div className="dialog-layer" onMouseDown={event=>event.target===event.currentTarget&&setLogout(false)}><section className="logout-dialog admin-logout-dialog" role="dialog" aria-modal="true" aria-label="Выход"><span className="logout-dialog-icon"><ShieldCheck size={25}/></span><h2>Выйти из аккаунта?</h2><p>Текущая сессия администратора завершится. Войти снова можно с помощью ИИН и пароля.</p><div className="logout-account"><span className="avatar">{user.name.split(" ").map(part=>part[0]).slice(0,2).join("")}</span><span><b>{user.name}</b><small>{user.email}</small></span></div><div><button className="btn secondary" onClick={()=>setLogout(false)}>Остаться</button><button className="btn" onClick={()=>void signOut({callbackUrl:"/login"})}><LogOut size={17}/>Выйти</button></div></section></div>}</div>;
}
