import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { hash } from "bcryptjs";

if (process.env.NODE_ENV === "production" && process.env.ALLOW_PRODUCTION_SEED !== "true") {
  throw new Error("Production seeding is disabled. Set ALLOW_PRODUCTION_SEED=true explicitly.");
}
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const date = (value: string) => new Date(`${value}T00:00:00.000Z`);
const requiredSeedValue = (name: string) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required for local seeding`);
  return value;
};

async function main() {
  const adminEmail = requiredSeedValue("SEED_ADMIN_EMAIL");
  const teacherEmail = requiredSeedValue("SEED_TEACHER_EMAIL");
  const parentEmail = requiredSeedValue("SEED_PARENT_EMAIL");
  const adminIin = requiredSeedValue("SEED_ADMIN_IIN");
  const teacherIin = requiredSeedValue("SEED_TEACHER_IIN");
  const parentIin = requiredSeedValue("SEED_PARENT_IIN");
  const adminPassword = requiredSeedValue("SEED_ADMIN_PASSWORD");
  const teacherPassword = requiredSeedValue("SEED_TEACHER_PASSWORD");
  const parentPassword = requiredSeedValue("SEED_PARENT_PASSWORD");
  if(![adminIin,teacherIin,parentIin].every(value=>/^\d{12}$/.test(value))||new Set([adminIin,teacherIin,parentIin]).size!==3) throw new Error("Seed IIN values must be unique 12-digit development identifiers");
  const [adminPasswordHash, teacherPasswordHash, parentPasswordHash] = await Promise.all([
    hash(adminPassword, 12),
    hash(teacherPassword, 12),
    hash(parentPassword, 12),
  ]);
  const adminId = id(1);
  await prisma.user.upsert({
    where: { id: adminId }, update: { iin:adminIin, email: adminEmail, passwordHash: adminPasswordHash, status: "ACTIVE", archivedAt: null },
    create: { id: adminId, iin:adminIin, email: adminEmail, firstName: "Amina", lastName: "Sarsenova", role: "ADMIN", passwordHash: adminPasswordHash },
  });

  const teacherIds = Array.from({ length: 4 }, (_, i) => id(10 + i));
  const teacherNames = [["Aigerim", "Nurlanova"], ["Dana", "Kim"], ["Madi", "Ospanov"], ["Elena", "Volkova"]];
  for (let i = 0; i < teacherIds.length; i++) {
    const [firstName, lastName] = teacherNames[i];
    const email = i === 0 ? teacherEmail : `teacher${i + 1}@happytown.local`;
    await prisma.user.upsert({ where: { id: teacherIds[i] }, update: i === 0 ? { iin:teacherIin, email, passwordHash: teacherPasswordHash, status: "ACTIVE", archivedAt: null } : {}, create: { id: teacherIds[i], iin:i===0?teacherIin:null, email, firstName, lastName, role: "TEACHER", passwordHash: i === 0 ? teacherPasswordHash : null, teacherProfile: { create: { bio: "English teacher", hiredAt: date(`202${2 + (i % 3)}-09-01`) } } } });
  }

  const parentIds = Array.from({ length: 18 }, (_, i) => id(100 + i));
  for (let i = 0; i < parentIds.length; i++) {
    const email = i === 0 ? parentEmail : null;
    await prisma.user.upsert({ where: { id: parentIds[i] }, update: i === 0 ? { iin:parentIin, email, passwordHash: parentPasswordHash, status: "ACTIVE", archivedAt: null } : {}, create: { id: parentIds[i], iin:i===0?parentIin:null, email, phone: `+7701000${String(i + 1).padStart(4, "0")}`, firstName: `Parent${i + 1}`, lastName: `Family${(i % 12) + 1}`, role: "PARENT", passwordHash: i === 0 ? parentPasswordHash : null, parentProfile: { create: { preferredContact: i % 2 ? "WhatsApp" : "Phone" } } } });
  }

  const studentIds = Array.from({ length: 24 }, (_, i) => id(200 + i));
  for (let i = 0; i < studentIds.length; i++) {
    await prisma.student.upsert({ where: { id: studentIds[i] }, update: {}, create: { id: studentIds[i], firstName: `Student${i + 1}`, lastName: `Family${(i % 12) + 1}`, dateOfBirth: date(`${2013 + (i % 5)}-${String((i % 9) + 1).padStart(2, "0")}-15`), startedAt: date("2025-09-01"), currentLevel: ["Starter", "A1", "A2"][i % 3] } });
    await prisma.parentStudentRelation.upsert({ where: { id: id(300 + i) }, update: {}, create: { id: id(300 + i), parentId: parentIds[i % parentIds.length], studentId: studentIds[i], relationType: i % 2 ? "FATHER" : "MOTHER", isPrimary: true } });
  }

  const courseIds = [id(400), id(401)];
  await prisma.course.upsert({ where: { id: courseIds[0] }, update: {}, create: { id: courseIds[0], name: "Happy English Junior", description: "Core English programme for children", level: "Starter-A1", ageFrom: 7, ageTo: 10, recommendedDurationMonths: 12 } });
  await prisma.course.upsert({ where: { id: courseIds[1] }, update: {}, create: { id: courseIds[1], name: "Happy English Plus", description: "English programme for pre-teens", level: "A1-A2", ageFrom: 10, ageTo: 14, recommendedDurationMonths: 12 } });
  const bookIds = [id(410), id(411)];
  for (let i = 0; i < 2; i++) {
    await prisma.book.upsert({ where: { id: bookIds[i] }, update: {}, create: { id: bookIds[i], name: i ? "Bright Ideas 2" : "Bright Ideas 1", author: "Oxford University Press", publisher: "OUP", level: i ? "A2" : "A1" } });
    await prisma.courseBook.upsert({ where: { id: id(420 + i) }, update: {}, create: { id: id(420 + i), courseId: courseIds[i], bookId: bookIds[i], isPrimary: true } });
  }

  const unitIds: string[] = [], topicIds: string[] = [];
  for (let b = 0; b < 2; b++) for (let u = 0; u < 3; u++) {
    const index = b * 3 + u, unitId = id(430 + index), topicId = id(450 + index);
    unitIds.push(unitId); topicIds.push(topicId);
    await prisma.unit.upsert({ where: { id: unitId }, update: {}, create: { id: unitId, bookId: bookIds[b], name: `Unit ${u + 1}`, description: ["Hello and introductions", "Family and friends", "School and hobbies"][u], order: u + 1 } });
    await prisma.topic.upsert({ where: { id: topicId }, update: {}, create: { id: topicId, unitId, name: ["Introductions", "People", "Daily life"][u], grammarGoals: "Present simple and question forms", vocabularyGoals: "Everyday high-frequency words", recommendedLessonCount: 4, order: 1 } });
  }

  const periodId = id(500);
  await prisma.academicPeriod.upsert({ where: { id: periodId }, update: { isCurrent: true, status: "CURRENT" }, create: { id: periodId, name: "2025-2026 Academic Year", type: "ACADEMIC_YEAR", startDate: date("2025-09-01"), endDate: date("2026-08-31"), status: "CURRENT", isCurrent: true } });
  const groupIds = Array.from({ length: 5 }, (_, i) => id(510 + i));
  for (let i = 0; i < groupIds.length; i++) {
    const courseIndex = i < 3 ? 0 : 1;
    await prisma.group.upsert({ where: { id: groupIds[i] }, update: {}, create: { id: groupIds[i], name: `HT-${["A1", "A2", "B1", "B2", "C1"][i]}`, level: courseIndex ? "A2" : "A1", courseId: courseIds[courseIndex], bookId: bookIds[courseIndex], academicPeriodId: periodId, capacity: 12, startDate: date("2025-09-01"), status: "ACTIVE" } });
    await prisma.teacherGroupAssignment.upsert({ where: { id: id(530 + i) }, update: {}, create: { id: id(530 + i), teacherId: teacherIds[i % teacherIds.length], groupId: groupIds[i], startedAt: date("2025-09-01"), isCurrent: true } });
  }
  for (let i = 0; i < studentIds.length; i++) await prisma.studentGroupEnrollment.upsert({ where: { id: id(600 + i) }, update: {}, create: { id: id(600 + i), studentId: studentIds[i], groupId: groupIds[i % groupIds.length], startedAt: date("2025-09-01"), status: "ACTIVE" } });

  const skillIds = Array.from({ length: 4 }, (_, i) => id(700 + i));
  const skillNames = [["speaking", "Speaking"], ["listening", "Listening"], ["reading", "Reading"], ["writing", "Writing"]];
  for (let i = 0; i < skillIds.length; i++) {
    await prisma.skillCategory.upsert({ where: { id: skillIds[i] }, update: {}, create: { id: skillIds[i], code: skillNames[i][0], name: skillNames[i][1], order: i + 1 } });
    for (let c = 0; c < 2; c++) await prisma.courseSkillCategory.upsert({ where: { id: id(720 + c * 4 + i) }, update: {}, create: { id: id(720 + c * 4 + i), courseId: courseIds[c], skillCategoryId: skillIds[i], order: i + 1 } });
  }

  for (let g = 0; g < groupIds.length; g++) {
    const bookIndex = g < 3 ? 0 : 1, unitOffset = bookIndex * 3;
    for (let l = 0; l < 2; l++) {
      const lessonId = id(800 + g * 2 + l);
      await prisma.lesson.upsert({ where: { id: lessonId }, update: {}, create: { id: lessonId, groupId: groupIds[g], bookId: bookIds[bookIndex], unitId: unitIds[unitOffset], topicId: topicIds[unitOffset], teacherId: teacherIds[g % 4], academicPeriodId: periodId, lessonDate: date(`2026-0${l + 2}-${String(g + 10).padStart(2, "0")}`), title: l ? "Practice and review" : "Vocabulary and speaking", studiedContent: "Course book and communicative exercises", parentComment: "Please revise the new vocabulary", status: "COMPLETED" } });
      const groupStudents = studentIds.filter((_, i) => i % 5 === g);
      for (let s = 0; s < groupStudents.length; s++) await prisma.attendance.upsert({ where: { lessonId_studentId: { lessonId, studentId: groupStudents[s] } }, update: {}, create: { lessonId, studentId: groupStudents[s], status: s % 6 === 0 ? "LATE" : "PRESENT", markedById: teacherIds[g % 4] } });
    }
    const homeworkId = id(850 + g), lessonId = id(800 + g * 2 + 1);
    await prisma.homework.upsert({ where: { id: homeworkId }, update: {}, create: { id: homeworkId, lessonId, groupId: groupIds[g], title: "Vocabulary revision", bookId: bookIds[bookIndex], page: "12-13", exercises: "1-4", description: "Learn the words and complete the exercises", dueDate: date("2026-03-20"), createdById: teacherIds[g % 4] } });
    for (const studentId of studentIds.filter((_, i) => i % 5 === g)) await prisma.studentHomeworkStatus.upsert({ where: { homeworkId_studentId: { homeworkId, studentId } }, update: {}, create: { homeworkId, studentId, status: "COMPLETED", checkedAt: date("2026-03-21"), checkedById: teacherIds[g % 4] } });
  }

  for (let i = 0; i < 8; i++) {
    const wordId = id(900 + i), topicId = topicIds[i % topicIds.length];
    await prisma.vocabularyWord.upsert({ where: { id: wordId }, update: {}, create: { id: wordId, topicId, english: ["hello", "friend", "family", "school", "teacher", "book", "hobby", "happy"][i], translation: ["привет", "друг", "семья", "школа", "учитель", "книга", "увлечение", "счастливый"][i], createdById: teacherIds[i % 4] } });
    for (const studentId of studentIds.slice(0, 8)) await prisma.studentWordProgress.upsert({ where: { studentId_wordId: { studentId, wordId } }, update: {}, create: { studentId, wordId, status: i % 3 === 0 ? "MASTERED" : "LEARNING", assessedAt: date("2026-03-15"), assessedById: teacherIds[i % 4] } });
  }

  for (let g = 0; g < 2; g++) {
    const testId = id(950 + g), teacherId = teacherIds[g], groupStudents = studentIds.filter((_, i) => i % 5 === g);
    await prisma.test.upsert({ where: { id: testId }, update: {}, create: { id: testId, groupId: groupIds[g], unitId: unitIds[0], title: "Unit 1 Check", testDate: date("2026-03-25"), maxScore: "40", status: "COMPLETED", createdById: teacherId } });
    for (let s = 0; s < groupStudents.length; s++) {
      const resultId = id(970 + g * 10 + s), score = 28 + (s % 10);
      await prisma.testResult.upsert({ where: { id: resultId }, update: {}, create: { id: resultId, testId, studentId: groupStudents[s], score: String(score), maxScore: "40", teacherComment: "Steady progress", assessedById: teacherId } });
      for (let k = 0; k < skillIds.length; k++) await prisma.testResultSkillScore.upsert({ where: { testResultId_skillCategoryId: { testResultId: resultId, skillCategoryId: skillIds[k] } }, update: {}, create: { testResultId: resultId, skillCategoryId: skillIds[k], score: String(7 + ((s + k) % 3)), maxScore: "10" } });
    }
  }

  for (let i = 0; i < 8; i++) {
    const groupIndex = i % 5, teacherId = teacherIds[groupIndex % 4], assessmentId = id(1100 + i);
    await prisma.monthlyAssessment.upsert({ where: { id: assessmentId }, update: {}, create: { id: assessmentId, studentId: studentIds[i], groupId: groupIds[groupIndex], teacherId, academicPeriodId: periodId, year: 2026, month: 3, status: "PUBLISHED", publishedAt: date("2026-03-31") } });
    for (let k = 0; k < skillIds.length; k++) await prisma.monthlySkillScore.upsert({ where: { assessmentId_skillCategoryId: { assessmentId, skillCategoryId: skillIds[k] } }, update: {}, create: { assessmentId, skillCategoryId: skillIds[k], score: 7 + ((i + k) % 3), teacherComment: "Good monthly progress" } });
    await prisma.teacherReview.upsert({ where: { id: id(1200 + i) }, update: {}, create: { id: id(1200 + i), studentId: studentIds[i], groupId: groupIds[groupIndex], teacherId, academicPeriodId: periodId, year: 2026, month: 3, achievements: "More confident in class", improvements: "Review spelling", recommendations: "Read aloud for ten minutes daily", generalComment: "Positive progress", progressLevel: "STABLE", status: "PUBLISHED", publishedAt: date("2026-03-31") } });
    await prisma.learningHistoryEvent.upsert({ where: { id: id(1300 + i) }, update: {}, create: { id: id(1300 + i), studentId: studentIds[i], eventType: "GROUP_ENROLLED", eventDate: date("2025-09-01"), actorUserId: adminId, groupId: groupIds[groupIndex], teacherId, bookId: bookIds[groupIndex < 3 ? 0 : 1], title: "Student enrolled", newData: { source: "seed" } } });
  }
  await prisma.auditLog.upsert({ where: { id: id(1400) }, update: {}, create: { id: id(1400), actorUserId: adminId, action: "CREATE", entityType: "SeedDataset", entityId: "happy-town-demo", metadata: { version: 1, idempotent: true } } });
  console.log("Happy Town seed complete: 1 admin, 4 teachers, 18 parents, 24 students, 5 groups.");
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
