type StudentSummarySource = {
  id: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  status: string;
  currentLevel: string | null;
  enrollments: Array<{ group: { id: string; name: string; level: string } }>;
  parentRelations: Array<{ isPrimary: boolean; parent: { id: string; firstName: string; lastName: string; phone: string | null } }>;
};

export function toStudentSummaryDto(student: StudentSummarySource) {
  const primaryParent = student.parentRelations.find((relation) => relation.isPrimary)?.parent ?? null;
  return {
    id: student.id,
    fullName: [student.lastName, student.firstName, student.middleName].filter(Boolean).join(" "),
    status: student.status,
    level: student.currentLevel,
    activeGroup: student.enrollments[0]?.group ?? null,
    primaryParent,
  };
}
