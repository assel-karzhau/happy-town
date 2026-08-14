import { prisma } from "../db/prisma";
import { AppError } from "../errors/app-error";
import type { Prisma } from "../../generated/prisma/client";

const fullName=(row:{firstName:string;lastName:string})=>`${row.firstName} ${row.lastName}`;
const iso=(value:Date|null)=>value?.toISOString()??null;
const monthStart=()=>{const now=new Date();return new Date(now.getFullYear(),now.getMonth(),1)};

async function teacherIdentity(userId:string){
  const teacher=await prisma.user.findFirst({where:{id:userId,role:"TEACHER",status:"ACTIVE",archivedAt:null,teacherProfile:{isNot:null}},select:{id:true,firstName:true,lastName:true,phone:true,status:true,createdAt:true}});
  if(!teacher)throw new AppError("NOT_FOUND","Профиль учителя не найден",404);
  return teacher;
}

const assignmentWhere=(userId:string):Prisma.TeacherGroupAssignmentWhereInput=>({teacherId:userId,isCurrent:true,endedAt:null,group:{archivedAt:null,status:{in:["RECRUITING","ACTIVE"]}}});

export async function getTeacherDashboard(userId:string){
  const teacher=await teacherIdentity(userId);
  const assignments=await prisma.teacherGroupAssignment.findMany({where:assignmentWhere(userId),select:{groupId:true,group:{select:{id:true,name:true,level:true,status:true,capacity:true,book:{select:{name:true}},academicPeriod:{select:{name:true}},enrollments:{where:{status:"ACTIVE",endedAt:null},select:{studentId:true}},lessons:{where:{archivedAt:null},orderBy:{lessonDate:"desc"},take:1,select:{lessonDate:true,topic:{select:{name:true}}}}}}}});
  const groupIds=assignments.map(row=>row.groupId),studentIds=[...new Set(assignments.flatMap(row=>row.group.enrollments.map(item=>item.studentId)))];
  const [lessons,homeworkToCheck,tests,assessmentsDraft,reviewsDraft,recentActions]=await Promise.all([
    prisma.lesson.findMany({where:{teacherId:userId,groupId:{in:groupIds},lessonDate:{gte:monthStart()},archivedAt:null},select:{id:true,groupId:true,attendance:{select:{studentId:true}}}}),
    prisma.studentHomeworkStatus.count({where:{studentId:{in:studentIds},status:{not:"CHECKED"},homework:{groupId:{in:groupIds},archivedAt:null}}}),
    prisma.test.findMany({where:{groupId:{in:groupIds},archivedAt:null,status:{not:"ARCHIVED"}},select:{id:true,groupId:true,results:{select:{studentId:true}}}}),
    prisma.monthlyAssessment.count({where:{teacherId:userId,groupId:{in:groupIds},status:"DRAFT"}}),
    prisma.teacherReview.count({where:{teacherId:userId,groupId:{in:groupIds},status:"DRAFT",archivedAt:null}}),
    prisma.auditLog.findMany({where:{actorUserId:userId},orderBy:{createdAt:"desc"},take:6,select:{id:true,action:true,entityType:true,createdAt:true}}),
  ]);
  const enrollmentsByGroup=new Map(assignments.map(row=>[row.groupId,row.group.enrollments.length]));
  return {teacher:{name:fullName(teacher)},stats:{groups:groupIds.length,students:studentIds.length,lessonsThisMonth:lessons.length,attendanceMissing:lessons.filter(item=>item.attendance.length<(enrollmentsByGroup.get(item.groupId)??0)).length,homeworkToCheck,testsWithoutResults:tests.filter(item=>item.results.length<(enrollmentsByGroup.get(item.groupId)??0)).length,assessmentsDraft,reviewsDraft},groups:assignments.map(({group})=>({id:group.id,name:group.name,level:group.level,status:group.status,capacity:group.capacity,book:group.book.name,period:group.academicPeriod.name,studentCount:group.enrollments.length,lastLesson:iso(group.lessons[0]?.lessonDate??null),topic:group.lessons[0]?.topic.name??null})),recentActions:recentActions.map(item=>({...item,createdAt:item.createdAt.toISOString()}))};
}

