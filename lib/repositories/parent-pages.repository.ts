import { prisma } from "../db/prisma";
import { AppError } from "../errors/app-error";
import { getAnalyticsPeriod, parsePeriodPreset } from "../analytics/period";
import { getStudentAttendanceTrend, getStudentLearningTimeline, getStudentMonthlyReport, getStudentProgressSummary, getStudentTestTrend, getStudentVocabularyTrend } from "../services/student-analytics.service";

const fullName=(row:{firstName:string;lastName:string})=>`${row.firstName} ${row.lastName}`;
const startOfMonth=()=>{const now=new Date();return new Date(now.getFullYear(),now.getMonth(),1)};

export async function getParentChildren(parentId:string){
  const parent=await prisma.user.findFirst({where:{id:parentId,role:"PARENT",status:"ACTIVE",archivedAt:null,parentProfile:{isNot:null}},select:{id:true,iin:true,firstName:true,lastName:true,phone:true,status:true,createdAt:true,parentRelations:{where:{archivedAt:null},orderBy:[{isPrimary:"desc"},{createdAt:"asc"}],select:{isPrimary:true,relationType:true,student:{select:{id:true,firstName:true,lastName:true,status:true,currentLevel:true,dateOfBirth:true,enrollments:{where:{status:"ACTIVE",endedAt:null},orderBy:{startedAt:"desc"},take:1,select:{group:{select:{id:true,name:true,level:true,book:{select:{id:true,name:true}},academicPeriod:{select:{id:true,name:true}},teacherAssignments:{where:{isCurrent:true,endedAt:null},take:1,select:{teacher:{select:{id:true,firstName:true,lastName:true}}}}}}}}}}}}}});
  if(!parent)throw new AppError("NOT_FOUND","Профиль родителя не найден",404);
  return {parent:{id:parent.id,firstName:parent.firstName,lastName:parent.lastName,name:fullName(parent),maskedIin:parent.iin?`********${parent.iin.slice(-4)}`:"Не указан",phone:parent.phone??"",status:parent.status,createdAt:parent.createdAt.toISOString()},children:parent.parentRelations.map(relation=>{const enrollment=relation.student.enrollments[0],teacher=enrollment?.group.teacherAssignments[0]?.teacher;return {id:relation.student.id,name:fullName(relation.student),status:relation.student.status,level:relation.student.currentLevel??"—",dateOfBirth:relation.student.dateOfBirth?.toISOString().slice(0,10)??null,isPrimary:relation.isPrimary,relationType:relation.relationType,group:enrollment?{id:enrollment.group.id,name:enrollment.group.name,level:enrollment.group.level,book:enrollment.group.book,period:enrollment.group.academicPeriod,teacher:teacher?{id:teacher.id,name:fullName(teacher)}:null}:null};})};
}

async function resolveChild(parentId:string,studentId?:string){
  const data=await getParentChildren(parentId),child=studentId?data.children.find(item=>item.id===studentId):data.children[0];
  if(studentId&&!child)throw new AppError("NOT_FOUND","Ребёнок не найден",404);
  return {parent:data.parent,children:data.children,child:child??null};
}

