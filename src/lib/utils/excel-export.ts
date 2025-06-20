import * as XLSX from 'xlsx';
import type { Staff, WeeklyShift, ShiftAssignment } from '@/lib/types';
import { formatDateToString } from '@/lib/utils/date-utils';

/**
 * スタッフ一覧をExcelファイルとして出力する
 * @param staffList スタッフ一覧データ
 */
export const exportStaffToExcel = (staffList: Staff[]) => {
  // データの変換
  const data = staffList.map(staff => ({
    '名前': staff.name,
    '勤務可能シフト': getShiftText(staff.availableShifts),
    '職種': staff.skills.join('、'),
    '経験レベル': getExperienceText(staff.experienceLevel),
    '状態': staff.isActive ? 'アクティブ' : '無効',
  }));

  // ワークシートの作成
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // ワークブックの作成
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'スタッフ一覧');

  // ファイル名の生成（現在の日付を含む）
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD形式
  const fileName = `職員一覧_${dateStr}.xlsx`;

  // ファイルのダウンロード
  XLSX.writeFile(workbook, fileName);
};

/**
 * 週次シフト表をExcelファイルとして出力する
 * @param shiftData 週次シフトデータ
 * @param staffList スタッフ一覧（名前変換用）
 */
export const exportWeeklyShiftToExcel = (shiftData: WeeklyShift, staffList: Staff[] = []) => {
  // スタッフIDから名前への変換マップを作成
  const staffNameMap = new Map(staffList.map(staff => [staff.id, staff.name]));
  
  // 週の日付を生成
  const weekStart = new Date(shiftData.weekStartDate);
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    dates.push(date);
  }

  // 全スタッフのリストを作成（シフトに配属されているスタッフ）
  const allStaffIds = new Set<string>();
  shiftData.assignments.forEach(assignment => {
    Object.values(assignment.shifts).forEach(staffIds => {
      staffIds.forEach(id => allStaffIds.add(id));
    });
  });
  
  const sortedStaffIds = Array.from(allStaffIds).sort();

  // Excel用のデータを作成
  const data = [];
  
  // ヘッダー行
  const headerRow = ['スタッフ名', ...dates.map(date => formatDateForHeader(date))];
  data.push(headerRow);

  // 各スタッフの行を作成
  sortedStaffIds.forEach(staffId => {
    const staffName = staffNameMap.get(staffId) || staffId;
    const row = [staffName];
    
    dates.forEach(date => {
      const dateString = formatDateToString(date);
      const assignment = shiftData.assignments.find(a => a.date === dateString);
      
      let shiftDisplay = '';
      if (assignment) {
        // そのスタッフがどのシフトに入っているかチェック
        if (assignment.shifts.day.includes(staffId)) {
          shiftDisplay += '日';
        }
        if (assignment.shifts.evening.includes(staffId)) {
          shiftDisplay += '準';
        }
        if (assignment.shifts.night.includes(staffId)) {
          shiftDisplay += '深';
        }
      }
      
      row.push(shiftDisplay);
    });
    
    data.push(row);
  });

  // ワークシートの作成
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  
  // セルの幅を調整
  const columnWidths = [
    { wch: 15 }, // スタッフ名列
    ...dates.map(() => ({ wch: 10 })) // 日付列
  ];
  worksheet['!cols'] = columnWidths;

  // 行に背景色を設定
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  
  // 各スタッフ行に交互に背景色を設定
  for (let rowNum = 1; rowNum <= range.e.r; rowNum++) { // ヘッダー行（0行目）をスキップ
    const isEvenRow = (rowNum - 1) % 2 === 0;
    const bgColor = isEvenRow ? 'F8F9FA' : 'FFFFFF'; // 薄いグレーと白を交互に
    
    for (let colNum = range.s.c; colNum <= range.e.c; colNum++) {
      const cellAddress = XLSX.utils.encode_cell({ r: rowNum, c: colNum });
      if (!worksheet[cellAddress]) continue;
      
      if (!worksheet[cellAddress].s) {
        worksheet[cellAddress].s = {};
      }
      
      worksheet[cellAddress].s.fill = {
        fgColor: { rgb: bgColor }
      };
      
      // 文字色を黒に設定（読みやすさのため）
      worksheet[cellAddress].s.font = {
        color: { rgb: '000000' }
      };
    }
  }

  // ヘッダー行に特別なスタイルを適用
  for (let colNum = range.s.c; colNum <= range.e.c; colNum++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: colNum });
    if (!worksheet[cellAddress]) continue;
    
    if (!worksheet[cellAddress].s) {
      worksheet[cellAddress].s = {};
    }
    
    worksheet[cellAddress].s.fill = {
      fgColor: { rgb: 'E3F2FD' } // 薄い青色
    };
    
    worksheet[cellAddress].s.font = {
      bold: true,
      color: { rgb: '000000' }
    };
  }

  // ワークブックの作成
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'シフト表');

  // ファイル名の生成
  const weekStartStr = formatDateForFilename(weekStart);
  const fileName = `シフト表_${weekStartStr}.xlsx`;

  // ファイルのダウンロード
  XLSX.writeFile(workbook, fileName);
};