export async function getTeacherGroups(userId:string){
  await teacherIdentity(userId);
  const rows=await prisma.teacherGroupAssignment.findMany({where:assignmentWhere(userId),orderBy:{group:{name:"asc"}},select:{group:{select:{id:true,name:true,level:true,status:true,capacity:true,startDate:true,endDate:true,book:{select:{name:true,units:{where:{archivedAt:null},orderBy:{order:"asc"},select:{id:true,name:true,topics:{where:{archivedAt:null},orderBy:{order:"asc"},select:{id:true,name:true}}}}}},academicPeriod:{select:{id:true,name:true}},enrollments:{where:{status:"ACTIVE",endedAt:null},select:{studentId:true}},lessons:{where:{archivedAt:null},orderBy:{lessonDate:"desc"},take:1,select:{lessonDate:true,unit:{select:{name:true}},topic:{select:{name:true}}}}}}}});
  return rows.map(({group})=>({id:group.id,name:group.name,level:group.level,status:group.status,capacity:group.capacity,book:group.book.name,period:group.academicPeriod.name,studentCount:group.enrollments.length,currentUnit:group.lessons[0]?.unit.name??group.book.units[0]?.name??null,currentTopic:group.lessons[0]?.topic.name??null,lastLesson:iso(group.lessons[0]?.lessonDate??null),progress:group.book.units.length?Math.min(100,Math.round((new Set(group.lessons.map?.(()=>"")??[]).size/group.book.units.length)*100)):0}));
}

export async function getTeacherGroup(userId:string,groupId:string){
  await teacherIdentity(userId);
  const assignment=await prisma.teacherGroupAssignment.findFirst({where:{...assignmentWhere(userId),groupId},select:{group:{select:{id:true,name:true,level:true,status:true,capacity:true,book:{select:{id:true,name:true}},academicPeriod:{select:{id:true,name:true}},enrollments:{where:{status:"ACTIVE",endedAt:null},select:{startedAt:true,student:{select:{id:true,firstName:true,lastName:true,currentLevel:true,status:true}}},orderBy:{student:{lastName:"asc"}}},lessons:{where:{archivedAt:null},orderBy:{lessonDate:"desc"},take:10,select:{id:true,title:true,lessonDate:true,status:true,unit:{select:{name:true}},topic:{select:{name:true}},attendance:{select:{status:true}},homeworks:{where:{archivedAt:null},select:{id:true,title:true}}}}}}}});
  if(!assignment)throw new AppError("NOT_FOUND","Группа не найдена",404);
  const group=assignment.group;return {...group,enrollments:group.enrollments.map(row=>({...row,startedAt:row.startedAt.toISOString(),student:{...row.student,name:fullName(row.student)}})),lessons:group.lessons.map(row=>({...row,lessonDate:row.lessonDate.toISOString()}))};
}

export async function getTeacherStudents(userId:string){
  await teacherIdentity(userId);
  const enrollments=await prisma.studentGroupEnrollment.findMany({
    where:{status:"ACTIVE",endedAt:null,group:{teacherAssignments:{some:{teacherId:userId,isCurrent:true,endedAt:null}},archivedAt:null}},
    orderBy:{student:{lastName:"asc"}},
    select:{
      group:{select:{id:true,name:true,book:{select:{name:true}}}},
      student:{select:{id:true,firstName:true,lastName:true,dateOfBirth:true,currentLevel:true,status:true,
        attendance:{where:{lesson:{lessonDate:{gte:monthStart()}}},select:{status:true}},
        testResults:{orderBy:{createdAt:"desc"},take:1,select:{score:true,maxScore:true}},
        homeworkStatuses:{orderBy:{updatedAt:"desc"},take:1,select:{status:true}},
        teacherReviews:{where:{teacherId:userId},orderBy:{createdAt:"desc"},take:1,select:{generalComment:true,status:true}},
      }},
    },
  });
  return enrollments.map(({group,student})=>{const attended=student.attendance.filter(row=>["PRESENT","LATE"].includes(row.status)).length;return {id:student.id,name:fullName(student),dateOfBirth:student.dateOfBirth?.toISOString().slice(0,10)??null,groupId:group.id,group:group.name,level:student.currentLevel??"—",book:group.book.name,status:student.status,attendancePercent:student.attendance.length?Math.round(attended/student.attendance.length*100):null,lastTest:student.testResults[0]?Math.round(Number(student.testResults[0].score)/Number(student.testResults[0].maxScore)*100):null,homeworkStatus:student.homeworkStatuses[0]?.status??null,lastReview:student.teacherReviews[0]?.generalComment??null};});
}

