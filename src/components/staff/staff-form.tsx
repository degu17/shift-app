'use client';

import { useState } from 'react';
import { StaffService } from '@/lib/firestore';
import type { Staff } from '@/lib/types';
import { UnavailableDatesCalendar } from './unavailable-dates-calendar';

/**
 * スタッフフォームのプロパティ
 */
interface StaffFormProps {
  staff: Staff | null;
  onClose: () => void;
  onSubmit: () => void;
}

/**
 * スタッフ作成・編集フォームコンポーネント
 * スタッフの基本情報、勤務可能シフト、等を編集
 */
export default function StaffForm({ staff, onClose, onSubmit }: StaffFormProps) {
  const [formData, setFormData] = useState({
    name: staff?.name || '',
    availableShifts: staff?.availableShifts || [],
    unavailableDates: staff?.unavailableDates || [],
    skills: staff?.skills.join('、') || '',
    experienceLevel: staff?.experienceLevel || 'mid',
    isActive: staff?.isActive ?? true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // フォーム送信処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('名前は必須です');
      return;
    }

    if (formData.availableShifts.length === 0) {
      setError('少なくとも1つの勤務可能シフトを選択してください');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const staffData = {
        name: formData.name.trim(),
        availableShifts: formData.availableShifts as ('day' | 'evening' | 'night')[],
        unavailableDates: formData.unavailableDates,
        skills: formData.skills.split('、').map(s => s.trim()).filter(s => s),
        experienceLevel: formData.experienceLevel as 'junior' | 'mid' | 'senior',
        isActive: formData.isActive
      };

      if (staff) {
        // 編集
        await StaffService.updateStaff(staff.id, staffData);
      } else {
        // 新規作成
        await StaffService.createStaff(staffData);
      }

      onSubmit();
    } catch (err) {
      setError('保存に失敗しました');
      console.error('保存エラー:', err);
    } finally {
      setLoading(false);
    }
  };

  // シフト選択の処理
  const handleShiftChange = (shift: string, checked: boolean) => {
    const shiftType = shift as 'day' | 'evening' | 'night';
    if (checked) {
      setFormData(prev => ({
        ...prev,
        availableShifts: [...prev.availableShifts, shiftType]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        availableShifts: prev.availableShifts.filter(s => s !== shiftType)
      }));
    }
  };

  // 休み希望日の処理
  const handleUnavailableDatesChange = (dates: string[]) => {
    setFormData(prev => ({
      ...prev,
      unavailableDates: dates
    }));
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {staff ? 'スタッフ編集' : '新しいスタッフを追加'}
          </h3>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 左側：基本情報 */}
              <div className="space-y-4">
                {/* 名前 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    名前 *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* 勤務可能シフト */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    勤務可能シフト *
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: 'day', label: '日勤' },
                      { value: 'evening', label: '準夜' },
                      { value: 'night', label: '深夜' }
                    ].map(({ value, label }) => (
                      <label key={value} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.availableShifts.includes(value as 'day' | 'evening' | 'night')}
                          onChange={(e) => handleShiftChange(value, e.target.checked)}
                          className="mr-2"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>

                {/* 職種 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    職種（「、」で区切って複数入力可）
                  </label>
                  <input
                    type="text"
                    value={formData.skills}
                    onChange={(e) => setFormData(prev => ({ ...prev, skills: e.target.value }))}
                    placeholder="例：基本業務、専門業務"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* 経験レベル */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    経験レベル
                  </label>
                  <select
                    value={formData.experienceLevel}
                    onChange={(e) => setFormData(prev => ({ ...prev, experienceLevel: e.target.value as 'junior' | 'mid' | 'senior' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="junior">新人</option>
                    <option value="mid">中堅</option>
                    <option value="senior">シニア</option>
                  </select>
                </div>

                {/* アクティブ状態 */}
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="mr-2"
                    />
                    アクティブ
                  </label>
                </div>
              </div>

              {/* 右側：休み希望日 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  休み希望日
                </label>
                <UnavailableDatesCalendar
                  selectedDates={formData.unavailableDates}
                  onDatesChange={handleUnavailableDatesChange}
                />
              </div>
            </div>

            {/* ボタン */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                disabled={loading}
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? '保存中...' : '保存'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 