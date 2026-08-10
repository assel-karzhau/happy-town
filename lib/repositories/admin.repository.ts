import type { Prisma } from "../../generated/prisma/client";
import { prisma } from "../db/prisma";
import type { AdminPortalData, AdminEntityKind } from "../types/admin-api";
import type { AdminGroup, AdminStudent, ArchivedEntity, Parent, Teacher } from "../types";

const userSelect = {
  id:true,iin:true,email:true,phone:true,firstName:true,lastName:true,status:true,archivedAt:true,
  parentRelations:{where:{archivedAt:null},select:{studentId:true}},
  teacherAssignments:{where:{isCurrent:true,endedAt:null},select:{groupId:true}},
} as const;

const studentSelect = {
  id:true,firstName:true,lastName:true,dateOfBirth:true,currentLevel:true,status:true,archivedAt:true,
  parentRelations:{where:{archivedAt:null},select:{parentId:true}},
  enrollments:{where:{status:"ACTIVE" as const},take:1,select:{groupId:true}},
} as const;

const groupSelect = {
  id:true,name:true,level:true,bookId:true,academicPeriodId:true,capacity:true,status:true,archivedAt:true,
  teacherAssignments:{where:{isCurrent:true,endedAt:null},take:1,select:{teacherId:true}},
  enrollments:{where:{status:"ACTIVE" as const},select:{studentId:true}},
} as const;

const status = (value:string) => value.toLowerCase() as "active"|"inactive"|"archived"|"draft"|"upcoming";
const fullName = (row:{firstName:string;lastName:string}) => `${row.firstName} ${row.lastName}`;
const dateOnly = (value:Date|null) => value ? value.toISOString().slice(0,10) : "";
const maskedIin = (value:string|null) => value ? `********${value.slice(-4)}` : undefined;

const parentDto = (row: Prisma.UserGetPayload<{select:typeof userSelect}>): Parent => ({ id:row.id,name:fullName(row),phone:row.phone??"",email:row.email??"",maskedIin:maskedIin(row.iin),studentIds:row.parentRelations.map(item=>item.studentId),status:status(row.status) });
const teacherDto = (row: Prisma.UserGetPayload<{select:typeof userSelect}>): Teacher => ({ id:row.id,name:fullName(row),phone:row.phone??"",email:row.email??"",maskedIin:maskedIin(row.iin),groupIds:row.teacherAssignments.map(item=>item.groupId),status:status(row.status) });
const studentDto = (row: Prisma.StudentGetPayload<{select:typeof studentSelect}>): AdminStudent => ({ id:row.id,name:fullName(row),birthDate:dateOnly(row.dateOfBirth),level:row.currentLevel??"—",groupId:row.enrollments[0]?.groupId,parentIds:row.parentRelations.map(item=>item.parentId),status:status(row.status) });
const groupDto = (row: Prisma.GroupGetPayload<{select:typeof groupSelect}>): AdminGroup => ({ id:row.id,name:row.name,level:row.level,teacherId:row.teacherAssignments[0]?.teacherId,bookId:row.bookId,periodId:row.academicPeriodId,capacity:row.capacity,studentIds:row.enrollments.map(item=>item.studentId),status:status(row.status) });