/**
 * 月次シフト表をExcelファイルとして出力する
 * @param monthShiftsData 月次シフトデータ
 * @param staffList スタッフ一覧（名前変換用）
 * @param month 対象月
 */
export const exportMonthlyShiftToExcel = (monthShiftsData: WeeklyShift[], staffList: Staff[] = [], month: Date) => {
  // デバッグログ追加
  console.log('=== 月次Excel出力開始 ===');
  console.log('monthShiftsData:', monthShiftsData);
  console.log('monthShiftsData.length:', monthShiftsData.length);
  console.log('staffList.length:', staffList.length);
  
  // スタッフIDから名前への変換マップを作成
  const staffNameMap = new Map(staffList.map(staff => [staff.id, staff.name]));
  
  // 月の全日付を取得
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const dates: Date[] = [];
  
  for (let date = new Date(monthStart); date <= monthEnd; date.setDate(date.getDate() + 1)) {
    dates.push(new Date(date));
  }

  // 全シフトデータをまとめる
  const allAssignments = new Map<string, ShiftAssignment>();
  monthShiftsData.forEach(weekShift => {
    weekShift.assignments.forEach(assignment => {
      allAssignments.set(assignment.date, assignment);
    });
  });

  console.log('allAssignments.size:', allAssignments.size);

  // 全スタッフのリストを作成（月内のシフトに配属されているスタッフ）
  const allStaffIds = new Set<string>();
  monthShiftsData.forEach(weekShift => {
    weekShift.assignments.forEach(assignment => {
      if (assignment.shifts) {
        Object.values(assignment.shifts).forEach(staffIds => {
          staffIds.forEach(id => allStaffIds.add(id));
        });
      }
    });
  });
  
  const sortedStaffIds = Array.from(allStaffIds).sort();
  console.log('sortedStaffIds:', sortedStaffIds);

  // データが空の場合は警告メッセージを含むExcelを出力
  if (sortedStaffIds.length === 0) {
    console.warn('月次データにスタッフ配置が見つかりません');
    const data = [
      ['⚠️ 警告', '該当月にシフトデータが見つかりませんでした'],
      ['対象月', `${month.getFullYear()}年${month.getMonth() + 1}月`],
      ['取得データ数', `${monthShiftsData.length}件`]
    ];
    
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'データなし');
    const monthStr = `${month.getFullYear()}年${month.getMonth() + 1}月`;
    const fileName = `シフト表_${monthStr}_データなし.xlsx`;
    XLSX.writeFile(workbook, fileName);
    return;
  }

  // Excel用のデータを作成
  const data = [];
  
  // ヘッダー行
  const headerRow = ['スタッフ名', ...dates.map(date => formatDateForHeader(date))];
  data.push(headerRow);

  // 各スタッフの行を作成
  sortedStaffIds.forEach(staffId => {
    const staffName = staffNameMap.get(staffId) || staffId;
    const row = [staffName];
    
    dates.forEach(date => {
      const dateString = formatDateToString(date);
      const assignment = allAssignments.get(dateString);
      
      let shiftDisplay = '';
      if (assignment && assignment.shifts) {
        // そのスタッフがどのシフトに入っているかチェック
        if (assignment.shifts.day.includes(staffId)) {
          shiftDisplay += '日';
        }
        if (assignment.shifts.evening.includes(staffId)) {
          shiftDisplay += '準';
        }
        if (assignment.shifts.night.includes(staffId)) {
          shiftDisplay += '深';
        }
      }
      
      row.push(shiftDisplay);
    });
    
    data.push(row);
  });

  // ワークシートの作成
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  
  // セルの幅を調整
  const columnWidths = [
    { wch: 15 }, // スタッフ名列
    ...dates.map(() => ({ wch: 8 })) // 日付列（月次は列数が多いのでやや狭く）
  ];
  worksheet['!cols'] = columnWidths;

  // 行に背景色を設定
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  
  // 各スタッフ行に交互に背景色を設定
  for (let rowNum = 1; rowNum <= range.e.r; rowNum++) { // ヘッダー行（0行目）をスキップ
    const isEvenRow = (rowNum - 1) % 2 === 0;
    const bgColor = isEvenRow ? 'F8F9FA' : 'FFFFFF'; // 薄いグレーと白を交互に
    
    for (let colNum = range.s.c; colNum <= range.e.c; colNum++) {
      const cellAddress = XLSX.utils.encode_cell({ r: rowNum, c: colNum });
      if (!worksheet[cellAddress]) continue;
      
      if (!worksheet[cellAddress].s) {
        worksheet[cellAddress].s = {};
      }
      
      worksheet[cellAddress].s.fill = {
        fgColor: { rgb: bgColor }
      };
      
      // 文字色を黒に設定（読みやすさのため）
      worksheet[cellAddress].s.font = {
        color: { rgb: '000000' }
      };
    }
  }

  // ヘッダー行に特別なスタイルを適用
  for (let colNum = range.s.c; colNum <= range.e.c; colNum++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: colNum });
    if (!worksheet[cellAddress]) continue;
    
    if (!worksheet[cellAddress].s) {
      worksheet[cellAddress].s = {};
    }
    
    worksheet[cellAddress].s.fill = {
      fgColor: { rgb: 'E3F2FD' } // 薄い青色
    };
    
    worksheet[cellAddress].s.font = {
      bold: true,
      color: { rgb: '000000' }
    };
  }

  // ワークブックの作成
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'シフト表');

  // ファイル名の生成
  const monthStr = `${month.getFullYear()}年${month.getMonth() + 1}月`;
  const fileName = `シフト表_${monthStr}.xlsx`;

  // ファイルのダウンロード
  XLSX.writeFile(workbook, fileName);
};

/**
 * 勤務可能シフトの表示文字列を生成
 */
const getShiftText = (shifts: string[]) => {
  const shiftMap = {
    day: '日勤',
    evening: '準夜',
    night: '深夜'
  };
  return shifts.map(shift => shiftMap[shift as keyof typeof shiftMap]).join('、');
};

/**
 * 経験レベルの表示文字列を生成
 */
const getExperienceText = (level: string) => {
  const levelMap = {
    junior: '新人',
    mid: '中堅',
    senior: 'シニア'
  };
  return levelMap[level as keyof typeof levelMap] || level;
};

/**
 * 日付をヘッダー用にフォーマット
 */
const formatDateForHeader = (date: Date): string => {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
  return `${month}/${day}(${dayOfWeek})`;
};

/**
 * 日付をファイル名用にフォーマット
 */
const formatDateForFilename = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}; 