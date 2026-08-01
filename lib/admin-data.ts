import type { AcademicPeriod, AdminGroup, AdminStudent, AdminUser, ArchivedEntity, AuditLogEntry, Book, Course, LearningHistoryEvent, Parent, SkillCategory, Teacher, Topic, Unit } from "./types";

export const adminUser: AdminUser = { id: "admin-1", name: "Марина Соколова", phone: "+7 701 524 11 91", email: "admin@happytown.kz", role: "ADMIN", createdAt: "12 августа 2023" };

export const adminTeachers: Teacher[] = [
  ["t1","Айгуль Сериковна","+7 701 101 20 30","aigul@happytown.kz",["g1","g2"],"active"],
  ["t2","Максим Станиславов","+7 702 202 30 40","maksim@happytown.kz",["g3"],"active"],
  ["t3","Елена Викторовна","+7 705 303 40 50","elena@happytown.kz",["g4"],"inactive"],
  ["t4","Диана Аскаровна","+7 707 404 50 60","diana@happytown.kz",["g5"],"active"],
].map(([id,name,phone,email,groupIds,status])=>({id,name,phone,email,groupIds,status}) as Teacher);

const parentNames = ["Мадина Серикова","Динара Омарова","Алия Мусина","Асем Ким","Гульмира Алиева","Наталья Ли","Айнур Калиева","Жанар Тлеубаева","Сауле Нурова","Индира Ахметова","Ольга Пак","Меруерт Ибраева","Лаура Садыкова","Карина Цой","Айжан Ермекова","Виктория Хан","Назгуль Бекова","Светлана Юн"];
export const adminParents: Parent[] = parentNames.map((name,index)=>({id:`p${index+1}`,name,phone:`+7 70${index%8+1} 5${String(index+11).padStart(2,"0")} ${20+index} ${30+index}`,email:`parent${index+1}@mail.kz`,studentIds:index<14?[`s${index+1}`]:[],status:"active"}));

const studentNames = ["Амина Серикова","Данияр Сериков","Алан Мусин","Мария Ли","София Ким","Арман Калиев","Аружан Алиева","Тимур Омаров","Ева Пак","Мирас Ахметов","Камилла Цой","Роман Хан","Адель Ермекова","Ильяс Беков","Дарья Юн","Санжар Ибраев","Алина Садыкова","Марк Нуров","Ясмина Тлеубаева","Дамир Калиев","Элина Омарова","Амир Мусин","Полина Ли","Алекс Ким"];
export const adminStudents: AdminStudent[] = studentNames.map((name,index)=>({id:`s${index+1}`,name,birthDate:`${String(index%27+1).padStart(2,"0")}.${String(index%9+1).padStart(2,"0")}.${2012+index%6}`,level:["Starter","Beginner","Elementary"][index%3],groupId:index<22?`g${index%5+1}`:undefined,parentIds:index<18?[`p${index+1}`]:[],status:index===19?"inactive":"active"}));

