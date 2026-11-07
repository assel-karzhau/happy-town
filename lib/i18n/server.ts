import { cookies } from "next/headers";
import { parentMessage, type ParentMessage } from "./parent";
import type { Locale } from "./messages";
import { teacherMessage, type TeacherMessage } from "./teacher";

export async function getParentMessages() {
  const locale: Locale = (await cookies()).get("happy-town-locale")?.value === "en" ? "en" : "ru";
  return { locale, t: (key: ParentMessage) => parentMessage(locale, key) };
}

export async function getTeacherMessages() {
  const locale: Locale = (await cookies()).get("happy-town-locale")?.value === "en" ? "en" : "ru";
  return { locale, t: (key: TeacherMessage) => teacherMessage(locale, key) };
}
