/**
 * 日付ユーティリティ関数
 * シフト管理で使用する日付操作を提供
 */

/**
 * シフト時間の設定
 */
export const SHIFT_TIMES = {
  day: { start: '09:00', end: '17:00', label: '日勤' },
  evening: { start: '17:00', end: '01:00', label: '準夜' },
  night: { start: '01:00', end: '09:00', label: '深夜' }
} as const;

/**
 * 週の開始曜日（0: 日曜日）
 */
export const WEEK_START_DAY = 0;

/**
 * 指定した日付を含む週の開始日（日曜日）を取得
 */
export function getWeekStartDate(date: Date): Date {
  const startDate = new Date(date);
  const dayOfWeek = startDate.getDay();
  const diff = dayOfWeek - WEEK_START_DAY;
  startDate.setDate(startDate.getDate() - diff);
  startDate.setHours(0, 0, 0, 0);
  return startDate;
}

/**
 * 指定した日付を含む週の終了日（土曜日）を取得
 */
export function getWeekEndDate(date: Date): Date {
  const startDate = getWeekStartDate(date);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  endDate.setHours(23, 59, 59, 999);
  return endDate;
}

/**
 * 週の全ての日付を配列で取得
 */
export function getWeekDates(weekStartDate: Date): Date[] {
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStartDate);
    date.setDate(weekStartDate.getDate() + i);
    dates.push(date);
  }
  return dates;
}

/**
 * 日付を YYYY-MM-DD 形式の文字列に変換
 */
export function formatDateToString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * YYYY-MM-DD 形式の文字列を Date オブジェクトに変換
 * 東京時間（JST）で日付を解釈
 */
export function parseStringToDate(dateString: string): Date {
  return new Date(dateString + 'T00:00:00+09:00');
}

/**
 * 日付を表示用の日本語フォーマットに変換
 */
export function formatDateForDisplay(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
  return `${month}/${day}(${dayOfWeek})`;
}

/**
 * 週番号を計算（年の最初の週を1とする）
 */
export function getWeekNumber(date: Date): number {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - startOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
}

/**
 * 週の範囲を表示用文字列に変換
 */
export function formatWeekRange(weekStartDate: Date): string {
  const startDate = new Date(weekStartDate);
  const endDate = new Date(weekStartDate);
  endDate.setDate(startDate.getDate() + 6);
  
  const startMonth = startDate.getMonth() + 1;
  const startDay = startDate.getDate();
  const endMonth = endDate.getMonth() + 1;
  const endDay = endDate.getDate();
  
  if (startMonth === endMonth) {
    return `${startMonth}月${startDay}日～${endDay}日`;
  } else {
    return `${startMonth}月${startDay}日～${endMonth}月${endDay}日`;
  }
}

/**
 * 指定した週数だけ前/後の週の開始日を取得
 */
export function addWeeks(weekStartDate: Date, weeks: number): Date {
  const newDate = new Date(weekStartDate);
  newDate.setDate(weekStartDate.getDate() + (weeks * 7));
  return getWeekStartDate(newDate);
}

/**
 * 今日の日付を取得（時刻は00:00:00）
 */
export function getToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/**
 * 今週の開始日を取得
 */
export function getCurrentWeekStart(): Date {
  return getWeekStartDate(getToday());
}

/**
 * 2つの日付が同じ日かチェック
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return formatDateToString(date1) === formatDateToString(date2);
}

/**
 * 指定した日付が今日かチェック
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, getToday());
}

/**
 * 指定した日付が過去かチェック
 */
export function isPast(date: Date): boolean {
  const today = getToday();
  return date < today;
}

/**
 * 指定した日付が未来かチェック
 */
export function isFuture(date: Date): boolean {
  const today = getToday();
  return date > today;
}

/**
 * シフトタイプの表示順序を定義
 */
export const SHIFT_ORDER: Array<'day' | 'evening' | 'night'> = ['day', 'evening', 'night'];

/**
 * シフトタイプから表示用の情報を取得
 */
export function getShiftInfo(shiftType: 'day' | 'evening' | 'night') {
  return SHIFT_TIMES[shiftType];
}

/**
 * 指定した月の最初の日を取得
 */
export function getMonthStart(date: Date): Date {
  const monthStart = new Date(date);
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  return monthStart;
}

/**
 * 指定した月の最後の日を取得
 */
export function getMonthEnd(date: Date): Date {
  const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  monthEnd.setHours(23, 59, 59, 999);
  return monthEnd;
}

/**
 * 指定した月数だけ前/後の月を取得
 */
export function addMonths(date: Date, months: number): Date {
  const newDate = new Date(date);
  newDate.setMonth(newDate.getMonth() + months);
  return newDate;
}

/**
 * 月の範囲を表示用文字列に変換
 */
export function formatMonthRange(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return `${year}年${month}月`;
} 