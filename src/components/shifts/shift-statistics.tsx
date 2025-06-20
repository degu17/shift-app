'use client';

import type { WeeklyShift } from '@/lib/types';
import {
  getTotalAssignments,
  getRequiredStaff,
  getUnassignedSlots,
  getAssignmentRate,
  getShiftAssignments,
  getMonthShortages
} from '@/lib/utils/shift-calculations';

/**
 * シフト統計のプロパティ
 */
interface ShiftStatisticsProps {
  viewMode: 'week' | 'month';
  shiftData?: WeeklyShift;
  monthShiftsData?: WeeklyShift[];
  onViewModeChange?: (mode: 'week' | 'month') => void;
}

/**
 * シフト統計情報表示コンポーネント
 * 週次表示と月次表示で異なる統計情報を表示
 */
export default function ShiftStatistics({
  viewMode,
  shiftData,
  monthShiftsData = [],
  onViewModeChange
}: ShiftStatisticsProps) {
  if (viewMode === 'week' && !shiftData) return null;
  if (viewMode === 'month' && monthShiftsData.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {viewMode === 'week' && shiftData ? (
        <>
          {/* 週次表示：配置状況 */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">配置状況</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">総配置数:</span>
                <span className="font-medium">{getTotalAssignments(shiftData)}人日</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">必要人数:</span>
                <span className="font-medium">{getRequiredStaff(shiftData)}人日</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">未配置枠:</span>
                <span className="font-medium text-amber-600">{getUnassignedSlots(shiftData)}枠</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">配置率:</span>
                <span className="font-medium text-blue-600">{getAssignmentRate(shiftData)}%</span>
              </div>
            </div>
          </div>

          {/* 週次表示：シフト別配置状況 */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">シフト別配置状況</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">日勤 (6人/日):</span>
                <span className="font-medium">{getShiftAssignments(shiftData, 'day')}/{shiftData.assignments.length * 6}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">準夜 (2人/日):</span>
                <span className="font-medium">{getShiftAssignments(shiftData, 'evening')}/{shiftData.assignments.length * 2}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">深夜 (2人/日):</span>
                <span className="font-medium">{getShiftAssignments(shiftData, 'night')}/{shiftData.assignments.length * 2}</span>
              </div>
            </div>
          </div>


        </>
      ) : (
        <>
          {/* 月次表示：月次統計 */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">月次統計</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">設定済み週:</span>
                <span className="font-medium">{monthShiftsData.length}週間</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">総配置数:</span>
                <span className="font-medium">{monthShiftsData.reduce((sum, shift) => {
                  try {
                    return sum + getTotalAssignments(shift);
                  } catch (error) {
                    console.error('統計計算エラー:', error);
                    return sum;
                  }
                }, 0)}人日</span>
              </div>
            </div>
          </div>

          {/* 月次表示：不足状況 */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">不足状況</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">日勤不足:</span>
                <span className="font-medium text-red-600">{getMonthShortages(monthShiftsData, 'day')}人日</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">準夜不足:</span>
                <span className="font-medium text-red-600">{getMonthShortages(monthShiftsData, 'evening')}人日</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">深夜不足:</span>
                <span className="font-medium text-red-600">{getMonthShortages(monthShiftsData, 'night')}人日</span>
              </div>
            </div>
          </div>

          {/* 月次表示：詳細操作 */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">詳細操作</h3>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                日付をクリックして詳細編集
              </p>
              <button 
                onClick={() => onViewModeChange?.('week')}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded text-sm hover:bg-blue-600 transition-colors"
              >
                週表示に切り替え
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 