export const academicPeriods: AcademicPeriod[] = [
  {id:"ap1",name:"2025–2026",startDate:"01.09.2025",endDate:"31.05.2026",status:"active"},
  {id:"ap2",name:"Летний интенсив 2026",startDate:"01.06.2026",endDate:"15.08.2026",status:"upcoming"},
  {id:"ap3",name:"2024–2025",startDate:"01.09.2024",endDate:"31.05.2025",status:"inactive"},
];
export const courses: Course[] = [
  {id:"c1",name:"Kids English",level:"Starter–A1",description:"Английский для младших школьников",status:"active"},
  {id:"c2",name:"Teen English",level:"A1–B1",description:"Курс для подростков",status:"active"},
  {id:"c3",name:"Speaking Club",level:"A2",description:"Разговорная практика",status:"active"},
  {id:"c4",name:"Summer English",level:"Starter",description:"Летний интенсив",status:"draft"},
];
export const books: Book[] = [
  {id:"b1",title:"Family and Friends 1",courseId:"c1",publisher:"Oxford",unitIds:["u1","u2","u3"],status:"active"},
  {id:"b2",title:"Academy Stars 1",courseId:"c1",publisher:"Macmillan",unitIds:["u4"],status:"active"},
  {id:"b3",title:"Solutions Elementary",courseId:"c2",publisher:"Oxford",unitIds:["u5"],status:"active"},
  {id:"b4",title:"Speakout A2",courseId:"c3",publisher:"Pearson",unitIds:["u6"],status:"active"},
];
export const units: Unit[] = ["Hello!","My World","My Family","School Days","Free Time","People"].map((title,index)=>({id:`u${index+1}`,bookId:index<3?"b1":`b${Math.min(index-1,4)}`,title:`Unit ${index+1} · ${title}`,order:index+1,topicIds:[`tp${index*2+1}`,`tp${index*2+2}`],status:"active"}));
export const topics: Topic[] = units.flatMap((unit,index)=>[{id:`tp${index*2+1}`,unitId:unit.id,title:["Greetings","Toys","Family","Classroom","Hobbies","Appearance"][index],order:1,status:"active"},{id:`tp${index*2+2}`,unitId:unit.id,title:["Numbers","Colours","My home","School subjects","Sports","Character"][index],order:2,status:"active"}]);
export const adminGroups: AdminGroup[] = [
  {id:"g1",name:"Kids Starter",level:"Starter",teacherId:"t1",bookId:"b1",periodId:"ap1",capacity:10,studentIds:adminStudents.filter((_,i)=>i%5===0&&i<22).map(s=>s.id),status:"active"},
  {id:"g2",name:"Kids A1",level:"Beginner",teacherId:"t1",bookId:"b2",periodId:"ap1",capacity:10,studentIds:adminStudents.filter((_,i)=>i%5===1&&i<22).map(s=>s.id),status:"active"},
  {id:"g3",name:"Teens A2",level:"Elementary",teacherId:"t2",bookId:"b3",periodId:"ap1",capacity:12,studentIds:adminStudents.filter((_,i)=>i%5===2&&i<22).map(s=>s.id),status:"active"},
  {id:"g4",name:"Junior A1",level:"Beginner",teacherId:undefined,bookId:"b2",periodId:"ap1",capacity:10,studentIds:adminStudents.filter((_,i)=>i%5===3&&i<22).map(s=>s.id),status:"active"},
  {id:"g5",name:"Speaking A2",level:"Elementary",teacherId:"t4",bookId:"b4",periodId:"ap1",capacity:8,studentIds:adminStudents.filter((_,i)=>i%5===4&&i<22).map(s=>s.id),status:"active"},
];
export const skillCategories: SkillCategory[] = [
  {id:"sk1",name:"Speaking",description:"Устная речь",maxScore:10,color:"#ef233c",status:"active"},
  {id:"sk2",name:"Listening",description:"Аудирование",maxScore:10,color:"#f59e0b",status:"active"},
  {id:"sk3",name:"Reading",description:"Чтение",maxScore:10,color:"#2563eb",status:"active"},
  {id:"sk4",name:"Writing",description:"Письмо",maxScore:10,color:"#16a34a",status:"active"},
  {id:"sk5",name:"Vocabulary",description:"Словарный запас",maxScore:10,color:"#7c3aed",status:"active"},
];
export const learningHistory: LearningHistoryEvent[] = [
  {id:"lh1",studentId:"s1",groupId:"g1",date:"28.07.2026",type:"Перевод",title:"Перевод в Kids Starter",details:"Из группы Junior Starter, администратор Марина"},
  {id:"lh2",studentId:"s1",groupId:"g1",date:"20.07.2026",type:"Тест",title:"Unit 2 Test · 82%",details:"Сильный словарный запас"},
  {id:"lh3",studentId:"s2",groupId:"g2",date:"18.07.2026",type:"Раздел",title:"Завершён Unit 3",details:"Пройдено 5 тем"},
  {id:"lh4",studentId:"s4",groupId:"g4",date:"12.07.2026",type:"Группа",title:"Назначена группа Junior A1",details:"Учебник Academy Stars 1"},
];
export const auditLog: AuditLogEntry[] = [
  {id:"a1",date:"01.08.2026 · 10:42",actor:"Марина Соколова",action:"Создание",entity:"Группа Kids Starter",details:"Создана новая учебная группа"},
  {id:"a2",date:"31.07.2026 · 16:20",actor:"Марина Соколова",action:"Изменение",entity:"Учитель Айгуль Сериковна",details:"Назначена группа Kids A1"},
  {id:"a3",date:"30.07.2026 · 12:04",actor:"Марина Соколова",action:"Архивирование",entity:"Ученик Арман Калиев",details:"Завершил обучение"},
  {id:"a4",date:"29.07.2026 · 09:15",actor:"Марина Соколова",action:"Перевод",entity:"Амина Серикова",details:"Junior Starter → Kids Starter"},
];
export const archivedEntities: ArchivedEntity[] = [
  {id:"ar1",sourceId:"s20",entityType:"Ученик",name:"Дамир Калиев",reason:"Завершил обучение",archivedAt:"30.07.2026"},
  {id:"ar2",sourceId:"g-old",entityType:"Группа",name:"Kids Pre-A1",reason:"Учебный период завершён",archivedAt:"31.05.2026"},
  {id:"ar3",sourceId:"b-old",entityType:"Учебник",name:"Welcome Starter",reason:"Заменён новой программой",archivedAt:"15.05.2026"},
];
