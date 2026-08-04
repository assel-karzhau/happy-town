"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, Save } from "lucide-react";

type AttendanceData={groups:Array<{id:string;name:string}>;lessons:Array<{id:string;title:string;lessonDate:string;status:string;group:{id:string;name:string;enrollments:Array<{student:{id:string;name:string}}>};attendance:Array<{studentId:string;status:string;comment:string|null}>}>};
const labels:Record<string,string>={PRESENT:"Присутствовал",ABSENT:"Отсутствовал",LATE:"Опоздал",EXCUSED:"Уважительная причина",LESSON_CANCELLED:"Урок отменён"};
const statuses=Object.keys(labels);

export function AttendanceEditor({data}:{data:AttendanceData}){
  const [lessonId,setLessonId]=useState(data.lessons[0]?.id??""),lesson=useMemo(()=>data.lessons.find(item=>item.id===lessonId),[data.lessons,lessonId]);
  const initial=useMemo(()=>Object.fromEntries((lesson?.attendance??[]).map(item=>[item.studentId,item.status])),[lesson]);
  const [values,setValues]=useState<Record<string,string>>(initial),[dirty,setDirty]=useState(false),[saving,setSaving]=useState(false),[toast,setToast]=useState("");
  useEffect(()=>{const handler=(event:BeforeUnloadEvent)=>{if(dirty){event.preventDefault();event.returnValue=""}};window.addEventListener("beforeunload",handler);return()=>window.removeEventListener("beforeunload",handler)},[dirty]);
  function selectLesson(id:string){const next=data.lessons.find(item=>item.id===id);setLessonId(id);setValues(Object.fromEntries((next?.attendance??[]).map(item=>[item.studentId,item.status])));setDirty(false)}
  function update(studentId:string,status:string){setValues(prev=>({...prev,[studentId]:status}));setDirty(true)}
  function allPresent(){if(!lesson)return;setValues(Object.fromEntries(lesson.group.enrollments.map(item=>[item.student.id,"PRESENT"])));setDirty(true)}
  async function save(){
    if(!lesson)return;
    const missing=lesson.group.enrollments.some(item=>!values[item.student.id]);
    if(missing){setToast("Выберите статус для каждого ученика");return}
    setSaving(true);setToast("");
    try{
      const response=await fetch("/api/teacher/actions",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"saveAttendance",data:{lessonId:lesson.id,entries:lesson.group.enrollments.map(item=>({studentId:item.student.id,status:values[item.student.id]}))}})});
      const result=await response.json();if(!response.ok)throw new Error(result.error||"Не удалось сохранить посещаемость");setDirty(false);setToast("Посещаемость сохранена");
    }catch(error){setToast(error instanceof Error?error.message:"Не удалось сохранить посещаемость")}finally{setSaving(false)}
  }
  if(!data.lessons.length)return <section className="section-card empty-state"><span><Check/></span><h3>Нет уроков для отметки посещаемости</h3><p>Сначала добавьте урок в журнал.</p></section>;
  return <><section className="section-card"><div className="section-head"><div><h2>Параметры занятия</h2><p className="muted">Выберите урок и отметьте всех учеников</p></div></div><div className="compact-form"><label><span>Урок</span><select value={lessonId} onChange={event=>selectLesson(event.target.value)}>{data.lessons.map(item=><option value={item.id} key={item.id}>{new Date(item.lessonDate).toLocaleDateString("ru-RU")} · {item.group.name} · {item.title}</option>)}</select></label></div></section>{lesson&&<><section className="attendance-toolbar"><div><b>Журнал посещаемости</b><span>{lesson.group.name} · {lesson.group.enrollments.length} учеников</span></div><button onClick={allPresent}><Check size={16}/>Все присутствовали</button></section><section className="section-card attendance-card"><div className="attendance-register"><div className="attendance-register-head"><span>Ученик</span><span>Статус</span></div>{lesson.group.enrollments.map(({student})=><div className="attendance-student" key={student.id}><div><span className="avatar">{student.name.split(" ").map(v=>v[0]).slice(0,2).join("")}</span><b>{student.name}</b></div><select value={values[student.id]??""} onChange={event=>update(student.id,event.target.value)}><option value="">Выберите статус</option>{statuses.map(status=><option value={status} key={status}>{labels[status]}</option>)}</select></div>)}</div></section><div className="sticky-save"><span>{dirty?"Есть несохранённые изменения":"Все изменения сохранены"}</span><button className="btn" disabled={saving||!dirty} onClick={save}>{saving?<Loader2 className="spin"/>:<Save/>}Сохранить</button></div></>}{toast&&<div className="admin-toast success" role="status">{toast}</div>}</>;
}
