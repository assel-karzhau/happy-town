import type { AdminGroup, AdminStudent, ArchivedEntity, Parent, Teacher } from "../types";

export type AdminEntityKind = "parents" | "teachers" | "students" | "groups";
export type AdminCatalogKind = "books" | "units" | "skills";
export type AdminPerson = Parent | Teacher | AdminStudent;
export type AdminCatalogOption = { id: string; name: string; courseId?: string };
export type AdminCatalogData = {
  courses: Array<{id:string;name:string;description:string;level:string;status:string;bookCount:number}>;
  books: Array<{id:string;name:string;author:string;publisher:string;description:string;level:string;status:string;courseNames:string[];unitCount:number}>;
  units: Array<{id:string;bookId:string;name:string;description:string;bookName:string;status:string;topicCount:number}>;
  topics: Array<{id:string;name:string;description:string;unitName:string;status:string}>;
  skills: Array<{id:string;code:string;name:string;description:string;isActive:boolean;courseCount:number}>;
  history: Array<{id:string;eventDate:string;eventType:string;title:string;description:string;studentName:string;actorName:string}>;
};

export type AdminPortalData = {
  parents: Parent[];
  teachers: Teacher[];
  students: AdminStudent[];
  groups: AdminGroup[];
  archived: ArchivedEntity[];
  catalogs: { courses: AdminCatalogOption[]; books: AdminCatalogOption[]; periods: AdminCatalogOption[] };
  catalogData: AdminCatalogData;
};
