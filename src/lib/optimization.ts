import type { WeeklyShift, Staff, ShiftAssignment, ConstraintViolation } from './types';
import { formatDateToString } from './utils/date-utils';

/**
 * シフト最適化エンジン
 * Phase 1-2: 基本配置と制約最適化を実装
 */
export class ShiftOptimizationEngine {
  private staff: Staff[];
  private weekStartDate: string;

  constructor(staff: Staff[], weekStartDate: string) {
    this.staff = staff.filter(s => s.isActive); // アクティブなスタッフのみ
    this.weekStartDate = weekStartDate;
  }

  /**
   * Phase 1: 基本配置アルゴリズム
   * 1. 休み希望のスタッフを除外
   * 2. 最低人数配置
   * 3. 勤務可能性チェック
   * 4. 基本的な均等配分
   */
  phase1_basicAssignment(): WeeklyShift {
    const assignments: ShiftAssignment[] = [];
    const weekStart = new Date(this.weekStartDate);

    // 1週間分のシフトを生成
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dateString = formatDateToString(date);  // 日本時間ベースの日付文字列に変換

      // その日に利用可能なスタッフを取得（休み希望除外）
      const availableStaff = this.getAvailableStaff(dateString);

      assignments.push({
        date: dateString,
        shifts: {
          day: this.assignStaffToShift(availableStaff, 'day', 6),
          evening: this.assignStaffToShift(availableStaff, 'evening', 2),
          night: this.assignStaffToShift(availableStaff, 'night', 2)
        }
      });
    }

    return {
      id: `temp-${Date.now()}`,
      weekStartDate: this.weekStartDate,
      status: 'optimizing',
      assignments,
      optimizationHistory: [{
        phase: 'basic',
        timestamp: new Date(),
        changes: [],
        score: 0,
        constraints_violations: []
      }],
      createdBy: 'optimization-engine',
      createdAt: new Date(),
      lastModified: new Date()
    };
  }

  /**
   * Phase 2: 制約最適化アルゴリズム
   * 1. 連勤制限チェック
   * 2. 均等配分の調整
   * 3. 経験レベルのバランス
   */
  phase2_constraintOptimization(shiftData: WeeklyShift): WeeklyShift {
    const optimizedShift = { ...shiftData };

    // 連勤制限チェックと調整
    this.adjustConsecutiveWorkdays();

    // 経験レベルのバランス調整
    this.balanceExperienceLevels();

    // 最適化履歴に追加
    optimizedShift.optimizationHistory.push({
      phase: 'constraint',
      timestamp: new Date(),
      changes: [],
      score: this.calculateOptimizationScore(optimizedShift),
      constraints_violations: this.validateConstraints(optimizedShift)
    });

    return optimizedShift;
  }

  /**
   * 指定日に利用可能なスタッフを取得（休み希望を除外）
   */
  private getAvailableStaff(date: string): Staff[] {
    return this.staff.filter(staff => {
      // 休み希望日をチェック
      if (staff.unavailableDates && staff.unavailableDates.includes(date)) {
        return false;
      }
      return true;
    });
  }

  /**
   * 指定されたシフトタイプに対してスタッフを配置
   */
  private assignStaffToShift(
    availableStaff: Staff[], 
    shiftType: 'day' | 'evening' | 'night', 
    requiredCount: number
  ): string[] {
    // そのシフトに勤務可能なスタッフをフィルタ
    const eligibleStaff = availableStaff.filter(staff => 
      staff.availableShifts.includes(shiftType)
    );

    // 経験レベル順でソート（バランスを考慮）
    const sortedStaff = this.sortStaffByExperience(eligibleStaff);

    // 必要人数分のスタッフを選択
    return sortedStaff
      .slice(0, Math.min(requiredCount, sortedStaff.length))
      .map(staff => staff.id);
  }

  /**
   * 経験レベル順でスタッフをソート
   */
  private sortStaffByExperience(staff: Staff[]): Staff[] {
    const experienceOrder = { 'senior': 3, 'mid': 2, 'junior': 1 };
    
    return [...staff].sort((a, b) => {
      // 経験レベルの高い順、同レベルなら名前順
      const scoreA = experienceOrder[a.experienceLevel];
      const scoreB = experienceOrder[b.experienceLevel];
      
      if (scoreA !== scoreB) {
        return scoreB - scoreA; // 降順
      }
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * 連勤制限の調整
   */
  private adjustConsecutiveWorkdays(): void {
    // TODO: 連勤制限ロジックの実装
    // 現在はシンプルな実装として省略
  }

  /**
   * 経験レベルのバランス調整
   */
  private balanceExperienceLevels(): void {
    // TODO: 経験レベルバランスロジックの実装
    // 各シフトに最低1名のシニアレベルを配置など
  }

  /**
   * 最適化スコアの計算
   */
  public calculateOptimizationScore(shiftData: WeeklyShift): number {
    let score = 100;
    const violations = this.validateConstraints(shiftData);
    
    // 制約違反1件につき10点減点
    score -= violations.length * 10;
    
    return Math.max(0, score);
  }

  /**
   * 制約違反の検証
   */
  public validateConstraints(shiftData: WeeklyShift): ConstraintViolation[] {
    const violations: ConstraintViolation[] = [];

    shiftData.assignments.forEach(assignment => {
      // 最低人数チェック
      if (assignment.shifts.day.length < 6) {
        violations.push({
          type: 'basic',
          rule: '日勤最低人数',
          severity: 'error',
          affectedStaff: [],
          affectedDates: [assignment.date],
          message: `日勤の人数が不足しています (${assignment.shifts.day.length}/6)`
        });
      }

      if (assignment.shifts.evening.length < 2) {
        violations.push({
          type: 'basic',
          rule: '準夜最低人数',
          severity: 'error',
          affectedStaff: [],
          affectedDates: [assignment.date],
          message: `準夜の人数が不足しています (${assignment.shifts.evening.length}/2)`
        });
      }

      if (assignment.shifts.night.length < 2) {
        violations.push({
          type: 'basic',
          rule: '深夜最低人数',
          severity: 'error',
          affectedStaff: [],
          affectedDates: [assignment.date],
          message: `深夜の人数が不足しています (${assignment.shifts.night.length}/2)`
        });
      }

      // 休み希望違反チェック
      const allAssignedStaff = [
        ...assignment.shifts.day,
        ...assignment.shifts.evening,
        ...assignment.shifts.night
      ];

      allAssignedStaff.forEach(staffId => {
        const staff = this.staff.find(s => s.id === staffId);
        if (staff?.unavailableDates?.includes(assignment.date)) {
          violations.push({
            type: 'basic',
            rule: '休み希望違反',
            severity: 'error',
            affectedStaff: [staffId],
            affectedDates: [assignment.date],
            message: `${staff.name}さんの休み希望日に配置されています`
          });
        }
      });
    });

    return violations;
  }

  /**
   * 完全な最適化実行
   */
  public optimize(): WeeklyShift {
    console.log('Phase 1: 基本配置開始');
    const basicShift = this.phase1_basicAssignment();
    
    console.log('Phase 2: 制約最適化開始');
    const optimizedShift = this.phase2_constraintOptimization(basicShift);
    
    console.log('最適化完了');
    return optimizedShift;
  }


}

/**
 * 最適化エンジンのファクトリー関数
 */
export function createOptimizationEngine(staff: Staff[], weekStartDate: string): ShiftOptimizationEngine {
  return new ShiftOptimizationEngine(staff, weekStartDate);
} 