export type Role = "parent" | "teacher" | "admin";

export type StatusTone = "green" | "red" | "orange" | "blue" | "gray";

export interface Lesson {
  id: number;
  date: string;
  title: string;
  unit: string;
  learned: string;
  grammar: string;
  homework: string;
  status: string;
}

export interface Student {
  id: number;
  name: string;
  initials: string;
  group: string;
  level: string;
  teacher: string;
  book: string;
}

export interface NavItem {
  label: string;
  href: string;
  icon: string;
}

export type EntityStatus = "active" | "inactive" | "archived" | "draft" | "upcoming";

export interface AdminUser { id: string; name: string; phone: string; email: string; role: "ADMIN"; createdAt: string }
export interface Teacher { id: string; name: string; phone: string; email: string; maskedIin?: string; groupIds: string[]; status: EntityStatus }
export interface Parent { id: string; name: string; phone: string; email: string; maskedIin?: string; studentIds: string[]; status: EntityStatus }
export interface AdminStudent { id: string; name: string; birthDate: string; level: string; groupId?: string; parentIds: string[]; status: EntityStatus }
export interface ParentStudentRelation { id: string; parentId: string; studentId: string; relation: string }
export interface AdminGroup { id: string; name: string; level: string; teacherId?: string; bookId?: string; periodId: string; capacity: number; studentIds: string[]; status: EntityStatus }
export interface Course { id: string; name: string; level: string; description: string; status: EntityStatus }
export interface Book { id: string; title: string; courseId: string; publisher: string; unitIds: string[]; status: EntityStatus }
export interface Unit { id: string; bookId: string; title: string; order: number; topicIds: string[]; status: EntityStatus }
export interface Topic { id: string; unitId: string; title: string; order: number; status: EntityStatus }
export interface AcademicPeriod { id: string; name: string; startDate: string; endDate: string; status: EntityStatus }
export interface SkillCategory { id: string; name: string; description: string; maxScore: number; color: string; status: EntityStatus }
export interface LearningHistoryEvent { id: string; studentId: string; groupId?: string; date: string; type: string; title: string; details: string }
export interface AuditLogEntry { id: string; date: string; actor: string; action: string; entity: string; details: string }
export type ArchiveEntityKind = "parents"|"teachers"|"students"|"groups"|"courses"|"books"|"units"|"topics";
export interface ArchivedEntity { id: string; sourceId: string; entityType: string; name: string; reason: string; archivedAt: string; kind?:ArchiveEntityKind }
