import React from 'react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';

interface UnavailableDatesCalendarProps {
  selectedDates: string[];
  onDatesChange: (dates: string[]) => void;
  className?: string;
}

/**
 * 休み希望日選択用カレンダーコンポーネント
 * 複数日選択機能と選択済み日付の管理を提供
 */
export function UnavailableDatesCalendar({
  selectedDates,
  onDatesChange,
  className = ''
}: UnavailableDatesCalendarProps) {
  
  // 文字列の日付をDateオブジェクトに変換
  const selectedDateObjects = selectedDates.map(dateStr => {
    const date = new Date(dateStr + 'T00:00:00+09:00');
    return date;
  }).filter(date => !isNaN(date.getTime())); // 無効な日付を除外

  // カレンダーでの日付選択ハンドラー
  const handleDateSelect = (selected: Date | Date[] | DateRange | undefined) => {
    if (!selected) {
      onDatesChange([]);
      return;
    }

    // multipleモードの場合はDate[]が返される
    let dates: Date[] = [];
    if (Array.isArray(selected)) {
      dates = selected;
    } else if (selected instanceof Date) {
      dates = [selected];
    } else {
      // DateRangeの場合は無視（multipleモードなので使用されない）
      return;
    }

    // DateオブジェクトをYYYY-MM-DD形式の文字列に変換
    const dateStrings = dates.map(date => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    });

    onDatesChange(dateStrings);
  };

  // 個別日付の削除
  const removeDate = (dateToRemove: string) => {
    const updatedDates = selectedDates.filter(date => date !== dateToRemove);
    onDatesChange(updatedDates);
  };

  // 全日付のクリア
  const clearAllDates = () => {
    onDatesChange([]);
  };

  // 日付フォーマット関数
  const formatDateString = (dateStr: string) => {
    try {
      const date = new Date(dateStr + 'T00:00:00+09:00');
      return format(date, 'M月d日(E)', { locale: ja });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* カレンダー */}
      <div className="border rounded-lg p-3 bg-white w-64 mx-auto">
        <Calendar
          mode="multiple"
          selected={selectedDateObjects}
          onSelect={handleDateSelect}
          disabled={(date) => {
            // 過去の日付を無効化
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return date < today;
          }}
          className="w-full"
        />
      </div>

      {/* 選択済み日付の一覧とコントロール */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-medium text-gray-700">
            選択中の休み希望日 ({selectedDates.length}件)
          </h4>
          {selectedDates.length > 0 && (
            <button
              type="button"
              onClick={clearAllDates}
              className="text-xs text-red-600 hover:text-red-800 underline"
            >
              全てクリア
            </button>
          )}
        </div>

        {/* 選択済み日付の表示 */}
        {selectedDates.length > 0 ? (
          <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
            {selectedDates.map(date => (
              <div
                key={date}
                className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 rounded text-xs"
              >
                <span>{formatDateString(date)}</span>
                <button
                  type="button"
                  onClick={() => removeDate(date)}
                  className="text-red-500 hover:text-red-700"
                  aria-label={`${formatDateString(date)}を削除`}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-500">
            カレンダーから休み希望日を選択してください
          </p>
        )}
      </div>

      {/* ヘルプテキスト */}
      <div className="text-xs text-gray-400 space-y-1">
        <p>• クリックで選択/解除 • 赤色が選択済み</p>
      </div>
    </div>
  );
} 