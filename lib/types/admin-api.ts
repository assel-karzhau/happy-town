import type { AdminGroup, AdminStudent, ArchivedEntity, Parent, Teacher } from "../types";

export type AdminEntityKind = "parents" | "teachers" | "students" | "groups";
export type AdminPerson = Parent | Teacher | AdminStudent;
export type AdminCatalogOption = { id: string; name: string; courseId?: string };

export type AdminPortalData = {
  parents: Parent[];
  teachers: Teacher[];
  students: AdminStudent[];
  groups: AdminGroup[];
  archived: ArchivedEntity[];
  catalogs: { courses: AdminCatalogOption[]; books: AdminCatalogOption[]; periods: AdminCatalogOption[] };
};
