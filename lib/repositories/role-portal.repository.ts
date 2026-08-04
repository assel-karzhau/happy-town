import { prisma } from "../db/prisma";
import { AppError } from "../errors/app-error";
import type { ParentPortalData, RoleStudent, TeacherPortalData } from "../types/role-portal";

const name = (row: { firstName: string; lastName: string }) => `${row.firstName} ${row.lastName}`;
const initials = (row: { firstName: string; lastName: string }) => `${row.firstName[0] ?? ""}${row.lastName[0] ?? ""}`;

type StudentRow = Awaited<ReturnType<typeof loadStudents>>[number];

async function loadStudents(studentIds: string[]) {
  return prisma.student.findMany({
    where: { id: { in: studentIds }, archivedAt: null },
    select: {
      id: true, firstName: true, lastName: true, status: true, currentLevel: true, dateOfBirth: true,
      parentRelations: { where: { archivedAt: null }, select: { parent: { select: { firstName: true, lastName: true } } } },
      enrollments: {
        where: { status: "ACTIVE", endedAt: null }, take: 1, orderBy: { startedAt: "desc" },
        select: { group: { select: {
          id: true, name: true, book: { select: { name: true } },
          teacherAssignments: { where: { isCurrent: true, endedAt: null }, take: 1, select: { teacher: { select: { firstName: true, lastName: true, status: true, archivedAt: true } } } },
        } } },
      },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
}

function studentDto(row: StudentRow): RoleStudent {
  const enrollment = row.enrollments[0];
  const teacher = enrollment?.group.teacherAssignments[0]?.teacher;
  return {
    id: row.id, name: name(row), initials: initials(row), status: row.status,
    level: row.currentLevel ?? "—", dateOfBirth: row.dateOfBirth?.toISOString().slice(0, 10) ?? null,
    groupId: enrollment?.group.id ?? null, groupName: enrollment?.group.name ?? null,
    teacherName: teacher?.status === "ACTIVE" && !teacher.archivedAt ? name(teacher) : null,
    bookName: enrollment?.group.book.name ?? null,
    parentNames: row.parentRelations.map(({ parent }) => name(parent)),
  };
}

export async function getTeacherPortalData(userId: string): Promise<TeacherPortalData> {
  const profile = await prisma.teacherProfile.findFirst({
    where: { userId, user: { role: "TEACHER", status: "ACTIVE", archivedAt: null } },
    select: { user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } } },
  });
  if (!profile) throw new AppError("NOT_FOUND", "Профиль учителя не найден", 404);
  const assignments = await prisma.teacherGroupAssignment.findMany({
    where: { teacherId: profile.user.id, isCurrent: true, endedAt: null, group: { archivedAt: null, status: { in: ["RECRUITING", "ACTIVE"] } } },
    select: { group: { select: {
      id: true, name: true, level: true, status: true, capacity: true,
      book: { select: { name: true } }, academicPeriod: { select: { name: true } },
      enrollments: { where: { status: "ACTIVE", endedAt: null }, select: { studentId: true } },
    } } },
    orderBy: { startedAt: "desc" },
  });
  const studentRows = await loadStudents([...new Set(assignments.flatMap(({ group }) => group.enrollments.map(({ studentId }) => studentId)))]);
  const students = new Map(studentRows.map(row => [row.id, studentDto(row)]));
  return {
    kind: "teacher",
    teacher: { id: profile.user.id, name: name(profile.user), email: profile.user.email ?? "", phone: profile.user.phone ?? "" },
    groups: assignments.map(({ group }) => ({
      id: group.id, name: group.name, level: group.level, status: group.status,
      bookName: group.book.name, periodName: group.academicPeriod.name, capacity: group.capacity,
      students: group.enrollments.map(({ studentId }) => students.get(studentId)).filter((value): value is RoleStudent => Boolean(value)),
    })),
  };
}

export async function getParentPortalData(userId: string): Promise<ParentPortalData> {
  const profile = await prisma.parentProfile.findFirst({
    where: { userId, user: { role: "PARENT", status: "ACTIVE", archivedAt: null } },
    select: { user: { select: {
      id: true, firstName: true, lastName: true, email: true, phone: true,
      parentRelations: { where: { archivedAt: null }, select: { studentId: true }, orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] },
    } } },
  });
  if (!profile) throw new AppError("NOT_FOUND", "Профиль родителя не найден", 404);
  const children = await loadStudents(profile.user.parentRelations.map(({ studentId }) => studentId));
  return {
    kind: "parent",
    parent: { id: profile.user.id, name: name(profile.user), email: profile.user.email ?? "", phone: profile.user.phone ?? "" },
    children: children.map(studentDto),
  };
}
