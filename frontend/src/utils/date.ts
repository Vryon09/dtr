export function formatWorkingDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'Asia/Manila',
  }).format(date);
}

export function formatTime(isoString: string | null | undefined): string {
  if (!isoString) return '--:--';
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Manila',
  }).format(date);
}

export function getTodayFormatted(): string {
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Manila',
  }).format(new Date());
}

export function calculateElapsedSeconds(startTimeIso: string): number {
  const start = new Date(startTimeIso).getTime();
  const now = Date.now();
  const diff = Math.max(0, Math.floor((now - start) / 1000));
  return diff;
}

export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function toManilaDateString(date: Date | string = new Date()): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

export function getManilaTimeString(isoString: string | null | undefined): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Manila',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const hour = parts.find((p) => p.type === 'hour')?.value || '00';
  const minute = parts.find((p) => p.type === 'minute')?.value || '00';
  return `${hour}:${minute}`;
}

export function combineDateAndTimeManila(dateStr: string, timeStr: string): string {
  return `${dateStr}T${timeStr}:00+08:00`;
}

/**
 * Parses YYYY-MM-DD string into a Date object set at UTC midnight
 */
export function parseDateString(dateStr: string): Date {
  const cleanDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const [year, month, day] = cleanDate.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Returns the Monday Date (UTC midnight) for a given date or ISO string
 */
export function getMondayForDate(dateInput: Date | string): Date {
  const d = typeof dateInput === 'string' ? parseDateString(dateInput) : new Date(dateInput);
  const day = d.getUTCDay(); // 0 is Sunday, 1 is Monday...
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() + diff);
  return monday;
}

/**
 * Formats a short month/day date (e.g. "Mar 16")
 */
export function formatShortMonthDay(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

/**
 * Formats a date range for a week (e.g. "Mar 16 – Mar 22, 2026")
 */
export function formatWeekLabel(monday: Date, sunday: Date): string {
  const startMonth = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' }).format(monday);
  const endMonth = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' }).format(sunday);
  const startDay = monday.getUTCDate();
  const endDay = sunday.getUTCDate();
  const year = sunday.getUTCFullYear();

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} – ${endDay}, ${year}`;
  }
  return `${startMonth} ${startDay} – ${endMonth} ${endDay}, ${year}`;
}

/**
 * Returns ISO week number for a Monday date
 */
export function getISOWeekNumber(monday: Date): number {
  const target = new Date(monday.valueOf());
  const dayNr = (monday.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setUTCMonth(0, 1);
  if (target.getUTCDay() !== 4) {
    target.setUTCMonth(0, 1 + ((4 - target.getUTCDay() + 7) % 7));
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

import type { AttendanceRecord, WeeklyDayStat, WeeklySummary } from '../types/attendance';

/**
 * Builds a WeeklySummary structure for a given Monday
 */
export function buildWeeklySummary(monday: Date, records: AttendanceRecord[]): WeeklySummary {
  const currentMondayStr = toManilaDateString(getMondayForDate(toManilaDateString(new Date())));

  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);

  const startStr = monday.toISOString().split('T')[0];
  const endStr = sunday.toISOString().split('T')[0];
  const weekNumber = getISOWeekNumber(monday);
  const year = sunday.getUTCFullYear();
  const weekKey = `${year}-W${String(weekNumber).padStart(2, '0')}`;

  const days: WeeklyDayStat[] = [];
  const weekRecords: AttendanceRecord[] = [];
  let totalHours = 0;
  let shiftCount = 0;

  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(monday);
    dayDate.setUTCDate(monday.getUTCDate() + i);
    const dayDateStr = dayDate.toISOString().split('T')[0];

    // Find record for this day
    const rec = records.find((r) => {
      const rDateStr = toManilaDateString(r.workingDate);
      return rDateStr === dayDateStr;
    });

    const hours = rec && rec.renderedHours ? Number(rec.renderedHours) : 0;
    if (rec) {
      weekRecords.push(rec);
      if (hours > 0) {
        shiftCount += 1;
        totalHours += hours;
      }
    }

    days.push({
      dayName: DAY_NAMES[i],
      dateString: dayDateStr,
      formattedDate: formatShortMonthDay(dayDate),
      hours: Math.round(hours * 100) / 100,
      record: rec,
    });
  }

  return {
    weekKey,
    weekNumber,
    year,
    startDate: startStr,
    endDate: endStr,
    label: formatWeekLabel(monday, sunday),
    totalHours: Math.round(totalHours * 100) / 100,
    shiftCount,
    records: weekRecords,
    days,
    isCurrentWeek: startStr === currentMondayStr,
  };
}

/**
 * Groups all attendance records into an array of WeeklySummary, sorted descending
 */
export function groupRecordsByWeek(records: AttendanceRecord[]): WeeklySummary[] {
  const todayManila = toManilaDateString(new Date());
  const currentMonday = getMondayForDate(todayManila);
  const mondaysMap = new Map<string, Date>();

  // Ensure current week is always present
  const currentMondayStr = currentMonday.toISOString().split('T')[0];
  mondaysMap.set(currentMondayStr, currentMonday);

  // Add all Mondays from records
  for (const record of records) {
    const dateStr = toManilaDateString(record.workingDate);
    const monday = getMondayForDate(dateStr);
    const mStr = monday.toISOString().split('T')[0];
    if (!mondaysMap.has(mStr)) {
      mondaysMap.set(mStr, monday);
    }
  }

  // Sort Mondays descending
  const sortedMondays = Array.from(mondaysMap.values()).sort(
    (a, b) => b.getTime() - a.getTime()
  );

  return sortedMondays.map((monday) => buildWeeklySummary(monday, records));
}

