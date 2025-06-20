'use client';

import { useState, useEffect, useCallback } from 'react';
import WeeklyCalendar from '@/components/calendar/weekly-calendar';
import MonthlyCalendar from '@/components/calendar/monthly-calendar';
import ShiftPageHeader from '@/components/shifts/shift-page-header';
import PeriodControls from '@/components/shifts/period-controls';
import ShiftStatistics from '@/components/shifts/shift-statistics';
import StaffAssignmentModal from '@/components/shifts/staff-assignment-modal';
import {
  getCurrentWeekStart,
  addWeeks,
  getToday,
  addMonths,
  getMonthStart,
  getMonthEnd,
  formatDateToString,
  getWeekStartDate
} from '@/lib/utils/date-utils';
import type { WeeklyShift, Staff } from '@/lib/types';
import { ShiftService, StaffService } from '@/lib/firestore';
import { exportWeeklyShiftToExcel, exportMonthlyShiftToExcel } from '@/lib/utils/excel-export';

/**
 * シフト管理メインページ
 */
export default function ShiftsPage() {
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getCurrentWeekStart());
  const [currentMonth, setCurrentMonth] = useState<Date>(getToday());
  const [shiftData, setShiftData] = useState<WeeklyShift | undefined>(undefined);
  const [monthShiftsData, setMonthShiftsData] = useState<WeeklyShift[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);
  const [optimizationLoading, setOptimizationLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // スタッフ配置モーダル関連の状態
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{
    date: string;
    shiftType: 'day' | 'evening' | 'night';
  } | null>(null);

  // 週変更ハンドラー
  const handleWeekChange = (weeks: number) => {
    const newWeekStart = addWeeks(currentWeekStart, weeks);
    setCurrentWeekStart(newWeekStart);
  };

  // 月変更ハンドラー
  const handleMonthChange = (months: number) => {
    const newMonth = addMonths(currentMonth, months);
    setCurrentMonth(newMonth);
  };

  // 表示モード切り替えハンドラー
  const handleViewModeChange = (mode: 'week' | 'month') => {
    setViewMode(mode);
  };

  // シフトセルクリックハンドラー（週次表示用）
  const handleCellClick = (date: string, shiftType: 'day' | 'evening' | 'night') => {
    setSelectedCell({ date, shiftType });
    setShowAssignmentModal(true);
  };

  // 月次表示の日付クリックハンドラー
  const handleDateClick = (date: Date) => {
    // クリックした日を含む週に切り替えて週次表示モードに変更
    const weekStart = getCurrentWeekStart();
    setCurrentWeekStart(weekStart);
    setViewMode('week');
    console.log('日付クリック:', date);
  };

  // 自動最適化処理
  const handleAutoOptimize = async () => {
    if (!shiftData) {
      setError('最適化するシフトデータがありません');
      return;
    }
    
    setOptimizationLoading(true);
    setError(null);
    
    try {
      console.log('最適化API呼び出し開始:', shiftData.weekStartDate);
      
      const response = await fetch('/api/optimization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weekStartDate: shiftData.weekStartDate,
          currentAssignments: shiftData.assignments
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || '最適化APIエラー');
      }

      if (result.success && result.data) {
        // 最適化結果をシフトデータに反映
        const optimizedShift = result.data;
        
        // 既存のシフトデータがある場合は、そのIDを保持して更新
        if (shiftData && !shiftData.id.startsWith('temp-')) {
          // 既存シフトの場合：IDを保持してFirestoreに保存
          try {
            await ShiftService.updateShift(shiftData.id, {
              assignments: optimizedShift.assignments,
              optimizationHistory: [
                ...(shiftData.optimizationHistory || []),
                ...optimizedShift.optimizationHistory
              ],
              status: 'confirmed'
            });
            
            // Firestore保存成功後、最新データを読み込み直す
            const savedShift = await ShiftService.getShiftByWeek(optimizedShift.weekStartDate);
            if (savedShift) {
              setShiftData(savedShift);
              // 月表示のデータも更新（viewModeに関係なく更新）
              await loadMonthData(currentMonth);
              console.log('最適化結果をFirestoreに保存しました');
            } else {
              throw new Error('保存後のデータ読み込みに失敗しました');
            }
          } catch (saveError) {
            console.error('最適化結果の保存エラー:', saveError);
            setError(`最適化結果の保存に失敗しました: ${saveError instanceof Error ? saveError.message : '不明なエラー'}`);
            return; // 保存失敗時は処理を中断
          }
        } else {
          // 一時シフトまたは新規シフトの場合：既存確認して作成または更新
          try {
            // 同じ週のシフトが既に存在するかを確認
            const existingShift = await ShiftService.getShiftByWeek(optimizedShift.weekStartDate);
            
            if (existingShift) {
              // 既存シフトが見つかった場合は更新
              await ShiftService.updateShift(existingShift.id, {
                assignments: optimizedShift.assignments,
                optimizationHistory: [
                  ...(existingShift.optimizationHistory || []),
                  ...optimizedShift.optimizationHistory
                ],
                status: 'confirmed'
              });
              
              // 更新後のデータを読み込み直す
              const updatedShift = await ShiftService.getShiftByWeek(optimizedShift.weekStartDate);
              if (updatedShift) {
                setShiftData(updatedShift);
                // 月表示のデータも更新（viewModeに関係なく更新）
                await loadMonthData(currentMonth);
                console.log('既存シフトに最適化結果を統合しました:', existingShift.id);
              }
            } else {
              // 新規作成
              const newShiftData = {
                weekStartDate: optimizedShift.weekStartDate,
                status: 'confirmed' as const,
                assignments: optimizedShift.assignments,
                optimizationHistory: optimizedShift.optimizationHistory,
                createdBy: 'optimization-engine'
              };
              
              const newShiftId = await ShiftService.createShift(newShiftData);
              
              // Firestore保存成功後、最新データを読み込み直す
              const savedShift = await ShiftService.getShiftByWeek(optimizedShift.weekStartDate);
              if (savedShift) {
                setShiftData(savedShift);
                // 月表示のデータも更新（viewModeに関係なく更新）
                await loadMonthData(currentMonth);
                console.log('最適化結果を新規シフトとしてFirestoreに保存しました:', newShiftId);
              } else {
                throw new Error('保存後のデータ読み込みに失敗しました');
              }
            }
          } catch (saveError) {
            console.error('シフト保存エラー:', saveError);
            setError(`シフトの保存に失敗しました: ${saveError instanceof Error ? saveError.message : '不明なエラー'}`);
            return; // 保存失敗時は処理を中断
          }
        }
        
        console.log('最適化結果:', optimizedShift);
        alert('最適化されたシフトに上書きしました。');
      } else {
        throw new Error(result.message || '最適化に失敗しました');
      }
      
    } catch (err) {
      console.error('自動最適化エラー:', err);
      setError(`自動最適化に失敗しました: ${err instanceof Error ? err.message : '不明なエラー'}`);
    } finally {
      setOptimizationLoading(false);
    }
  };

  // Firebaseからシフトデータを読み込む関数
  const loadShiftData = useCallback(async (weekStartDate: Date) => {
    setLoading(true);
    setError(null);
    
    try {
      const weekStartString = formatDateToString(weekStartDate);
      const existingShift = await ShiftService.getShiftByWeek(weekStartString);
      
      if (existingShift) {
        setShiftData(existingShift);
      } else {
        // 存在しない場合は空のシフトテンプレートを表示
        const emptyShift = ShiftService.createEmptyShift(weekStartString);
        setShiftData({
          id: 'temp-' + weekStartString,
          ...emptyShift,
          createdAt: new Date(),
          lastModified: new Date()
        });
      }
    } catch (err) {
      console.error('シフトデータ読み込みエラー:', err);
      setError('シフトデータの読み込みに失敗しました');
      // エラー時も空のシフトテンプレートを表示
      const weekStartString = formatDateToString(weekStartDate);
      const emptyShift = ShiftService.createEmptyShift(weekStartString);
      setShiftData({
        id: 'temp-' + weekStartString,
        ...emptyShift,
        createdAt: new Date(),
        lastModified: new Date()
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // 月次データを読み込む関数
  const loadMonthData = useCallback(async (month: Date) => {
    setLoading(true);
    setError(null);
    
    try {
      const monthStart = getMonthStart(month);
      const monthEnd = getMonthEnd(month);
      
      // 月に含まれる週の開始日範囲を計算
      const firstWeekStart = getWeekStartDate(monthStart);
      const lastWeekStart = getWeekStartDate(monthEnd);
      
      const startString = formatDateToString(firstWeekStart);
      const endString = formatDateToString(lastWeekStart);
      
      console.log(`=== 月次データ読み込み開始 ===`);
      console.log(`対象月: ${month.getFullYear()}年${month.getMonth() + 1}月`);
      console.log(`検索範囲: ${startString} ~ ${endString}`);
      console.log(`monthStart:`, monthStart);
      console.log(`monthEnd:`, monthEnd);
      
      const shifts = await ShiftService.getShiftsByDateRange(startString, endString);
      
      console.log(`取得したシフトデータ数: ${shifts.length}`);
      console.log('取得したシフトデータ詳細:', shifts.map(s => ({
        id: s.id,
        weekStart: s.weekStartDate,
        status: s.status,
        assignmentsCount: s.assignments.length,
        dates: s.assignments.map(a => a.date),
        createdAt: s.createdAt,
        lastModified: s.lastModified
      })));
      
      if (shifts.length === 0) {
        console.warn(`⚠️ ${month.getFullYear()}年${month.getMonth() + 1}月のシフトデータが見つかりませんでした`);
        console.warn('Firestoreに該当期間のデータが存在しない可能性があります');
      }
      
      // データが存在するかどうかに関わらず、取得したデータをそのまま設定
      setMonthShiftsData(shifts);
      console.log(`=== 月次データ読み込み完了 ===`);
    } catch (err) {
      console.error('月次データ読み込みエラー:', err);
      setError('月次データの読み込みに失敗しました');
      // エラー時は空の配列を設定
      setMonthShiftsData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 週が変更された時のデータ読み込み
  useEffect(() => {
    if (viewMode === 'week') {
      loadShiftData(currentWeekStart);
    }
  }, [currentWeekStart, viewMode, loadShiftData]);

  // 月が変更された時のデータ読み込み
  useEffect(() => {
    if (viewMode === 'month') {
      loadMonthData(currentMonth);
    }
  }, [currentMonth, viewMode, loadMonthData]);

  // スタッフ配置を変更
  const handleAssignmentChange = async (staffIds: string[]) => {
    if (!shiftData || !selectedCell) return;

    try {
      // 現在の配属データをコピー
      const newAssignments = [...shiftData.assignments];
      const assignmentIndex = newAssignments.findIndex(a => a.date === selectedCell.date);
      
      if (assignmentIndex !== -1) {
        // 既存の配属を更新
        newAssignments[assignmentIndex] = {
          ...newAssignments[assignmentIndex],
          shifts: {
            ...newAssignments[assignmentIndex].shifts,
            [selectedCell.shiftType]: staffIds
          }
        };
      } else {
        // 新しい配属を追加
        newAssignments.push({
          date: selectedCell.date,
          shifts: {
            day: selectedCell.shiftType === 'day' ? staffIds : [],
            evening: selectedCell.shiftType === 'evening' ? staffIds : [],
            night: selectedCell.shiftType === 'night' ? staffIds : []
          }
        });
      }

      let finalShiftData: WeeklyShift;

      if (shiftData.id.startsWith('temp-')) {
        // 一時シフトの場合：重複チェック後にFirestoreに新規作成
        const existingShift = await ShiftService.getShiftByWeek(shiftData.weekStartDate);
        
        if (existingShift) {
          // 既存シフトが見つかった場合は更新
          await ShiftService.updateShiftAssignments(existingShift.id, newAssignments);
          finalShiftData = {
            ...existingShift,
            assignments: newAssignments
          };
        } else {
          // 新規作成
          const shiftToCreate = {
            weekStartDate: shiftData.weekStartDate,
            status: 'confirmed' as const,
            assignments: newAssignments,
            optimizationHistory: shiftData.optimizationHistory,
            createdBy: shiftData.createdBy
          };
          
          const newShiftId = await ShiftService.createShift(shiftToCreate);
          
          finalShiftData = {
            ...shiftData,
            id: newShiftId,
            assignments: newAssignments,
            status: 'confirmed'
          };
        }
      } else {
        // 既存シフトの場合：Firestoreを更新
        await ShiftService.updateShiftAssignments(shiftData.id, newAssignments);
        
        finalShiftData = {
          ...shiftData,
          assignments: newAssignments
        };
      }

      // Firestore保存成功後にローカル状態を更新
      setShiftData(finalShiftData);

      // 月表示のデータも更新（エラーが発生してもモーダルは閉じる）
      try {
        await loadMonthData(currentMonth);
      } catch (monthError) {
        console.error('月次データ更新エラー:', monthError);
        // 月次データ更新エラーは警告レベル（配置保存は成功済み）
      }
      
    } catch (error) {
      console.error('配属更新エラー:', error);
      // エラーメッセージを統一し、詳細な情報を提供
      const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました';
      throw new Error(`配置の保存に失敗しました: ${errorMessage}`);
    }
  };

  // 現在選択されているセルの配属スタッフIDを取得
  const getCurrentAssignedStaffIds = (): string[] => {
    if (!shiftData || !selectedCell) return [];
    
    const assignment = shiftData.assignments.find(a => a.date === selectedCell.date);
    return assignment ? assignment.shifts[selectedCell.shiftType] : [];
  };

  // Excel出力処理
  const handleExportExcel = () => {
    if (viewMode === 'week') {
      if (!shiftData) {
        alert('出力するシフトデータがありません');
        return;
      }
      
      try {
        exportWeeklyShiftToExcel(shiftData, staffList);
      } catch (err) {
        console.error('Excel出力エラー:', err);
        alert('Excel出力に失敗しました');
      }
    } else {
      if (monthShiftsData.length === 0) {
        alert('出力するシフトデータがありません');
        return;
      }
      
      try {
        exportMonthlyShiftToExcel(monthShiftsData, staffList, currentMonth);
      } catch (err) {
        console.error('Excel出力エラー:', err);
        alert('Excel出力に失敗しました');
      }
    }
  };

  // スタッフ一覧を読み込み
  const loadStaffList = useCallback(async () => {
    try {
      const staff = await StaffService.getAllStaff();
      setStaffList(staff);
    } catch (err) {
      console.error('スタッフ一覧読み込みエラー:', err);
      // エラーでもシフト表示は続行
    }
  }, []);

  // 初回スタッフ読み込み
  useEffect(() => {
    loadStaffList();
  }, [loadStaffList]);

  return (
    <div className="container mx-auto px-4 py-6">
      {/* ヘッダー */}
      <ShiftPageHeader
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        onExportExcel={handleExportExcel}
        onAutoOptimize={handleAutoOptimize}
        optimizationLoading={optimizationLoading}
      />

      {/* 期間選択コントロール */}
      <PeriodControls
        viewMode={viewMode}
        currentWeekStart={currentWeekStart}
        currentMonth={currentMonth}
        onWeekChange={handleWeekChange}
        onMonthChange={handleMonthChange}
      />

      {/* エラー表示 */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* ローディング表示 */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="text-lg text-gray-600">読み込み中...</div>
        </div>
      )}

      {/* シフトカレンダー */}
      {!loading && (
        <div className="mb-4">
          {viewMode === 'week' ? (
            <WeeklyCalendar
              weekStartDate={currentWeekStart}
              shiftData={shiftData}
              onCellClick={handleCellClick}
              readOnly={false}
            />
          ) : (
            <MonthlyCalendar
              month={currentMonth}
              shiftsData={monthShiftsData}
              onDateClick={handleDateClick}
              readOnly={false}
            />
          )}
        </div>
      )}

      {/* シフト統計情報 */}
      {(viewMode === 'week' ? shiftData : monthShiftsData.length > 0) && (
        <ShiftStatistics
          viewMode={viewMode}
          shiftData={shiftData}
          monthShiftsData={monthShiftsData}
          onViewModeChange={setViewMode}
        />
      )}

      {/* スタッフ配置モーダル */}
      {showAssignmentModal && selectedCell && (
        <StaffAssignmentModal
          isOpen={showAssignmentModal}
          onClose={() => setShowAssignmentModal(false)}
          date={selectedCell.date}
          shiftType={selectedCell.shiftType}
          assignedStaffIds={getCurrentAssignedStaffIds()}
          onAssignmentChange={handleAssignmentChange}
        />
      )}
    </div>
  );
}

 