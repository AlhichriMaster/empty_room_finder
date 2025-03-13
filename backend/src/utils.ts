export function parseTime(timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

export function isTimeInRange(
  targetTime: string,
  startTime: string,
  endTime: string
): boolean {
  const target = parseTime(targetTime);
  const start = parseTime(startTime);
  const end = parseTime(endTime);
  return target >= start && target <= end;
}

export function getDayOfWeek(date: Date): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getDay()];
} 