export async function getParentDashboard(parentId:string,studentId?:string){
  const base=await resolveChild(parentId,studentId);if(!base.child)return {...base,stats:null,recentLessons:[],lastReview:null};
  const id=base.child.id,groupId=base.child.group?.id;
  const [attendance,lessons,words,homework,lastTest,lastReview,assessments]=await Promise.all([
    prisma.attendance.findMany({where:{studentId:id,lesson:{lessonDate:{gte:startOfMonth()},groupId,status:"COMPLETED",archivedAt:null}},select:{status:true}}),
    prisma.lesson.findMany({where:{groupId,archivedAt:null,status:"COMPLETED"},orderBy:{lessonDate:"desc"},take:5,select:{id:true,title:true,lessonDate:true,topic:{select:{name:true}},unit:{select:{name:true}}}}),
    prisma.studentWordProgress.count({where:{studentId:id,status:{in:["MASTERED","CONFIDENT"]}}}),
    prisma.studentHomeworkStatus.findMany({where:{studentId:id,homework:{groupId,archivedAt:null}},select:{status:true}}),
    prisma.testResult.findFirst({where:{studentId:id,test:{groupId,archivedAt:null,status:"COMPLETED"}},orderBy:{test:{testDate:"desc"}},select:{score:true,maxScore:true,test:{select:{title:true,testDate:true}}}}),
    prisma.teacherReview.findFirst({where:{studentId:id,groupId,status:"PUBLISHED",archivedAt:null},orderBy:[{year:"desc"},{month:"desc"}],select:{id:true,year:true,month:true,generalComment:true,progressLevel:true,teacher:{select:{firstName:true,lastName:true}}}}),
    prisma.monthlyAssessment.findMany({where:{studentId:id,groupId,status:"PUBLISHED"},orderBy:[{year:"desc"},{month:"desc"}],take:1,select:{skillScores:{select:{score:true}}}}),
  ]);
  const countedAttendance=attendance.filter(item=>item.status!=="LESSON_CANCELLED"),attended=countedAttendance.filter(item=>["PRESENT","LATE"].includes(item.status)).length,completedHomework=homework.filter(item=>["COMPLETED","CHECKED"].includes(item.status)).length,scores=assessments[0]?.skillScores.map(item=>item.score)??[];
  return {...base,stats:{attendancePercent:countedAttendance.length?Math.round(attended/countedAttendance.length*100):null,lessonCount:lessons.length,masteredWords:words,homeworkCompleted:completedHomework,homeworkTotal:homework.length,lastTest:lastTest?{title:lastTest.test.title,date:lastTest.test.testDate.toISOString(),percent:Math.round(Number(lastTest.score)/Number(lastTest.maxScore)*100)}:null,progress:scores.length?Math.round(scores.reduce((a,b)=>a+b,0)/scores.length*10)/10:null},recentLessons:lessons.map(item=>({...item,lessonDate:item.lessonDate.toISOString()})),lastReview:lastReview?{...lastReview,teacher:{name:fullName(lastReview.teacher)}}:null};
}

export async function getParentChildTopics(parentId:string,studentId?:string){const base=await resolveChild(parentId,studentId);const groupId=base.child?.group?.id;const lessons=groupId?await prisma.lesson.findMany({where:{groupId,archivedAt:null,status:"COMPLETED"},orderBy:{lessonDate:"desc"},select:{id:true,lessonDate:true,title:true,studiedContent:true,grammar:true,parentComment:true,book:{select:{name:true}},unit:{select:{name:true}},topic:{select:{name:true}},words:{where:{archivedAt:null},select:{english:true,translation:true}},homeworks:{where:{archivedAt:null},select:{title:true,description:true}}}}):[];return {...base,lessons:lessons.map(item=>({...item,lessonDate:item.lessonDate.toISOString()}))};}

export async function getParentChildWords(parentId:string,studentId?:string){const base=await resolveChild(parentId,studentId);if(!base.child)return {...base,words:[]};const words=await prisma.studentWordProgress.findMany({where:{studentId:base.child.id,word:{archivedAt:null}},orderBy:{updatedAt:"desc"},select:{status:true,assessedAt:true,teacherComment:true,word:{select:{id:true,english:true,translation:true,example:true,learnedAt:true,topic:{select:{name:true,unit:{select:{name:true}}}}}}}});return {...base,words:words.map(item=>({...item,assessedAt:item.assessedAt?.toISOString()??null,word:{...item.word,learnedAt:item.word.learnedAt?.toISOString()??null}}))};}

export async function getParentChildHomework(parentId:string,studentId?:string){const base=await resolveChild(parentId,studentId);if(!base.child)return {...base,items:[]};const items=await prisma.studentHomeworkStatus.findMany({where:{studentId:base.child.id,homework:{archivedAt:null}},orderBy:{homework:{createdAt:"desc"}},select:{status:true,teacherComment:true,homework:{select:{id:true,title:true,createdAt:true,dueDate:true,bookName:true,page:true,exercises:true,description:true,attachmentUrl:true,lesson:{select:{topic:{select:{name:true}}}}}}}});return {...base,items:items.map(item=>({...item,homework:{...item.homework,createdAt:item.homework.createdAt.toISOString(),dueDate:item.homework.dueDate?.toISOString()??null}}))};}

export async function getParentChildAttendance(parentId:string,studentId?:string){const base=await resolveChild(parentId,studentId);if(!base.child)return {...base,items:[]};const items=await prisma.attendance.findMany({where:{studentId:base.child.id},orderBy:{lesson:{lessonDate:"desc"}},select:{status:true,comment:true,lesson:{select:{id:true,title:true,lessonDate:true,topic:{select:{name:true}}}}}});return {...base,items:items.map(item=>({...item,lesson:{...item.lesson,lessonDate:item.lesson.lessonDate.toISOString()}}))};}

