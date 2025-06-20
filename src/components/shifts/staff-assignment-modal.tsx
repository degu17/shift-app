'use client';

import { useState, useEffect } from 'react';
import { StaffService } from '@/lib/firestore';
import type { Staff } from '@/lib/types';

/**
 * スタッフ配置モーダルのプロパティ
 */
interface StaffAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  shiftType: 'day' | 'evening' | 'night';
  assignedStaffIds: string[];
  onAssignmentChange: (staffIds: string[]) => void;
}

/**
 * スタッフ配置モーダルコンポーネント
 */
export default function StaffAssignmentModal({
  isOpen,
  onClose,
  date,
  shiftType,
  assignedStaffIds,
  onAssignmentChange
}: StaffAssignmentModalProps) {
  const [availableStaff, setAvailableStaff] = useState<Staff[]>([]);
  const [unavailableStaff, setUnavailableStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [initialStaffIds, setInitialStaffIds] = useState<string[]>([]);

  // シフトタイプの表示名を取得
  const getShiftTypeName = () => {
    const shiftNames = {
      day: '日勤 (09:00-17:00)',
      evening: '準夜 (17:00-01:00)',
      night: '深夜 (01:00-09:00)'
    };
    return shiftNames[shiftType];
  };

  // 必要人数を取得
  const getRequiredCount = () => {
    return shiftType === 'day' ? 6 : 2;
  };

  // スタッフ一覧を読み込み
  useEffect(() => {
    if (!isOpen) return;

    const loadStaff = async () => {
      try {
        setLoading(true);
        setError(null);

        const allStaff = await StaffService.getAllStaff();
        
        // 勤務可能なスタッフ（そのシフトタイプに対応 & アクティブ & 休み希望でない）
        const available = allStaff.filter(staff => 
          staff.isActive && 
          staff.availableShifts.includes(shiftType) &&
          (!staff.unavailableDates || !staff.unavailableDates.includes(date))
        );

        // 休み希望のスタッフ（そのシフトタイプに対応 & アクティブ & 休み希望）
        const unavailable = allStaff.filter(staff => 
          staff.isActive && 
          staff.availableShifts.includes(shiftType) &&
          staff.unavailableDates && 
          staff.unavailableDates.includes(date)
        );

        setAvailableStaff(available);
        setUnavailableStaff(unavailable);

        // 初期選択状態を設定
        setSelectedStaffIds([...assignedStaffIds]);
        setInitialStaffIds([...assignedStaffIds]);
        
        setAvailableStaff(available);
        setUnavailableStaff([]);
      } finally {
        setLoading(false);
      }
    };

    loadStaff();
  }, [isOpen, date, shiftType, assignedStaffIds]);

  // スタッフの選択状態を切り替え
  const handleStaffToggle = (staffId: string) => {
    if (loading || saving) return;
    
    setSelectedStaffIds(prev => {
      if (prev.includes(staffId)) {
        return prev.filter(id => id !== staffId);
      } else {
        return [...prev, staffId];
      }
    });
  };

  // 保存処理
  const handleSave = async () => {
    if (loading || saving) return;
    
    try {
      setSaving(true);
      setError(null);
      await onAssignmentChange(selectedStaffIds);
      // onAssignmentChangeが成功した場合のみモーダルを閉じる
      onClose();
    } catch (error) {
      console.error('スタッフ配置保存エラー:', error);
      setError('配置の保存に失敗しました。ネットワーク接続を確認して再試行してください。');
      // エラー時はモーダルを開いたまま
    } finally {
      setSaving(false);
    }
  };

  // キャンセル処理
  const handleCancel = () => {
    if (saving) return;
    
    setSelectedStaffIds([...initialStaffIds]);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* ヘッダー */}
        <div className="bg-gray-50 px-6 py-4 border-b flex-shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">スタッフ配置</h2>
              <p className="text-sm text-gray-600 mt-1">
                {date} - {getShiftTypeName()}
              </p>
            </div>
            <button
              onClick={handleCancel}
              disabled={loading || saving}
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* ステータス情報 */}
        <div className="px-6 py-4 bg-blue-50 border-b flex-shrink-0">
          <div className="flex justify-between items-center">
            <div className="text-sm">
              <span className="text-gray-600">標準人数: </span>
              <span className="font-medium">{getRequiredCount()}人</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-600">選択中: </span>
              <span className={`font-medium ${
                selectedStaffIds.length === getRequiredCount() 
                  ? 'text-green-600' 
                  : selectedStaffIds.length > getRequiredCount() 
                    ? 'text-orange-600' 
                    : 'text-amber-600'
              }`}>
                {selectedStaffIds.length}人
              </span>
            </div>
          </div>
          {selectedStaffIds.length !== getRequiredCount() && (
            <div className="text-xs mt-1">
              {selectedStaffIds.length < getRequiredCount() ? (
                <div className="text-amber-600 flex items-center">
                  <span className="mr-1">⚠️</span>
                  標準より{getRequiredCount() - selectedStaffIds.length}人少ない配置です（新人が多い場合など、状況に応じて調整可能）
                </div>
              ) : (
                <div className="text-orange-600 flex items-center">
                  <span className="mr-1">⚠️</span>
                  標準より{selectedStaffIds.length - getRequiredCount()}人多い配置です（新人が多い場合など、状況に応じて調整可能）
                </div>
              )}
            </div>
          )}
        </div>

        {/* スタッフ一覧 */}
        <div className="px-6 py-4 flex-1 overflow-y-auto min-h-0">
          {/* エラーメッセージ */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-8 text-gray-500">
              読み込み中...
            </div>
          ) : (
            <div className="space-y-6">
              {/* 利用可能なスタッフ */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  勤務可能なスタッフ ({availableStaff.length}人)
                </h3>
                {availableStaff.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    勤務可能なスタッフがいません
                  </div>
                ) : (
                  <div className="space-y-2">
                    {availableStaff.map(staff => (
                      <div 
                        key={staff.id}
                        className={`border rounded-lg p-3 transition-colors ${
                          loading || saving 
                            ? 'cursor-not-allowed opacity-50' 
                            : 'cursor-pointer'
                        } ${
                          selectedStaffIds.includes(staff.id)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={() => handleStaffToggle(staff.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedStaffIds.includes(staff.id)}
                              onChange={() => handleStaffToggle(staff.id)}
                              disabled={loading || saving}
                              className="mr-3 h-4 w-4 text-blue-600 disabled:opacity-50"
                            />
                            <div>
                              <div className="font-medium text-gray-900">{staff.name}</div>
                              <div className="text-sm text-gray-500">
                                {staff.skills.join('、')} | {
                                  staff.experienceLevel === 'junior' ? '新人' :
                                  staff.experienceLevel === 'mid' ? '中堅' : 'シニア'
                                }
                              </div>
                            </div>
                          </div>
                          {selectedStaffIds.includes(staff.id) && (
                            <div className="text-blue-600">
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 休み希望のスタッフ */}
              {unavailableStaff.length > 0 && (
                <div>
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                      <span className="text-amber-600 mr-2">⚠️</span>
                      休み希望のスタッフ ({unavailableStaff.length}人)
                    </h3>
                    <p className="text-xs text-gray-500 mb-3">
                      ※ 休み希望です。必要時に配置可能です。自動最適化の対象にはなりません。
                    </p>
                    <div className="space-y-2">
                      {unavailableStaff.map(staff => (
                        <div 
                          key={staff.id}
                          className={`border rounded-lg p-3 transition-colors ${
                            loading || saving 
                              ? 'cursor-not-allowed opacity-50' 
                              : 'cursor-pointer'
                          } ${
                            selectedStaffIds.includes(staff.id)
                              ? 'border-amber-500 bg-amber-50'
                              : 'border-amber-200 hover:border-amber-300 hover:bg-amber-50'
                          }`}
                          onClick={() => handleStaffToggle(staff.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                checked={selectedStaffIds.includes(staff.id)}
                                onChange={() => handleStaffToggle(staff.id)}
                                disabled={loading || saving}
                                className="mr-3 h-4 w-4 text-amber-600 disabled:opacity-50"
                              />
                              <div>
                                <div className="font-medium text-gray-900 flex items-center">
                                  {staff.name}
                                  <span className="ml-2 text-xs text-amber-600 bg-amber-100 px-1 py-0.5 rounded">
                                    休み希望
                                  </span>
                                </div>
                                <div className="text-sm text-gray-500">
                                  {staff.skills.join('、')} | {
                                    staff.experienceLevel === 'junior' ? '新人' :
                                    staff.experienceLevel === 'mid' ? '中堅' : 'シニア'
                                  }
                                </div>
                              </div>
                            </div>
                            {selectedStaffIds.includes(staff.id) && (
                              <div className="text-amber-600">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="bg-gray-50 px-6 py-4 border-t flex justify-end space-x-3 flex-shrink-0">
          <button
            onClick={handleCancel}
            disabled={loading || saving}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={loading || saving}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving && (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {saving ? '保存中...' : loading ? '読み込み中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
} 