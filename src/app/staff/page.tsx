'use client';

import { useState, useEffect } from 'react';
import { StaffService } from '@/lib/firestore';
import type { Staff } from '@/lib/types';
import StaffForm from '@/components/staff/staff-form';
import { exportStaffToExcel } from '@/lib/utils/excel-export';

/**
 * スタッフ管理メインページ
 */
export default function StaffPage() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  // スタッフ一覧を読み込み
  const loadStaff = async () => {
    try {
      setLoading(true);
      const staff = await StaffService.getAllStaff();
      setStaffList(staff);
      setError(null);
    } catch (err) {
      setError('スタッフ一覧の読み込みに失敗しました');
      console.error('スタッフ読み込みエラー:', err);
    } finally {
      setLoading(false);
    }
  };

  // 初回読み込み
  useEffect(() => {
    loadStaff();
  }, []);

  // スタッフ削除（無効化）
  const handleDeactivateStaff = async (id: string, name: string) => {
    if (!confirm(`${name}さんを無効化しますか？`)) return;

    try {
      await StaffService.deactivateStaff(id);
      await loadStaff(); // 一覧を再読み込み
    } catch (err) {
      setError('スタッフの無効化に失敗しました');
      console.error('スタッフ無効化エラー:', err);
    }
  };

  // 新規作成フォームを開く
  const handleCreateNew = () => {
    setEditingStaff(null);
    setShowForm(true);
  };

  // 編集フォームを開く
  const handleEdit = (staff: Staff) => {
    setEditingStaff(staff);
    setShowForm(true);
  };

  // フォームを閉じる
  const handleCloseForm = () => {
    setShowForm(false);
    setEditingStaff(null);
  };

  // フォーム送信後の処理
  const handleFormSubmit = async () => {
    setShowForm(false);
    setEditingStaff(null);
    await loadStaff(); // 一覧を再読み込み
  };

  // Excel出力処理
  const handleExportExcel = () => {
    if (staffList.length === 0) {
      alert('出力するスタッフデータがありません');
      return;
    }
    
    try {
      exportStaffToExcel(staffList);
    } catch (err) {
      console.error('Excel出力エラー:', err);
      alert('Excel出力に失敗しました');
    }
  };

  // 勤務可能シフトの表示文字列を生成
  const getShiftText = (shifts: string[]) => {
    const shiftMap = {
      day: '日勤',
      evening: '準夜',
      night: '深夜'
    };
    return shifts.map(shift => shiftMap[shift as keyof typeof shiftMap]).join('、');
  };

  // 経験レベルの表示文字列を生成
  const getExperienceText = (level: string) => {
    const levelMap = {
      junior: '新人',
      mid: '中堅',
      senior: 'シニア'
    };
    return levelMap[level as keyof typeof levelMap] || level;
  };

  // 休み希望日の表示文字列を生成
  const getUnavailableDatesText = (dates: string[]) => {
    if (!dates || dates.length === 0) {
      return '設定なし';
    }
    
    // 最大3件まで表示し、それ以上は件数で表示
    if (dates.length <= 3) {
      return dates.join(', ');
    } else {
      return `${dates.slice(0, 2).join(', ')} 他${dates.length - 2}件`;
    }
  };

  // スタッフ削除（削除）
  const handleDeleteStaff = async (staffId: string, staffName: string) => {
    if (!confirm(`「${staffName}」を完全に削除しますか？\n\nこの操作は取り消すことができません。\n過去のシフト履歴からも削除されます。`)) return;
    
    setLoading(true);
    setError(null);
    try {
      await StaffService.deleteStaff(staffId);
      await loadStaff();
    } catch (err) {
      console.error('スタッフ削除エラー:', err);
      setError('スタッフの削除に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">スタッフ管理</h1>
        <div className="flex space-x-3">
          <button
            onClick={handleExportExcel}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
            disabled={loading}
          >
            職員一覧 Excel出力
          </button>
          <button
            onClick={handleCreateNew}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            新しいスタッフを追加
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                名前
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                勤務可能シフト
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                職種
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                経験レベル
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                休み希望日
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                状態
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {staffList.map((staff) => (
              <tr key={staff.id} className={!staff.isActive ? 'opacity-50' : ''}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {staff.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {getShiftText(staff.availableShifts)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {staff.skills.join('、')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {getExperienceText(staff.experienceLevel)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  <div className="max-w-32 truncate" title={staff.unavailableDates?.join(', ') || '設定なし'}>
                    {getUnavailableDatesText(staff.unavailableDates || [])}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    staff.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {staff.isActive ? 'アクティブ' : '無効'}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(staff)}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      disabled={loading}
                    >
                      編集
                    </button>
                    {staff.isActive && (
                      <button
                        onClick={() => handleDeactivateStaff(staff.id, staff.name)}
                        className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-colors"
                        disabled={loading}
                      >
                        無効化
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteStaff(staff.id, staff.name)}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                      disabled={loading}
                    >
                      削除
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {staffList.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            スタッフが登録されていません
          </div>
        )}
      </div>

      {/* スタッフフォームモーダル */}
      {showForm && (
        <StaffForm
          staff={editingStaff}
          onClose={handleCloseForm}
          onSubmit={handleFormSubmit}
        />
      )}
    </div>
  );
}

 