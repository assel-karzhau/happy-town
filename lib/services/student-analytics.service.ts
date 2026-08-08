import { prisma } from "../db/prisma";
import { AppError } from "../errors/app-error";
import { average, calculateAttendance, isMasteredWord, percentage } from "../analytics/calculations";
import { calendarMonthKey, dateRangeWhere, getAnalyticsPeriod, localDateBoundary, monthKey, monthLabel, monthWithinPeriod, type PeriodPreset } from "../analytics/period";

const fullName = (row: { firstName: string; lastName: string }) => `${row.firstName} ${row.lastName}`;
const historyLabels:Record<string,string>={STUDENT_CREATED:"Начало обучения",PARENT_LINKED:"Добавлена связь с родителем",PARENT_UNLINKED:"Изменена связь с родителем",GROUP_ENROLLED:"Поступление в группу",GROUP_TRANSFERRED:"Перевод в другую группу",GROUP_COMPLETED:"Завершение группы",TEACHER_CHANGED:"Смена преподавателя",BOOK_CHANGED:"Смена учебника",LEVEL_CHANGED:"Переход на новый уровень",UNIT_COMPLETED:"Завершение раздела",TEST_COMPLETED:"Важный тест завершён",REVIEW_PUBLISHED:"Опубликован ежемесячный отзыв",STUDENT_ARCHIVED:"Обучение приостановлено",STUDENT_RESTORED:"Обучение возобновлено"};

async function requireParentStudent(parentId: string, studentId: string) {
  const relation = await prisma.parentStudentRelation.findFirst({
    where: { parentId, studentId, archivedAt: null, parent: { role: "PARENT", status: "ACTIVE", archivedAt: null, parentProfile: { isNot: null } } },
    select: { student: { select: { id: true, firstName: true, lastName: true, currentLevel: true } } },
  });
  if (!relation) throw new AppError("NOT_FOUND", "Ребёнок не найден", 404);
  return { ...relation.student, name: fullName(relation.student) };
}

function groupMonthly<T extends { key: string }>(rows: T[]) {
  return [...new Set(rows.map(row => row.key))].sort();
}

export async function getStudentSkillTrend(parentId: string, studentId: string, preset: PeriodPreset) {
  await requireParentStudent(parentId, studentId);
  const period = getAnalyticsPeriod(preset);
  const assessments = await prisma.monthlyAssessment.findMany({
    where: { studentId, status: "PUBLISHED", publishedAt: { not: null } },
    orderBy: [{ year: "asc" }, { month: "asc" }],
    select: { year: true, month: true, skillScores: { orderBy: { skillCategory: { order: "asc" } }, select: { score: true, skillCategory: { select: { id: true, name: true } } } } },
  });
  const visibleAssessments = assessments.filter(item => monthWithinPeriod(item.year, item.month, period));
  const categories = new Map<string, string>();
  const points = visibleAssessments.map(item => {
    const values: Record<string, number> = {};
    for (const score of item.skillScores) { categories.set(score.skillCategory.id, score.skillCategory.name); values[score.skillCategory.id] = score.score; }
    return { key: monthKey(item.year, item.month), label: monthLabel(monthKey(item.year, item.month)), values };
  });
  const latest = points.at(-1), previous = points.at(-2);
  return {
    categories: [...categories].map(([id, name]) => ({ id, name })),
    points,
    current: [...categories].map(([id, name]) => ({ id, name, score: latest?.values[id] ?? null, change: latest?.values[id] != null && previous?.values[id] != null ? latest.values[id] - previous.values[id] : null })),
  };
}

export async function getStudentTestTrend(parentId: string, studentId: string, preset: PeriodPreset) {
  await requireParentStudent(parentId, studentId);
  const period = getAnalyticsPeriod(preset);
  const rows = await prisma.testResult.findMany({
    where: { studentId, test: { status: "COMPLETED", archivedAt: null, testDate: dateRangeWhere(period) } },
    orderBy: { test: { testDate: "asc" } },
    select: { score: true, maxScore: true, teacherComment: true, test: { select: { id: true, title: true, testDate: true, unit: { select: { name: true } } } }, skillScores: { select: { score: true, maxScore: true, skillCategory: { select: { name: true } } } } },
  });
  return rows.map(row => ({ id: row.test.id, title: row.test.title, unit: row.test.unit.name, date: row.test.testDate.toISOString(), score: Number(row.score), maxScore: Number(row.maxScore), percentage: percentage(Number(row.score), Number(row.maxScore)), teacherComment: row.teacherComment, skillScores: row.skillScores.map(item => ({ name: item.skillCategory.name, score: Number(item.score), maxScore: Number(item.maxScore), percentage: percentage(Number(item.score), Number(item.maxScore)) })) }));
}

