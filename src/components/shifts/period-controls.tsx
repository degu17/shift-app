'use client';

import { formatWeekRange, formatMonthRange } from '@/lib/utils/date-utils';

/**
 * 期間コントロールのプロパティ
 */
interface PeriodControlsProps {
  viewMode: 'week' | 'month';
  currentWeekStart?: Date;
  currentMonth?: Date;
  onWeekChange?: (weeks: number) => void;
  onMonthChange?: (months: number) => void;
}

/**
 * 期間選択コントロールコンポーネント
 * 週表示と月表示の期間ナビゲーション
 */
export default function PeriodControls({
  viewMode,
  currentWeekStart,
  currentMonth,
  onWeekChange,
  onMonthChange
}: PeriodControlsProps) {
  return (
    <div className="flex justify-between items-center mb-3 p-2 bg-white rounded-lg shadow-sm border">
      {viewMode === 'week' && currentWeekStart && onWeekChange ? (
        <>
          <button
            onClick={() => onWeekChange(-1)}
            className="flex items-center px-2 py-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            前の週
          </button>

          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900">
              {formatWeekRange(currentWeekStart)}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              週表示（クリックして編集）
            </p>
          </div>

          <button
            onClick={() => onWeekChange(1)}
            className="flex items-center px-2 py-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
          >
            次の週
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      ) : viewMode === 'month' && currentMonth && onMonthChange ? (
        <>
          <button
            onClick={() => onMonthChange(-1)}
            className="flex items-center px-2 py-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            前の月
          </button>

          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900">
              {formatMonthRange(currentMonth)}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              月表示（日付をクリックして編集）
            </p>
          </div>

          <button
            onClick={() => onMonthChange(1)}
            className="flex items-center px-2 py-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
          >
            次の月
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      ) : null}
    </div>
  );
} 