export async function getParentChildTests(parentId:string,studentId?:string){const base=await resolveChild(parentId,studentId);if(!base.child)return {...base,items:[]};const items=await prisma.testResult.findMany({where:{studentId:base.child.id,test:{archivedAt:null}},orderBy:{test:{testDate:"desc"}},select:{score:true,maxScore:true,teacherComment:true,test:{select:{id:true,title:true,testDate:true,unit:{select:{name:true}}}},skillScores:{select:{score:true,maxScore:true,skillCategory:{select:{name:true}}}}}});return {...base,items:items.map(item=>({...item,score:Number(item.score),maxScore:Number(item.maxScore),test:{...item.test,testDate:item.test.testDate.toISOString()},skillScores:item.skillScores.map(score=>({...score,score:Number(score.score),maxScore:Number(score.maxScore)}))}))};}

export async function getParentChildProgress(parentId:string,studentId?:string){const base=await resolveChild(parentId,studentId);if(!base.child)return {...base,assessments:[],tests:[],attendance:[],words:[]};const id=base.child.id;const [assessments,tests,attendance,words]=await Promise.all([prisma.monthlyAssessment.findMany({where:{studentId:id,status:"PUBLISHED"},orderBy:[{year:"asc"},{month:"asc"}],select:{year:true,month:true,skillScores:{select:{score:true,skillCategory:{select:{name:true}}}}}}),prisma.testResult.findMany({where:{studentId:id},orderBy:{test:{testDate:"asc"}},select:{score:true,maxScore:true,test:{select:{title:true,testDate:true}}}}),prisma.attendance.findMany({where:{studentId:id},select:{status:true,lesson:{select:{lessonDate:true}}}}),prisma.studentWordProgress.findMany({where:{studentId:id,status:{in:["MASTERED","CONFIDENT"]}},select:{updatedAt:true}})]);return {...base,assessments,tests:tests.map(item=>({...item,score:Number(item.score),maxScore:Number(item.maxScore),test:{...item.test,testDate:item.test.testDate.toISOString()}})),attendance:attendance.map(item=>({...item,lesson:{lessonDate:item.lesson.lessonDate.toISOString()}})),words:words.map(item=>({updatedAt:item.updatedAt.toISOString()}))};}

export async function getParentChildReviews(parentId:string,studentId?:string){const base=await resolveChild(parentId,studentId);if(!base.child)return {...base,items:[]};const items=await prisma.teacherReview.findMany({where:{studentId:base.child.id,status:"PUBLISHED",publishedAt:{not:null},archivedAt:null},orderBy:[{year:"desc"},{month:"desc"}],select:{id:true,year:true,month:true,publishedAt:true,achievements:true,improvements:true,recommendations:true,generalComment:true,progressLevel:true,teacher:{select:{firstName:true,lastName:true}}}});return {...base,items:items.map(item=>({...item,publishedAt:item.publishedAt?.toISOString()??null,teacher:{name:fullName(item.teacher)}}))};}

export async function getParentChildHistory(parentId:string,studentId?:string){const base=await resolveChild(parentId,studentId);if(!base.child)return {...base,items:[]};const items=await prisma.learningHistoryEvent.findMany({where:{studentId:base.child.id},orderBy:{eventDate:"desc"},select:{id:true,eventType:true,eventDate:true,title:true,description:true,group:{select:{name:true}},teacher:{select:{firstName:true,lastName:true}},book:{select:{name:true}},unit:{select:{name:true}}}});return {...base,items:items.map(item=>({...item,eventDate:item.eventDate.toISOString(),teacher:item.teacher?{name:fullName(item.teacher)}:null}))};}

export async function getParentProfile(parentId:string){return getParentChildren(parentId);}

export async function getParentProgressAnalytics(parentId:string,studentId?:string,periodValue?:string){
  const base=await resolveChild(parentId,studentId),period=parsePeriodPreset(periodValue);
  if(!base.child)return {...base,period,analytics:null,report:null};
  const [analytics,report]=await Promise.all([getStudentProgressSummary(parentId,base.child.id,period),getStudentMonthlyReport(parentId,base.child.id,period)]);
  return {...base,period,analytics,report};
}