export async function getTeacherStudent(userId:string,studentId:string){
  const students=await getTeacherStudents(userId),summary=students.find(item=>item.id===studentId);if(!summary)throw new AppError("NOT_FOUND","Ученик не найден",404);
  const details=await prisma.student.findUniqueOrThrow({where:{id:studentId},select:{attendance:{orderBy:{lesson:{lessonDate:"desc"}},take:20,select:{status:true,comment:true,lesson:{select:{id:true,title:true,lessonDate:true,topic:{select:{name:true}}}}}},wordProgress:{orderBy:{updatedAt:"desc"},take:50,select:{status:true,word:{select:{english:true,translation:true,topic:{select:{name:true}}}}}},homeworkStatuses:{orderBy:{updatedAt:"desc"},take:20,select:{status:true,teacherComment:true,homework:{select:{id:true,title:true,dueDate:true}}}},testResults:{orderBy:{createdAt:"desc"},take:20,select:{score:true,maxScore:true,teacherComment:true,test:{select:{id:true,title:true,testDate:true}}}},monthlyAssessments:{where:{teacherId:userId},orderBy:[{year:"desc"},{month:"desc"}],select:{year:true,month:true,status:true,skillScores:{select:{score:true,skillCategory:{select:{name:true}}}}}},teacherReviews:{where:{teacherId:userId,archivedAt:null},orderBy:[{year:"desc"},{month:"desc"}],select:{year:true,month:true,status:true,achievements:true,improvements:true,recommendations:true,generalComment:true,progressLevel:true}},learningHistory:{orderBy:{eventDate:"desc"},take:30,select:{eventType:true,eventDate:true,title:true,description:true}}}});
  return {summary,details};
}

export async function getTeacherAttendance(userId:string){
  const groups=await getTeacherGroups(userId),groupIds=groups.map(item=>item.id);
  const lessons=await prisma.lesson.findMany({where:{groupId:{in:groupIds},archivedAt:null},orderBy:{lessonDate:"desc"},take:60,select:{id:true,title:true,lessonDate:true,status:true,group:{select:{id:true,name:true,enrollments:{where:{status:"ACTIVE",endedAt:null},select:{student:{select:{id:true,firstName:true,lastName:true}}}}}},attendance:{select:{studentId:true,status:true,comment:true}}}});
  return {groups,lessons:lessons.map(row=>({...row,lessonDate:row.lessonDate.toISOString(),group:{...row.group,enrollments:row.group.enrollments.map(item=>({student:{...item.student,name:fullName(item.student)}}))}}))};
}

export async function getTeacherLessons(userId:string){
  const groups=await getTeacherGroups(userId),groupIds=groups.map(item=>item.id);
  const lessons=await prisma.lesson.findMany({where:{teacherId:userId,groupId:{in:groupIds},archivedAt:null},orderBy:{lessonDate:"desc"},select:{id:true,title:true,lessonDate:true,lessonType:true,status:true,summary:true,studiedContent:true,grammar:true,parentComment:true,internalTeacherComment:true,group:{select:{id:true,name:true}},book:{select:{id:true,name:true}},unit:{select:{id:true,name:true}},topic:{select:{id:true,name:true}},words:{where:{archivedAt:null},select:{id:true,english:true,translation:true}},homeworks:{where:{archivedAt:null},select:{id:true,title:true}}}});
  return {groups,lessons:lessons.map(row=>({...row,lessonDate:row.lessonDate.toISOString()}))};
}

export async function getTeacherHomework(userId:string){
  const groups=await getTeacherGroups(userId),groupIds=groups.map(item=>item.id);
  const items=await prisma.homework.findMany({where:{groupId:{in:groupIds},archivedAt:null},orderBy:{createdAt:"desc"},select:{id:true,title:true,createdAt:true,dueDate:true,bookName:true,page:true,exercises:true,description:true,attachmentUrl:true,group:{select:{id:true,name:true}},lesson:{select:{topic:{select:{name:true}}}},studentStatuses:{select:{id:true,status:true,teacherComment:true,student:{select:{id:true,firstName:true,lastName:true}}}}}});
  return {groups,items:items.map(row=>({...row,createdAt:row.createdAt.toISOString(),dueDate:row.dueDate?.toISOString()??null,studentStatuses:row.studentStatuses.map(status=>({...status,student:{...status.student,name:fullName(status.student)}}))}))};
}

export async function getTeacherWords(userId:string){
  const groups=await getTeacherGroups(userId),groupIds=groups.map(item=>item.id);
  const items=await prisma.vocabularyWord.findMany({where:{archivedAt:null,OR:[{createdById:userId},{lesson:{groupId:{in:groupIds}}}]},orderBy:{createdAt:"desc"},select:{id:true,english:true,translation:true,example:true,learnedAt:true,topic:{select:{id:true,name:true,unit:{select:{id:true,name:true,book:{select:{id:true,name:true}}}}}},studentProgress:{select:{studentId:true,status:true}}}});
  return {groups,items:items.map(row=>({...row,learnedAt:row.learnedAt?.toISOString()??null}))};
}