export async function getAdminPortalData(): Promise<AdminPortalData> {
  const [parents,teachers,students,groups,courses,books,periods,archivedUsers,archivedStudents,archivedGroups,archivedCourses,archivedBooks,archivedUnits,archivedTopics,catalogCourses,catalogBooks,catalogUnits,catalogTopics,catalogSkills,history] = await Promise.all([
    prisma.user.findMany({where:{role:"PARENT",archivedAt:null},select:userSelect,orderBy:[{lastName:"asc"},{firstName:"asc"}]}),
    prisma.user.findMany({where:{role:"TEACHER",archivedAt:null},select:userSelect,orderBy:[{lastName:"asc"},{firstName:"asc"}]}),
    prisma.student.findMany({where:{archivedAt:null},select:studentSelect,orderBy:[{lastName:"asc"},{firstName:"asc"}]}),
    prisma.group.findMany({where:{archivedAt:null},select:groupSelect,orderBy:{name:"asc"}}),
    prisma.course.findMany({where:{archivedAt:null,status:"ACTIVE"},select:{id:true,name:true},orderBy:{name:"asc"}}),
    prisma.book.findMany({where:{archivedAt:null,status:"ACTIVE"},select:{id:true,name:true,courses:{select:{courseId:true}}},orderBy:{name:"asc"}}),
    prisma.academicPeriod.findMany({where:{archivedAt:null},select:{id:true,name:true},orderBy:{startDate:"desc"}}),
    prisma.user.findMany({where:{archivedAt:{not:null},role:{in:["PARENT","TEACHER"]}},select:{id:true,firstName:true,lastName:true,role:true,archivedAt:true}}),
    prisma.student.findMany({where:{archivedAt:{not:null}},select:{id:true,firstName:true,lastName:true,archivedAt:true}}),
    prisma.group.findMany({where:{archivedAt:{not:null}},select:{id:true,name:true,archivedAt:true}}),
    prisma.course.findMany({where:{archivedAt:{not:null}},select:{id:true,name:true,archivedAt:true}}),
    prisma.book.findMany({where:{archivedAt:{not:null}},select:{id:true,name:true,archivedAt:true}}),
    prisma.unit.findMany({where:{archivedAt:{not:null}},select:{id:true,name:true,archivedAt:true}}),
    prisma.topic.findMany({where:{archivedAt:{not:null}},select:{id:true,name:true,archivedAt:true}}),
    prisma.course.findMany({where:{archivedAt:null},select:{id:true,name:true,description:true,level:true,status:true,_count:{select:{books:true}}},orderBy:{name:"asc"}}),
    prisma.book.findMany({where:{archivedAt:null},select:{id:true,name:true,author:true,publisher:true,description:true,level:true,status:true,courses:{select:{course:{select:{name:true}}}},_count:{select:{units:true}}},orderBy:{name:"asc"}}),
    prisma.unit.findMany({where:{archivedAt:null},select:{id:true,bookId:true,name:true,description:true,status:true,book:{select:{name:true}},_count:{select:{topics:true}}},orderBy:[{book:{name:"asc"}},{order:"asc"}]}),
    prisma.topic.findMany({where:{archivedAt:null},select:{id:true,name:true,description:true,status:true,unit:{select:{name:true}}},orderBy:[{unit:{name:"asc"}},{order:"asc"}]}),
    prisma.skillCategory.findMany({where:{archivedAt:null},select:{id:true,code:true,name:true,description:true,isActive:true,_count:{select:{courseLinks:true}}},orderBy:{order:"asc"}}),
    prisma.learningHistoryEvent.findMany({take:100,select:{id:true,eventDate:true,eventType:true,title:true,description:true,student:{select:{firstName:true,lastName:true}},actor:{select:{firstName:true,lastName:true}}},orderBy:{eventDate:"desc"}}),
  ]);
  const archived: ArchivedEntity[] = [
    ...archivedUsers.map(row=>archiveDto(row.id,row.role==="PARENT"?"parents":"teachers",row.role==="PARENT"?"Родитель":"Учитель",fullName(row),row.archivedAt)),
    ...archivedStudents.map(row=>archiveDto(row.id,"students","Ученик",fullName(row),row.archivedAt)),
    ...archivedGroups.map(row=>archiveDto(row.id,"groups","Группа",row.name,row.archivedAt)),
    ...archivedCourses.map(row=>archiveDto(row.id,"courses","Курс",row.name,row.archivedAt)),
    ...archivedBooks.map(row=>archiveDto(row.id,"books","Учебник",row.name,row.archivedAt)),
    ...archivedUnits.map(row=>archiveDto(row.id,"units","Раздел",row.name,row.archivedAt)),
    ...archivedTopics.map(row=>archiveDto(row.id,"topics","Тема",row.name,row.archivedAt)),
  ].sort((a,b)=>b.archivedAt.localeCompare(a.archivedAt));
  return {
    parents:parents.map(parentDto),teachers:teachers.map(teacherDto),students:students.map(studentDto),groups:groups.map(groupDto),archived,
    catalogs:{courses,books:books.map(row=>({id:row.id,name:row.name,courseId:row.courses[0]?.courseId})),periods},
    catalogData:{
      courses:catalogCourses.map(row=>({id:row.id,name:row.name,description:row.description??"",level:row.level,status:status(row.status),bookCount:row._count.books})),
      books:catalogBooks.map(row=>({id:row.id,name:row.name,author:row.author??"",publisher:row.publisher??"",description:row.description??"",level:row.level,status:status(row.status),courseNames:row.courses.map(link=>link.course.name),unitCount:row._count.units})),
      units:catalogUnits.map(row=>({id:row.id,bookId:row.bookId,name:row.name,description:row.description??"",bookName:row.book.name,status:status(row.status),topicCount:row._count.topics})),
      topics:catalogTopics.map(row=>({id:row.id,name:row.name,description:row.description??"",unitName:row.unit.name,status:status(row.status)})),
      skills:catalogSkills.map(row=>({id:row.id,code:row.code,name:row.name,description:row.description??"",isActive:row.isActive,courseCount:row._count.courseLinks})),
      history:history.map(row=>({id:row.id,eventDate:row.eventDate.toISOString().slice(0,10),eventType:row.eventType,title:row.title,description:row.description??"",studentName:fullName(row.student),actorName:row.actor?fullName(row.actor):"Система"})),
    },
  };
}

