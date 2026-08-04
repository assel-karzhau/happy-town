"use client";

import { useState } from "react";
import { Loader2, Pencil, Save, X } from "lucide-react";
import { useRouter } from "next/navigation";

type Profile = { firstName:string; lastName:string; email:string; phone:string };

export function ProfileEditor({profile}:{profile:Profile}){
  const router=useRouter(),[editing,setEditing]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
  async function submit(event:React.FormEvent<HTMLFormElement>){event.preventDefault();setBusy(true);setMessage("");const form=new FormData(event.currentTarget);try{const response=await fetch("/api/profile",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({firstName:form.get("firstName"),lastName:form.get("lastName"),email:form.get("email"),phone:form.get("phone")||null})}),result=await response.json();if(!response.ok)throw new Error(result.error||"Не удалось сохранить профиль");setMessage("Данные сохранены");setEditing(false);router.refresh()}catch(error){setMessage(error instanceof Error?error.message:"Не удалось сохранить профиль")}finally{setBusy(false)}}
  if(!editing)return <div className="profile-editor"><button className="btn secondary" onClick={()=>setEditing(true)}><Pencil size={16}/>Редактировать</button>{message&&<span className="success-text">{message}</span>}</div>;
  return <form className="section-card compact-form profile-edit-form" onSubmit={submit}><div className="section-head"><h2>Редактирование профиля</h2><button type="button" className="icon-button" onClick={()=>setEditing(false)} aria-label="Закрыть"><X/></button></div><label><span>Имя</span><input name="firstName" defaultValue={profile.firstName} required/></label><label><span>Фамилия</span><input name="lastName" defaultValue={profile.lastName} required/></label><label><span>Email</span><input name="email" type="email" defaultValue={profile.email} required/></label><label><span>Телефон</span><input name="phone" type="tel" defaultValue={profile.phone}/></label><button className="btn" disabled={busy}>{busy?<Loader2 className="spin"/>:<Save size={17}/>}Сохранить</button>{message&&<p className="error-text">{message}</p>}</form>;
}
