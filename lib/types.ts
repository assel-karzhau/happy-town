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

