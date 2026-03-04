import { MarathonEvent } from "./types";

/** 오늘 날짜 (YYYY-MM-DD) */
export function getToday(): string {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

/** 두 날짜 사이의 일수 차이 (target - today) */
export function daysUntil(target: string): number {
  const today = new Date(getToday());
  const t = new Date(target);
  return Math.ceil((t.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/** 특정 월의 이벤트 필터 */
export function getEventsForMonth(
  events: MarathonEvent[],
  year: number,
  month: number
): MarathonEvent[] {
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  return events.filter((e) => e.eventDate.startsWith(prefix));
}

/** 특정 날짜의 이벤트 필터 */
export function getEventsForDate(
  events: MarathonEvent[],
  date: string
): MarathonEvent[] {
  return events.filter((e) => e.eventDate === date);
}

/** 접수중이면서 마감 임박 순 정렬 */
export function getUpcomingDeadlines(events: MarathonEvent[]): MarathonEvent[] {
  const today = getToday();
  return events
    .filter(
      (e) =>
        e.registrationStatus === "접수중" &&
        e.registrationEnd &&
        e.registrationEnd >= today
    )
    .sort((a, b) => (a.registrationEnd! > b.registrationEnd! ? 1 : -1));
}

/** 곧 접수 시작하는 대회 (접수예정 중 시작일 가까운 순) */
export function getUpcomingRegistrations(
  events: MarathonEvent[]
): MarathonEvent[] {
  const today = getToday();
  return events
    .filter(
      (e) =>
        e.registrationStatus === "접수예정" &&
        e.registrationStart &&
        e.registrationStart > today
    )
    .sort((a, b) => (a.registrationStart! > b.registrationStart! ? 1 : -1));
}

/** 날짜 포맷 (MM.DD) */
export function formatShortDate(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  return `${m}.${d}`;
}

/** 요일 반환 */
export function getDayOfWeek(dateStr: string): string {
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return days[new Date(dateStr).getDay()];
}

/** 해당 월의 달력 데이터 생성 */
export function getCalendarDays(
  year: number,
  month: number
): (number | null)[][] {
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  const weeks: (number | null)[][] = [];
  let week: (number | null)[] = new Array(firstDay).fill(null);

  for (let day = 1; day <= daysInMonth; day++) {
    week.push(day);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }

  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  return weeks;
}
