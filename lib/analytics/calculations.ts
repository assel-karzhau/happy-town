export type AttendanceLike = { status: string; lessonDate: Date };

// Cancelled lessons are deliberately excluded from the denominator.
export function calculateAttendance(items: AttendanceLike[]) {
  const counted = items.filter(item => item.status !== "LESSON_CANCELLED");
  const present = counted.filter(item => item.status === "PRESENT").length;
  const late = counted.filter(item => item.status === "LATE").length;
  const absent = counted.filter(item => item.status === "ABSENT").length;
  const excused = counted.filter(item => item.status === "EXCUSED").length;
  return {
    lessons: counted.length,
    present,
    late,
    absent,
    excused,
    attended: present + late,
    percent: counted.length ? Math.round(((present + late) / counted.length) * 1000) / 10 : null,
  };
}

export function percentage(score: number, maxScore: number) {
  return maxScore > 0 ? Math.round((score / maxScore) * 1000) / 10 : null;
}

export function average(values: number[], precision = 1) {
  if (!values.length) return null;
  const factor = 10 ** precision;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * factor) / factor;
}

export function isMasteredWord(status: string) {
  return status === "MASTERED" || status === "CONFIDENT";
}