export async function getStudentAttendanceTrend(parentId: string, studentId: string, preset: PeriodPreset) {
  await requireParentStudent(parentId, studentId);
  const period = getAnalyticsPeriod(preset);
  const rows = await prisma.attendance.findMany({
    where: { studentId, lesson: { status: "COMPLETED", archivedAt: null, lessonDate: dateRangeWhere(period) } },
    orderBy: { lesson: { lessonDate: "asc" } },
    select: { status: true, comment: true, lesson: { select: { id: true, title: true, lessonDate: true, topic: { select: { name: true } } } } },
  });
  const items = rows.map(row => ({ id: row.lesson.id, status: row.status, comment: row.comment, title: row.lesson.title, topic: row.lesson.topic.name, lessonDate: row.lesson.lessonDate }));
  const trend = groupMonthly(items.map(item => ({ ...item, key: calendarMonthKey(item.lessonDate) }))).map(key => {
    const summary = calculateAttendance(items.filter(item => calendarMonthKey(item.lessonDate) === key).map(item => ({ status: item.status, lessonDate: item.lessonDate })));
    return { key, label: monthLabel(key), ...summary };
  });
  return { summary: calculateAttendance(items.map(item => ({ status: item.status, lessonDate: item.lessonDate }))), trend, items: items.map(item => ({ ...item, lessonDate: item.lessonDate.toISOString() })) };
}

export async function getStudentVocabularyTrend(parentId: string, studentId: string, preset: PeriodPreset) {
  await requireParentStudent(parentId, studentId);
  const period = getAnalyticsPeriod(preset);
  const rows = await prisma.studentWordProgress.findMany({
    where: { studentId, word: { archivedAt: null } },
    select: { status: true, assessedAt: true, updatedAt: true },
  });
  const summary = { total: rows.length, mastered: 0, confident: 0, needsReview: 0, learning: 0 };
  for (const row of rows) {
    if (row.status === "MASTERED") summary.mastered++;
    if (row.status === "CONFIDENT") summary.confident++;
    if (row.status === "NEEDS_REVIEW") summary.needsReview++;
    if (row.status === "LEARNING") summary.learning++;
  }
  const mastered = rows.filter(row => isMasteredWord(row.status)).map(row => row.assessedAt ?? row.updatedAt).sort((a, b) => a.getTime() - b.getTime());
  const visible = mastered.filter(date => !period.from || date >= period.from).filter(date => date < period.to);
  const keys = [...new Set(visible.map(calendarMonthKey))].sort();
  const trend = keys.map(key => ({ key, label: monthLabel(key), count: mastered.filter(date => date < period.to && calendarMonthKey(date) <= key).length }));
  return { summary: { ...summary, masteredTotal: summary.mastered + summary.confident }, trend };
}

export async function getStudentProgressSummary(parentId: string, studentId: string, preset: PeriodPreset) {
  const student = await requireParentStudent(parentId, studentId);
  const [skills, tests, attendance, vocabulary] = await Promise.all([
    getStudentSkillTrend(parentId, studentId, preset),
    getStudentTestTrend(parentId, studentId, preset),
    getStudentAttendanceTrend(parentId, studentId, preset),
    getStudentVocabularyTrend(parentId, studentId, preset),
  ]);
  return { student, skills, tests, attendance, vocabulary, kpis: { skillAverage: average(skills.current.map(item => item.score).filter((value): value is number => value !== null)), testAverage: average(tests.map(item => item.percentage).filter((value): value is number => value !== null)), attendancePercent: attendance.summary.percent, masteredWords: vocabulary.summary.masteredTotal } };
}

