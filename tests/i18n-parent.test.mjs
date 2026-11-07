import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

test("parent translations and lesson plurals cover both locales", () => {
  const output = execFileSync(process.execPath, ["--import", "tsx", "--input-type=module", "-e", `
    import { parentMessage, lessonCountLabel, parentHistoryTitle } from './lib/i18n/parent.ts';
    import { teacherMessage, studentCountLabel } from './lib/i18n/teacher.ts';
    import { apiErrorMessage } from './lib/i18n/api-errors.ts';
    import { adminMessage } from './lib/i18n/admin.ts';
    import { managementMessage, managementSystemLabel, countLabel } from './lib/i18n/admin-management.ts';
    console.log(JSON.stringify({
      en: parentMessage('en', 'Ребёнок'), ru: parentMessage('ru', 'Ребёнок'),
      ruForms: [1, 2, 5, 21].map(n => lessonCountLabel('ru', n)),
      enForms: [1, 2].map(n => lessonCountLabel('en', n)),
      teacher: teacherMessage('en', 'Добавить урок'),
      students: [1, 2, 5].map(n => studentCountLabel('ru', n)),
      ruError: apiErrorMessage('ru', {code:'FORBIDDEN', error:'Нет доступа'}, 'fallback'),
      enError: apiErrorMessage('en', {code:'FORBIDDEN', error:'Нет доступа'}, 'fallback'),
      unknownError: apiErrorMessage('en', {error:'Внутренний текст'}, 'fallback'),
      payment: adminMessage('en', 'Подтвердить оплату за уроки {period} для ученика «{name}»?', {period:'1–12', name:'Мария'}),
      archive: managementMessage('en', 'Запись «{name}» будет перемещена в архив. История и связи сохранятся.', {name:'Мария'}),
      forms: [1,2,5,21].map(n => countLabel('ru', n, ['ученик добавлен','ученика добавлены','учеников добавлено'], ['student','students'])),
      system: managementSystemLabel('en','Зачисления'), unknown: managementSystemLabel('en','Название пользователя'),
      history: parentHistoryTitle('en','GROUP_ENROLLED','Поступление в группу'),
      authored: parentHistoryTitle('en','CUSTOM','Авторский заголовок')
    }));
  `], { encoding: "utf8" });
  assert.deepEqual(JSON.parse(output), {
    en: "Child", ru: "Ребёнок",
    ruForms: ["занятие", "занятия", "занятий", "занятие"],
    enForms: ["lesson", "lessons"],
    teacher: "Add lesson", students: ["ученик", "ученика", "учеников"],
    ruError: "Нет доступа", enError: "You do not have permission to perform this action.", unknownError: "fallback",
    payment: "Confirm payment for lessons 1–12 for Мария?",
    archive: "The record “Мария” will be archived. Its history and links will be retained.",
    forms: ["ученик добавлен", "ученика добавлены", "учеников добавлено", "ученик добавлен"],
    system: "Enrolments", unknown: "Название пользователя",
    history: "Enrolled in group", authored: "Авторский заголовок",
  });
});