export async function getParentTestsAnalytics(parentId:string,studentId?:string,periodValue?:string){
  const base=await resolveChild(parentId,studentId),period=parsePeriodPreset(periodValue);
  return {...base,period,items:base.child?await getStudentTestTrend(parentId,base.child.id,period):[]};
}

export async function getParentAttendanceAnalytics(parentId:string,studentId?:string,periodValue?:string){
  const base=await resolveChild(parentId,studentId),period=parsePeriodPreset(periodValue);
  return {...base,period,analytics:base.child?await getStudentAttendanceTrend(parentId,base.child.id,period):null};
}

export async function getParentWordsAnalytics(parentId:string,studentId?:string,periodValue?:string,filters?:{book?:string;unit?:string;status?:string;q?:string}){
  const base=await resolveChild(parentId,studentId),period=parsePeriodPreset(periodValue);
  if(!base.child)return {...base,period,summary:null,words:[],filterOptions:{books:[],units:[]}};
  const analyticsPeriod=getAnalyticsPeriod(period),query=filters?.q?.trim();
  const where={studentId:base.child.id,word:{archivedAt:null,...(filters?.book?{topic:{unit:{bookId:filters.book}}}:{}),...(filters?.unit?{topic:{unitId:filters.unit}}:{}),...(query?{OR:[{english:{contains:query,mode:"insensitive" as const}},{translation:{contains:query,mode:"insensitive" as const}}]}:{})},...(filters?.status?{status:filters.status as "NEW"|"LEARNING"|"NEEDS_REVIEW"|"MASTERED"|"CONFIDENT"}:{})};
  const [summary,words,books,units]=await Promise.all([
    getStudentVocabularyTrend(parentId,base.child.id,period),
    prisma.studentWordProgress.findMany({where,orderBy:{updatedAt:"desc"},select:{status:true,assessedAt:true,teacherComment:true,word:{select:{id:true,english:true,translation:true,example:true,learnedAt:true,topic:{select:{name:true,unit:{select:{id:true,name:true,book:{select:{id:true,name:true}}}}}}}}}}),
    prisma.book.findMany({where:{units:{some:{topics:{some:{words:{some:{studentProgress:{some:{studentId:base.child.id}}}}}}}}},orderBy:{name:"asc"},select:{id:true,name:true}}),
    prisma.unit.findMany({where:{topics:{some:{words:{some:{studentProgress:{some:{studentId:base.child.id}}}}}}},orderBy:[{bookId:"asc"},{order:"asc"}],select:{id:true,name:true,bookId:true}}),
  ]);
  const filteredWords=words.filter(item=>{const value=item.assessedAt??item.word.learnedAt;return !value||(!analyticsPeriod.from||value>=analyticsPeriod.from)&&value<analyticsPeriod.to});
  return {...base,period,summary,words:filteredWords.map(item=>({...item,assessedAt:item.assessedAt?.toISOString()??null,word:{...item.word,learnedAt:item.word.learnedAt?.toISOString()??null}})),filterOptions:{books,units}};
}

export async function getParentReviewsAnalytics(parentId:string,studentId?:string,periodValue?:string){
  const base=await resolveChild(parentId,studentId),period=parsePeriodPreset(periodValue),range=getAnalyticsPeriod(period);
  if(!base.child)return {...base,period,items:[]};
  const rows=await prisma.teacherReview.findMany({where:{studentId:base.child.id,status:"PUBLISHED",publishedAt:{not:null},archivedAt:null},orderBy:[{year:"desc"},{month:"desc"}],select:{id:true,year:true,month:true,publishedAt:true,achievements:true,improvements:true,recommendations:true,generalComment:true,progressLevel:true,teacher:{select:{firstName:true,lastName:true}}}});
  return {...base,period,items:rows.filter(item=>{const value=new Date(Date.UTC(item.year,item.month-1,1));return(!range.from||value>=range.from)&&value<range.to}).map(item=>({...item,publishedAt:item.publishedAt?.toISOString()??null,teacher:{name:fullName(item.teacher)}}))};
}

export async function getParentHistoryAnalytics(parentId:string,studentId?:string,periodValue?:string){
  const base=await resolveChild(parentId,studentId),period=parsePeriodPreset(periodValue);
  return {...base,period,history:base.child?await getStudentLearningTimeline(parentId,base.child.id,period):null};
}
