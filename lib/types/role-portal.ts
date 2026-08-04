export type RoleStudent = {
  id: string;
  name: string;
  initials: string;
  status: string;
  level: string;
  dateOfBirth: string | null;
  groupId: string | null;
  groupName: string | null;
  teacherName: string | null;
  bookName: string | null;
  parentNames: string[];
};

export type TeacherPortalData = {
  kind: "teacher";
  teacher: { id: string; name: string; email: string; phone: string };
  groups: Array<{
    id: string;
    name: string;
    level: string;
    status: string;
    bookName: string;
    periodName: string;
    capacity: number;
    students: RoleStudent[];
  }>;
};

export type ParentPortalData = {
  kind: "parent";
  parent: { id: string; name: string; email: string; phone: string };
  children: RoleStudent[];
};

export type RolePortalData = TeacherPortalData | ParentPortalData;