export async function getTeacherTests(userId:string){
  const groups=await getTeacherGroups(userId),groupIds=groups.map(item=>item.id);
  const items=await prisma.test.findMany({where:{groupId:{in:groupIds},archivedAt:null},orderBy:{testDate:"desc"},select:{id:true,title:true,testDate:true,maxScore:true,status:true,group:{select:{id:true,name:true,enrollments:{where:{status:"ACTIVE",endedAt:null},select:{studentId:true}}}},unit:{select:{id:true,name:true}},results:{select:{id:true,studentId:true,score:true,maxScore:true,teacherComment:true,student:{select:{firstName:true,lastName:true}},skillScores:{select:{score:true,maxScore:true,skillCategory:{select:{name:true}}}}}}}});
  return {groups,items:items.map(row=>({...row,testDate:row.testDate.toISOString(),maxScore:Number(row.maxScore),results:row.results.map(result=>({...result,score:Number(result.score),maxScore:Number(result.maxScore),student:{...result.student,name:fullName(result.student)},skillScores:result.skillScores.map(score=>({...score,score:Number(score.score),maxScore:Number(score.maxScore)}))}))}))};
}

export async function getTeacherAssessments(userId:string){
  const groups=await prisma.group.findMany({where:{archivedAt:null,teacherAssignments:{some:{teacherId:userId,isCurrent:true,endedAt:null}}},orderBy:{name:"asc"},select:{id:true,name:true,academicPeriod:{select:{id:true,name:true}},course:{select:{skillCategories:{orderBy:{order:"asc"},where:{skillCategory:{isActive:true,archivedAt:null}},select:{skillCategory:{select:{id:true,name:true}}}}}},enrollments:{where:{status:"ACTIVE",endedAt:null},orderBy:{student:{lastName:"asc"}},select:{student:{select:{id:true,firstName:true,lastName:true}}}}}});
  const groupIds=groups.map(item=>item.id),items=await prisma.monthlyAssessment.findMany({where:{teacherId:userId,groupId:{in:groupIds}},orderBy:[{year:"desc"},{month:"desc"}],select:{id:true,studentId:true,groupId:true,year:true,month:true,status:true,publishedAt:true,student:{select:{firstName:true,lastName:true}},group:{select:{name:true,academicPeriodId:true}},skillScores:{select:{skillCategoryId:true,score:true,teacherComment:true}}}});
  const mappedGroups=groups.map(group=>({id:group.id,name:group.name,academicPeriod:group.academicPeriod,skills:group.course.skillCategories.map(item=>item.skillCategory),students:group.enrollments.map(item=>({...item.student,name:fullName(item.student)}))}));
  return {groups:mappedGroups,skills:[...new Map(mappedGroups.flatMap(group=>group.skills).map(skill=>[skill.id,skill])).values()],items:items.map(row=>({...row,publishedAt:row.publishedAt?.toISOString()??null,student:{...row.student,name:fullName(row.student)}}))};
}

export async function getTeacherReviews(userId:string){
  const assessmentData=await getTeacherAssessments(userId),groups=assessmentData.groups,groupIds=groups.map(item=>item.id);
  const items=await prisma.teacherReview.findMany({where:{teacherId:userId,groupId:{in:groupIds},archivedAt:null},orderBy:[{year:"desc"},{month:"desc"}],select:{id:true,studentId:true,groupId:true,year:true,month:true,status:true,publishedAt:true,achievements:true,improvements:true,recommendations:true,generalComment:true,progressLevel:true,student:{select:{firstName:true,lastName:true}},group:{select:{name:true}}}});
  return {groups,items:items.map(row=>({...row,publishedAt:row.publishedAt?.toISOString()??null,student:{...row.student,name:fullName(row.student)}}))};
}

export async function getTeacherProfile(userId:string){
  const teacher=await teacherIdentity(userId),groups=await getTeacherGroups(userId);return {id:teacher.id,firstName:teacher.firstName,lastName:teacher.lastName,name:fullName(teacher),phone:teacher.phone??"",status:teacher.status,createdAt:teacher.createdAt.toISOString(),groups,studentCount:groups.reduce((sum,item)=>sum+item.studentCount,0)};
}