function archiveDto(sourceId:string,kind:NonNullable<ArchivedEntity["kind"]>,entityType:string,name:string,archivedAt:Date|null):ArchivedEntity { return {id:`${entityType}:${sourceId}`,sourceId,kind,entityType,name,reason:"Архивировано администратором",archivedAt:dateOnly(archivedAt)}; }

export async function listAdminEntities(kind:AdminEntityKind, options:{query?:string;status?:"active"|"archived";sort?:"name"|"newest";page:number;pageSize:number}) {
  const {query="",status:filter="active",sort="newest",page,pageSize}=options;
  const archivedAt = filter==="archived" ? {not:null} : null;
  const skip=(page-1)*pageSize;
  if(kind==="parents"||kind==="teachers") {
    const role=kind==="parents"?"PARENT":"TEACHER";
    const where:Prisma.UserWhereInput={role,archivedAt,...(query?{OR:[{firstName:{contains:query,mode:"insensitive"}},{lastName:{contains:query,mode:"insensitive"}},{email:{contains:query,mode:"insensitive"}},{phone:{contains:query}}]}:{})};
    const [rows,total]=await Promise.all([prisma.user.findMany({where,select:userSelect,skip,take:pageSize,orderBy:sort==="name"?[{lastName:"asc"},{firstName:"asc"}]:[{createdAt:"desc"}]}),prisma.user.count({where})]);
    return {items:kind==="parents"?rows.map(parentDto):rows.map(teacherDto),total,page,pageSize};
  }
  if(kind==="students") {
    const where:Prisma.StudentWhereInput={archivedAt,...(query?{OR:[{firstName:{contains:query,mode:"insensitive"}},{lastName:{contains:query,mode:"insensitive"}},{currentLevel:{contains:query,mode:"insensitive"}}]}:{})};
    const [rows,total]=await Promise.all([prisma.student.findMany({where,select:studentSelect,skip,take:pageSize,orderBy:sort==="name"?[{lastName:"asc"},{firstName:"asc"}]:[{createdAt:"desc"}]}),prisma.student.count({where})]);
    return {items:rows.map(studentDto),total,page,pageSize};
  }
  const where:Prisma.GroupWhereInput={archivedAt,...(query?{name:{contains:query,mode:"insensitive"}}:{})};
  const [rows,total]=await Promise.all([prisma.group.findMany({where,select:groupSelect,skip,take:pageSize,orderBy:sort==="name"?{name:"asc"}:{createdAt:"desc"}}),prisma.group.count({where})]);
  return {items:rows.map(groupDto),total,page,pageSize};
}
