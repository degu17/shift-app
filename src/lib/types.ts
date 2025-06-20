/**
 * ユーザー・権限管理
 */
export interface User {
  id: string;
  email: string;
  role: 'admin' | 'staff';
  staffId?: string;  // スタッフ役割の場合のみ
}

/**
 * スタッフ情報
 */
export interface Staff {
  id: string;
  name: string;
  availableShifts: ('day' | 'evening' | 'night')[];  // 日勤・準夜・深夜
  unavailableDates: string[]; // YYYY-MM-DD形式
  skills: string[];           // 職種情報
  experienceLevel: 'junior' | 'mid' | 'senior';
  isActive: boolean;
}

/**
 * 週次シフト（重複防止対応）
 */
export interface WeeklyShift {
  id: string;
  weekStartDate: string; // YYYY-MM-DD
  status: 'optimizing' | 'confirmed';
  assignments: ShiftAssignment[];
  optimizationHistory: OptimizationStep[];
  createdBy: string;
  createdAt: Date;
  lastModified: Date;
}

export interface ShiftAssignment {
  date: string; // YYYY-MM-DD
  shifts: {
    day: string[];      // staffIdの配列
    evening: string[];  // 準夜
    night: string[];    // 深夜
  };
}

/**
 * 多段階最適化アプローチ
 */
export interface OptimizationStep {
  phase: 'basic' | 'constraint' | 'ai' | 'manual';
  timestamp: Date;
  changes: ShiftChange[];
  score: number;
  constraints_violations: ConstraintViolation[];
}

export interface ShiftChange {
  date: string;
  shift: 'day' | 'evening' | 'night';
  from: string[];
  to: string[];
  reason: string;
}

/**
 * 基本制約設定
 */
export interface BasicConstraints {
  minStaffPerShift: {
    day: number;
    evening: number;
    night: number;
  };
  maxConsecutiveDays: number;
  maxWeeklyHours: number;
}

/**
 * 詳細制約設定
 */
export interface DetailedConstraints {
  minRestHoursBetweenShifts: number;
  maxNightShiftsPerMonth: number;
  preferredRestDaysPerWeek: number;
  skillRequirements: {
    shift: 'day' | 'evening' | 'night';
    requiredSkills: string[];
    minExperiencedStaff: number; // シニアレベル以上のスタッフ最小数
  }[];
  
  // 特殊制約
  prohibitedPatterns: string[]; // 例: "night-day", "evening-day"
  mandatoryRestAfterNight: boolean;
  weekendStaffingRules: {
    minStaff: number;
    preferredStaff: string[];
  };
}

/**
 * カスタムルール
 */
export interface CustomRule {
  id: string;
  name: string;
  description: string;
  condition: string;    // 条件式（JavaScript形式）
  action: string;       // 実行アクション
  priority: number;     // 優先度
  isActive: boolean;
}

/**
 * 段階的制約設定
 */
export interface ConstraintWizard {
  basicSettings: BasicConstraints;      // 必須項目
  advancedSettings: DetailedConstraints; // 詳細項目
  customRules: CustomRule[];            // カスタムルール
}

/**
 * 制約違反情報
 */
export interface ConstraintViolation {
  type: 'basic' | 'detailed' | 'custom';
  rule: string;
  severity: 'error' | 'warning' | 'info';
  affectedStaff: string[];
  affectedDates: string[];
  message: string;
}

/**
 * AI使用制限管理
 */
export interface AIUsage {
  userId: string;
  month: string; // YYYY-MM
  usageCount: number;
  maxUsage: number;
} 