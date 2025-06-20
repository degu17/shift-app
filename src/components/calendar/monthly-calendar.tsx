'use client';

import { useMemo } from 'react';
import {
  formatDateToString,
  isToday,
  isPast,
  SHIFT_ORDER,
  getShiftInfo
} from '@/lib/utils/date-utils';
import type { WeeklyShift, ShiftAssignment } from '@/lib/types';

/**
 * 月次カレンダーのプロパティ
 */
interface MonthlyCalendarProps {
  month: Date; // 表示する月の任意の日付
  shiftsData: WeeklyShift[]; // その月に含まれるすべてのシフトデータ
  onDateClick?: (date: Date) => void;
  readOnly?: boolean;
}

/**
 * 月次カレンダーコンポーネント
 * 1ヶ月のシフト概要を表示
 */
export default function MonthlyCalendar({
  month,
  shiftsData,
  onDateClick,
  readOnly = false
}: MonthlyCalendarProps) {
  // 月の日付配列を生成
  const monthDates = useMemo(() => generateMonthDates(month), [month]);

  // 特定の日付のシフト配属を取得（最新データを優先）
  const getAssignmentByDate = (date: Date): ShiftAssignment | undefined => {
    const dateString = formatDateToString(date);
    
    // デバッグログ追加
    console.log(`月表示: ${dateString}のデータを検索中...`);
    console.log('利用可能なシフトデータ:', shiftsData.map(s => ({ 
      id: s.id, 
      weekStart: s.weekStartDate, 
      assignmentDates: s.assignments.map(a => a.date),
      lastModified: s.lastModified 
    })));
    
    // 該当する日付のassignmentを全て取得
    const candidates: { assignment: ShiftAssignment; shiftData: typeof shiftsData[0] }[] = [];
    
    for (const shiftData of shiftsData) {
      const assignment = shiftData.assignments.find(a => a.date === dateString);
      if (assignment) {
        candidates.push({ assignment, shiftData });
      }
    }
    
    if (candidates.length === 0) {
      console.log(`${dateString}のデータが見つかりませんでした`);
      return undefined;
    }
    
    // 複数ある場合は最新のものを選択（lastModifiedまたはcreatedAtで判定）
    const latest = candidates.reduce((latest, current) => {
      const latestTime = latest.shiftData.lastModified?.getTime() || latest.shiftData.createdAt?.getTime() || 0;
      const currentTime = current.shiftData.lastModified?.getTime() || current.shiftData.createdAt?.getTime() || 0;
      return currentTime > latestTime ? current : latest;
    });
    
    console.log(`${dateString}のデータが見つかりました（${candidates.length}件中最新を選択）:`, latest.assignment);
    console.log('選択されたシフトID:', latest.shiftData.id, '最終更新:', latest.shiftData.lastModified);
    
    return latest.assignment;
  };

  // 日付クリックハンドラー
  const handleDateClick = (date: Date) => {
    if (!readOnly && onDateClick) {
      onDateClick(date);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      {/* 月表示ヘッダー */}
      <div className="p-2 bg-white border-b">
        <h3 className="text-base font-semibold text-gray-900">
          {month.getFullYear()}年{month.getMonth() + 1}月
        </h3>
      </div>

      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 bg-white border-b">
        {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
          <div
            key={day}
            className={`p-2 text-center text-xs font-medium ${
              index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-700'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 日付グリッド */}
      <div className="grid grid-cols-7">
        {monthDates.map((date, index) => {
          const isCurrentMonth = date.getMonth() === month.getMonth();
          const isCurrentDay = isToday(date);
          const isPastDay = isPast(date);
          const assignment = getAssignmentByDate(date);
          
          return (
            <MonthlyDateCell
              key={index}
              date={date}
              isCurrentMonth={isCurrentMonth}
              isToday={isCurrentDay}
              isPast={isPastDay}
              assignment={assignment}
              readOnly={readOnly}
              onClick={() => handleDateClick(date)}
            />
          );
        })}
      </div>
    </div>
  );
}

/**
 * 月次表示の個別日付セルコンポーネント
 */
interface MonthlyDateCellProps {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isPast: boolean;
  assignment?: ShiftAssignment;
  readOnly: boolean;
  onClick: () => void;
}

function MonthlyDateCell({
  date,
  isCurrentMonth,
  isToday,
  isPast,
  assignment,
  readOnly,
  onClick
}: MonthlyDateCellProps) {
  // セルの背景色とスタイルを決定
  const getCellClasses = () => {
    let classes = 'border-r border-b last:border-r-0 p-1.5 min-h-[80px] transition-colors';
    
    if (!isCurrentMonth) {
      classes += ' bg-white text-gray-400';
    } else if (isPast) {
      classes += ' bg-white';
    } else if (isToday) {
      classes += ' bg-white';
    } else {
      classes += ' bg-white hover:bg-gray-50';
    }
    
    if (!readOnly && isCurrentMonth) {
      classes += ' cursor-pointer';
    }
    
    return classes;
  };

  return (
    <div
      className={getCellClasses()}
      onClick={!readOnly && isCurrentMonth ? onClick : undefined}
    >
      {/* 日付表示 */}
      <div className={`text-xs font-medium mb-1.5 ${
        isToday ? 'text-blue-600 font-bold' : 
        !isCurrentMonth ? 'text-gray-400' : 
        'text-gray-900'
      }`}>
        {date.getDate()}
      </div>

      {/* シフト配置状況 */}
      {isCurrentMonth && assignment && (
        <div className="space-y-1">
          {/* 配置済み人数表示 */}
          <div className="space-y-1">
            {SHIFT_ORDER.map((shiftType) => {
              const shiftInfo = getShiftInfo(shiftType);
              const staffCount = assignment.shifts[shiftType].length;
              const requiredCount = shiftType === 'day' ? 6 : 2;
              const isShort = staffCount < requiredCount;
              
              return (
                <div key={shiftType} className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">
                    {shiftInfo.label}:
                  </span>
                  <span className={`text-xs font-medium ${
                    isShort ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {staffCount}/{requiredCount}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* シフト未設定の場合 */}
      {isCurrentMonth && !assignment && (
        <div className="text-xs text-gray-400 text-center mt-4">
          未設定
        </div>
      )}
    </div>
  );
}

/**
 * 指定した月の全日付を配列で生成（前月末・翌月初めも含む）
 */
function generateMonthDates(month: Date): Date[] {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  
  // 月の最初の日
  const firstDay = new Date(year, monthIndex, 1);
  // 月の最後の日
  const lastDay = new Date(year, monthIndex + 1, 0);
  
  // 最初の週の日曜日から開始
  const startDate = new Date(firstDay);
  startDate.setDate(firstDay.getDate() - firstDay.getDay());
  
  // 最後の週の土曜日まで
  const endDate = new Date(lastDay);
  endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()));
  
  const dates: Date[] = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
} 