export async function getStudentMonthlyReport(parentId: string, studentId: string, preset: PeriodPreset) {
  const student = await requireParentStudent(parentId, studentId);
  const period = getAnalyticsPeriod(preset);
  const latestCandidates = await prisma.monthlyAssessment.findMany({ where: { studentId, status: "PUBLISHED", publishedAt: { not: null } }, orderBy: [{ year: "desc" }, { month: "desc" }], take: 24, select: { year: true, month: true, groupId: true, group: { select: { name: true, bookId: true } }, teacher: { select: { firstName: true, lastName: true } }, skillScores: { orderBy: { skillCategory: { order: "asc" } }, select: { score: true, skillCategory: { select: { name: true } } } } } });
  const latest = latestCandidates.find(item => monthWithinPeriod(item.year, item.month, period));
  if (!latest) return null;
  const from = localDateBoundary(latest.year, latest.month - 1, 1);
  const to = localDateBoundary(latest.year, latest.month, 1);
  const [attendanceRows, lessons, words, homeworks, tests, review] = await Promise.all([
    prisma.attendance.findMany({ where: { studentId, lesson: { groupId: latest.groupId, status: "COMPLETED", archivedAt: null, lessonDate: { gte: from, lt: to } } }, select: { status: true, lesson: { select: { lessonDate: true } } } }),
    prisma.lesson.findMany({ where: { groupId: latest.groupId, status: "COMPLETED", archivedAt: null, lessonDate: { gte: from, lt: to } }, select: { topicId: true } }),
    prisma.studentWordProgress.findMany({ where: { studentId, word: { archivedAt: null, topic: { unit: { bookId: latest.group.bookId } }, OR: [{ learnedAt: { gte: from, lt: to } }, { lesson: { status: "COMPLETED", lessonDate: { gte: from, lt: to } } }] } }, select: { status: true } }),
    prisma.studentHomeworkStatus.findMany({ where: { studentId, homework: { groupId: latest.groupId, archivedAt: null, OR: [{ lesson: { status: "COMPLETED", lessonDate: { gte: from, lt: to } } }, { lessonId: null, dueDate: { gte: from, lt: to } }] } }, select: { status: true } }),
    prisma.testResult.findMany({ where: { studentId, test: { groupId: latest.groupId, status: "COMPLETED", archivedAt: null, testDate: { gte: from, lt: to } } }, select: { score: true, maxScore: true } }),
    prisma.teacherReview.findFirst({ where: { studentId, groupId: latest.groupId, year: latest.year, month: latest.month, status: "PUBLISHED", publishedAt: { not: null }, archivedAt: null }, select: { achievements: true, improvements: true, recommendations: true, generalComment: true, progressLevel: true } }),
  ]);
  const attendance = calculateAttendance(attendanceRows.map(row => ({ status: row.status, lessonDate: row.lesson.lessonDate })));
  const completedHomework = homeworks.filter(row => ["COMPLETED", "CHECKED"].includes(row.status)).length;
  return { student: student.name, group: latest.group.name, teacher: fullName(latest.teacher), year: latest.year, month: latest.month, attendance, lessons: lessons.length, topics: new Set(lessons.map(row => row.topicId)).size, newWords: words.length, masteredWords: words.filter(row => isMasteredWord(row.status)).length, homework: { completed: completedHomework, total: homeworks.length }, testAverage: average(tests.map(row => percentage(Number(row.score), Number(row.maxScore))).filter((value): value is number => value !== null)), skills: latest.skillScores.map(row => ({ name: row.skillCategory.name, score: row.score })), review };
}

export async function getStudentLearningTimeline(parentId: string, studentId: string, preset: PeriodPreset) {
  await requireParentStudent(parentId, studentId);
  const period = getAnalyticsPeriod(preset), range = dateRangeWhere(period);
  const [events, enrollments] = await Promise.all([
    prisma.learningHistoryEvent.findMany({ where: { studentId, eventDate: range }, orderBy: { eventDate: "desc" }, select: { id: true, eventType: true, eventDate: true, title: true, description: true, group: { select: { name: true } }, teacher: { select: { firstName: true, lastName: true } }, book: { select: { name: true } }, unit: { select: { name: true } } } }),
    prisma.studentGroupEnrollment.findMany({
      where: { studentId },
      orderBy: { startedAt: "asc" },
      select: {
        id: true, startedAt: true, endedAt: true, status: true,
        group: { select: {
          name: true, level: true, book: { select: { name: true } },
          teacherAssignments: { orderBy: { startedAt: "asc" }, select: { startedAt: true, endedAt: true, teacher: { select: { firstName: true, lastName: true } } } },
        } },
      },
    }),
  ]);
  return {
    events: events.map(item => ({ ...item, title:historyLabels[item.eventType]??item.title, eventDate: item.eventDate.toISOString(), teacher: item.teacher ? { name: fullName(item.teacher) } : null })),
    groups: enrollments.filter(item=>(!period.from||!item.endedAt||item.endedAt>=period.from)&&item.startedAt<period.to).map(item => ({ id: item.id, name: item.group.name, level: item.group.level, book: item.group.book.name, startedAt: item.startedAt.toISOString(), endedAt: item.endedAt?.toISOString() ?? null, status: item.status })),
    teachers: enrollments.filter(item=>(!period.from||!item.endedAt||item.endedAt>=period.from)&&item.startedAt<period.to).flatMap(item => item.group.teacherAssignments.filter(assignment=>(!period.from||!assignment.endedAt||assignment.endedAt>=period.from)&&assignment.startedAt<period.to).map(assignment => ({ name: fullName(assignment.teacher), group: item.group.name, startedAt: assignment.startedAt > item.startedAt ? assignment.startedAt.toISOString() : item.startedAt.toISOString(), endedAt: (assignment.endedAt && (!item.endedAt || assignment.endedAt < item.endedAt) ? assignment.endedAt : item.endedAt)?.toISOString() ?? null }))),
  };
}
