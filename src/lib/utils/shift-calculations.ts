import type { WeeklyShift } from '@/lib/types';

/**
 * シフトデータから総配置数を計算
 */
export function getTotalAssignments(shiftData: WeeklyShift): number {
  if (!shiftData || !shiftData.assignments) {
    return 0;
  }
  
  return shiftData.assignments.reduce((total, assignment) => {
    // 安全性チェック: assignmentとshiftsが存在することを確認
    if (!assignment || !assignment.shifts) {
      return total;
    }
    
    const dayCount = assignment.shifts.day?.length || 0;
    const eveningCount = assignment.shifts.evening?.length || 0;
    const nightCount = assignment.shifts.night?.length || 0;
    
    return total + dayCount + eveningCount + nightCount;
  }, 0);
}

/**
 * シフトデータから必要人数を計算
 */
export function getRequiredStaff(shiftData: WeeklyShift): number {
  if (!shiftData || !shiftData.assignments) {
    return 0;
  }
  
  let totalRequired = 0;
  
  // 各日のシフトごとに必要人数を計算
  shiftData.assignments.forEach(() => {
    totalRequired += 6; // 日勤
    totalRequired += 2; // 準夜
    totalRequired += 2; // 深夜
  });
  
  return totalRequired;
}

/**
 * シフトデータから未配置枠数を計算
 */
export function getUnassignedSlots(shiftData: WeeklyShift): number {
  const totalRequired = getRequiredStaff(shiftData);
  const totalAssigned = getTotalAssignments(shiftData);
  return Math.max(0, totalRequired - totalAssigned);
}

/**
 * シフトデータから配置率を計算
 */
export function getAssignmentRate(shiftData: WeeklyShift): number {
  const totalRequired = getRequiredStaff(shiftData);
  const totalAssigned = getTotalAssignments(shiftData);
  
  if (totalRequired === 0) return 0;
  
  return Math.round((totalAssigned / totalRequired) * 100);
}

/**
 * 特定のシフトタイプの配置数を計算
 */
export function getShiftAssignments(shiftData: WeeklyShift, shiftType: 'day' | 'evening' | 'night'): number {
  if (!shiftData || !shiftData.assignments) {
    return 0;
  }
  
  return shiftData.assignments.reduce((total, assignment) => {
    if (!assignment || !assignment.shifts || !assignment.shifts[shiftType]) {
      return total;
    }
    return total + assignment.shifts[shiftType].length;
  }, 0);
}

/**
 * 最適化スコアを計算
 */
export function getOptimizationScore(shiftData: WeeklyShift): number {
  if (!shiftData || !shiftData.assignments) {
    return 0;
  }
  
  const assignmentRate = getAssignmentRate(shiftData);
  
  // 基本スコアは配置率をベースに算出
  let score = assignmentRate;
  
  // 人数不足によるペナルティを計算
  let shortageCount = 0;
  shiftData.assignments.forEach((assignment) => {
    if (!assignment || !assignment.shifts) {
      return;
    }
    
    const dayCount = assignment.shifts.day?.length || 0;
    const eveningCount = assignment.shifts.evening?.length || 0;
    const nightCount = assignment.shifts.night?.length || 0;
    
    if (dayCount < 6) shortageCount++;
    if (eveningCount < 2) shortageCount++;
    if (nightCount < 2) shortageCount++;
  });
  
  // 人数不足1件につき5点減点
  score = Math.max(0, score - (shortageCount * 5));
  
  return Math.min(100, Math.round(score));
}

/**
 * 月次の不足数を計算
 */
export function getMonthShortages(shifts: WeeklyShift[], shiftType: 'day' | 'evening' | 'night'): number {
  if (!shifts || shifts.length === 0) {
    return 0;
  }
  
  const requiredPerDay = shiftType === 'day' ? 6 : 2;
  let totalShortage = 0;
  
  shifts.forEach(shift => {
    if (!shift || !shift.assignments) {
      return;
    }
    
    shift.assignments.forEach(assignment => {
      if (!assignment || !assignment.shifts || !assignment.shifts[shiftType]) {
        // シフトデータが存在しない場合は全員不足とみなす
        totalShortage += requiredPerDay;
        return;
      }
      
      const currentCount = assignment.shifts[shiftType].length;
      const shortage = Math.max(0, requiredPerDay - currentCount);
      totalShortage += shortage;
    });
  });
  
  return totalShortage;
} 