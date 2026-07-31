import type { Lesson, Role, Student } from "./types";

export const currentStudent: Student = {
  id: 1,
  name: "Амина Серикова",
  initials: "АС",
  group: "Kids Starter",
  level: "Starter",
  teacher: "Айгуль Сериковна",
  book: "Family and Friends 1",
};

export const secondStudent: Student = {
  id: 2,
  name: "Данияр Сериков",
  initials: "ДС",
  group: "Kids A1",
  level: "Beginner",
  teacher: "Максим Станиславов",
  book: "Academy Stars 1",
};

export const lessons: Lesson[] = [
  { id: 1, date: "15 мая 2025", title: "My Family", unit: "Unit 3", learned: "Члены семьи, he / she, This is…", grammar: "Possessive ’s", homework: "Workbook p.24", status: "Пройдено" },
  { id: 2, date: "8 мая 2025", title: "My Toys", unit: "Unit 2", learned: "Игрушки, цвета, have got", grammar: "Have got / has got", homework: "Workbook p.18", status: "Пройдено" },
  { id: 3, date: "1 мая 2025", title: "At School", unit: "Unit 2", learned: "Школьные предметы", grammar: "There is / There are", homework: "Workbook p.12", status: "Пройдено" },
  { id: 4, date: "24 апр 2025", title: "Hello!", unit: "Unit 1", learned: "Приветствия и знакомство", grammar: "I am / You are", homework: "Workbook p.6", status: "Пройдено" },
];

export const words = [
  ["family", "семья", "My Family", "Освоено"], ["mother", "мама", "My Family", "Уверенно использует"],
  ["brother", "брат", "My Family", "Изучает"], ["train", "поезд", "My Toys", "Нужно повторить"],
  ["pencil case", "пенал", "At School", "Освоено"], ["classroom", "класс", "At School", "Новое"],
];

export const tests = [
  ["Unit 2 Test", "Unit 2", "12 мая 2025", "41 / 50", "82%"],
  ["Unit 1 Test", "Unit 1", "28 апр 2025", "38 / 50", "76%"],
  ["Starter Test", "Starter", "10 апр 2025", "34 / 50", "68%"],
];

export const homework = [
  ["16 мая", "19 мая", "Family and Friends 1", "p. 24, ex. 2–3", "Выполнено"],
  ["14 мая", "16 мая", "Family and Friends 1", "p. 22, ex. 1", "Проверено"],
  ["9 мая", "12 мая", "Family and Friends 1", "p. 18, ex. 4", "Нужно повторить"],
];

export const groups = [
  ["Kids Starter", "Starter", "Family and Friends 1", "8 учеников", "Unit 3", "62%"],
  ["Kids A1", "Beginner", "Academy Stars 1", "7 учеников", "Unit 5", "74%"],
  ["Teens A2", "Elementary", "Solutions A2", "9 учеников", "Unit 4", "51%"],
];

export const adminEntities: Record<string, string[][]> = {
  teachers: [["Айгуль Сериковна", "3 группы", "24 ученика", "Активен"], ["Максим Станиславов", "2 группы", "16 учеников", "Активен"], ["Елена Викторовна", "2 группы", "14 учеников", "В отпуске"]],
  parents: [["Мама Амины", "+7 701 524 1191", "2 ребёнка", "Активен"], ["Динара Омарова", "+7 702 118 0042", "1 ребёнок", "Активен"]],
  students: [["Амина Серикова", "Kids Starter", "Starter", "Активен"], ["Данияр Сериков", "Kids A1", "Beginner", "Активен"], ["Мария Ли", "Teens A2", "Elementary", "Активен"]],
  groups,
  courses: [["Kids English", "6 уровней", "12 групп", "Активен"], ["Teen English", "4 уровня", "5 групп", "Активен"]],
  books: [["Family and Friends 1", "Starter", "Oxford", "8 разделов"], ["Academy Stars 1", "Beginner", "Macmillan", "10 разделов"]],
  units: [["Unit 1 · Hello!", "Family and Friends 1", "4 темы", "Активен"], ["Unit 2 · My World", "Family and Friends 1", "5 тем", "Активен"]],
  topics: [["My Family", "Unit 3", "15 мая 2025", "Опубликована"], ["My Toys", "Unit 2", "8 мая 2025", "Опубликована"]],
  periods: [["2025–2026", "1 сен 2025", "31 мая 2026", "Предстоящий"], ["2024–2025", "1 сен 2024", "31 мая 2025", "Активный"]],
  skills: [["Speaking", "Устная речь", "10 баллов", "Активна"], ["Listening", "Аудирование", "10 баллов", "Активна"], ["Grammar", "Грамматика", "10 баллов", "Активна"]],
  archive: [["Арман Калиев", "Ученик", "Kids Starter", "12 апр 2025"], ["Kids Pre-A1", "Группа", "Завершена", "31 мая 2024"]],
};

export const pageTitles: Record<Role, Record<string, string>> = {
  parent: { home: "Главная", lessons: "Темы и уроки", words: "Слова", homework: "Домашние задания", attendance: "Посещаемость", tests: "Тесты", progress: "Прогресс", feedback: "Отзывы учителя", history: "История обучения", profile: "Профиль" },
  teacher: { home: "Главная", groups: "Мои группы", group: "Kids Starter", attendance: "Посещаемость группы", lesson: "Добавить урок", homework: "Домашние задания", words: "Слова", tests: "Результаты тестов", grades: "Ежемесячные оценки", feedback: "Ежемесячный отзыв", history: "История ученика" },
  admin: { home: "Dashboard", teachers: "Учителя", parents: "Родители", students: "Ученики", groups: "Группы", courses: "Курсы", books: "Учебники", units: "Разделы", topics: "Темы", periods: "Учебные периоды", skills: "Категории навыков", archive: "Архив" },
};

export const attendanceDays = [
  ["5", "ok"], ["7", "ok"], ["9", "ok"], ["12", "ok"], ["14", "ok"], ["16", "ok"], ["19", "ok"], ["21", "ok"], ["23", "late"], ["26", "ok"], ["28", "absent"], ["30", "ok"],
];

export const progressData = [
  { month: "Дек", Speaking: 4, Listening: 3, Reading: 2, Writing: 1, Vocabulary: 2 },
  { month: "Янв", Speaking: 5, Listening: 4, Reading: 3, Writing: 1.5, Vocabulary: 3 },
  { month: "Фев", Speaking: 6.4, Listening: 5, Reading: 3.6, Writing: 2, Vocabulary: 3.8 },
  { month: "Мар", Speaking: 7.2, Listening: 5.6, Reading: 4, Writing: 2.3, Vocabulary: 4.2 },
  { month: "Апр", Speaking: 7.8, Listening: 6.1, Reading: 4.4, Writing: 2.5, Vocabulary: 4.5 },
  { month: "Май", Speaking: 8.3, Listening: 6.5, Reading: 4.8, Writing: 2.8, Vocabulary: 4.7 },
];
