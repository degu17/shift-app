'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  getWeekDates,
  formatDateForDisplay,
  SHIFT_ORDER,
  getShiftInfo,
  isToday,
  isPast,
  formatDateToString
} from '@/lib/utils/date-utils';
import type { WeeklyShift, ShiftAssignment, Staff } from '@/lib/types';
import { StaffService } from '@/lib/firestore';

/**
 * 週次カレンダーのプロパティ
 */
interface WeeklyCalendarProps {
  weekStartDate: Date;
  shiftData?: WeeklyShift;
  onCellClick?: (date: string, shiftType: 'day' | 'evening' | 'night') => void;
  readOnly?: boolean;
}

/**
 * 週次カレンダーコンポーネント
 * 1週間のシフト表を表示
 */
export default function WeeklyCalendar({
  weekStartDate,
  shiftData,
  onCellClick,
  readOnly = false
}: WeeklyCalendarProps) {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  
  // 週の日付配列を生成
  const weekDates = useMemo(() => getWeekDates(weekStartDate), [weekStartDate]);

  // スタッフデータを読み込み
  useEffect(() => {
    const loadStaff = async () => {
      try {
        const staff = await StaffService.getAllStaff();
        setStaffList(staff);
      } catch (error) {
        console.error('スタッフデータ読み込みエラー:', error);
      }
    };

    loadStaff();
  }, []);

  // staffIdからスタッフ名を取得するヘルパー
  const getStaffNameById = (staffId: string): string => {
    const staff = staffList.find(s => s.id === staffId);
    return staff?.name || `不明なスタッフ(${staffId})`;
  };

  // 日付文字列からシフト配属を取得するヘルパー
  const getAssignmentByDate = (dateString: string): ShiftAssignment | undefined => {
    return shiftData?.assignments.find(assignment => assignment.date === dateString);
  };

  // セルクリックハンドラー
  const handleCellClick = (date: string, shiftType: 'day' | 'evening' | 'night') => {
    if (!readOnly && onCellClick) {
      onCellClick(date, shiftType);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      {/* ヘッダー */}
      <div className="grid grid-cols-8 bg-white border-b overflow-x-auto">
        {/* 左上のシフト種別ヘッダー */}
        <div className="p-1.5 md:p-2 font-medium text-gray-700 border-r text-xs md:text-sm">
          シフト
        </div>
        
        {/* 日付ヘッダー */}
        {weekDates.map((date) => {
          const dateString = formatDateToString(date);
          const isCurrentDay = isToday(date);
          const isPastDay = isPast(date);
          
          return (
            <div
              key={dateString}
              className={`p-1.5 md:p-2 text-center border-r last:border-r-0 ${
                isCurrentDay 
                  ? 'bg-white text-blue-800 font-semibold' 
                  : isPastDay 
                    ? 'bg-white text-gray-500' 
                    : 'bg-white text-gray-700'
              }`}
            >
              <div className="text-xs font-medium">
                {formatDateForDisplay(date)}
              </div>
            </div>
          );
        })}
      </div>

      {/* シフト行 */}
      {SHIFT_ORDER.map((shiftType) => {
        const shiftInfo = getShiftInfo(shiftType);
        
        return (
          <div key={shiftType} className="grid grid-cols-8 border-b last:border-b-0">
            {/* シフト種別ラベル */}
            <div className="p-1.5 md:p-2 bg-white border-r flex flex-col justify-center">
              <div className="font-medium text-gray-800 text-xs md:text-sm">
                {shiftInfo.label}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {shiftInfo.start} - {shiftInfo.end}
              </div>
            </div>

            {/* 各日のシフトセル */}
            {weekDates.map((date) => {
              const dateString = formatDateToString(date);
              const assignment = getAssignmentByDate(dateString);
              const staffIds = assignment?.shifts[shiftType] || [];
              const isCurrentDay = isToday(date);
              const isPastDay = isPast(date);
              
              return (
                <ShiftCell
                  key={`${dateString}-${shiftType}`}
                  shiftType={shiftType}
                  staffIds={staffIds}
                  isToday={isCurrentDay}
                  isPast={isPastDay}
                  readOnly={readOnly}
                  onClick={() => handleCellClick(dateString, shiftType)}
                  getStaffNameById={getStaffNameById}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

/**
 * 個別のシフトセルコンポーネント
 */
interface ShiftCellProps {
  shiftType: 'day' | 'evening' | 'night';
  staffIds: string[];
  isToday: boolean;
  isPast: boolean;
  readOnly: boolean;
  onClick: () => void;
  getStaffNameById: (staffId: string) => string;
}

function ShiftCell({
  shiftType,
  staffIds,
  isToday,
  isPast,
  readOnly,
  onClick,
  getStaffNameById
}: ShiftCellProps) {
  // セルの背景色を決定
  const getCellBackgroundClass = () => {
    if (isPast) return 'bg-white';
    if (isToday) return 'bg-white';
    return 'bg-white hover:bg-gray-50';
  };

  // スタッフ数に応じた表示
  const getStaffDisplay = () => {
    if (staffIds.length === 0) {
      return (
        <div className="text-gray-400 text-sm">
          未配置
        </div>
      );
    }

    // 全員の名前を表示
    return (
      <div className="space-y-1">
        {staffIds.map((staffId, index) => (
          <StaffBadge key={index} staffName={getStaffNameById(staffId)} />
        ))}
      </div>
    );
  };

  return (
    <div
      className={`p-1.5 md:p-2 border-r last:border-r-0 min-h-[40px] md:min-h-[50px] transition-colors ${
        getCellBackgroundClass()
      } ${!readOnly ? 'cursor-pointer' : ''}`}
      onClick={!readOnly ? onClick : undefined}
    >
      {getStaffDisplay()}
      
      {/* 人数不足の警告 */}
      {(() => {
        const requiredStaff = shiftType === 'day' ? 6 : 2;
        if (staffIds.length < requiredStaff && staffIds.length > 0) {
          return (
            <div className="mt-1 text-xs text-amber-600">
              人数不足 ({staffIds.length}/{requiredStaff}人)
            </div>
          );
        }
        return null;
      })()}
    </div>
  );
}

/**
 * スタッフバッジコンポーネント
 */
interface StaffBadgeProps {
  staffName: string;
}

function StaffBadge({ staffName }: StaffBadgeProps) {
  return (
    <div className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
      {staffName}
    </div>
  );
} 