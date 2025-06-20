import { NextRequest, NextResponse } from 'next/server';
import { StaffService } from '@/lib/firestore';
import { ShiftOptimizationEngine } from '@/lib/optimization';
import type { WeeklyShift, ShiftAssignment } from '@/lib/types';

/**
 * 最適化リクエストの型定義
 */
interface OptimizationRequest {
  weekStartDate: string;
  currentAssignments?: ShiftAssignment[];
}

/**
 * 最適化レスポンスの型定義
 */
interface OptimizationResponse {
  success: boolean;
  data?: WeeklyShift;
  error?: string;
  message?: string;
}

/**
 * シフト最適化API
 * POST /api/optimization
 */
export async function POST(request: NextRequest): Promise<NextResponse<OptimizationResponse>> {
  try {
    // リクエストボディを解析
    const body: OptimizationRequest = await request.json();
    const { weekStartDate, currentAssignments } = body;

    // バリデーション
    if (!weekStartDate) {
      return NextResponse.json(
        {
          success: false,
          error: 'validation_error',
          message: '週の開始日が指定されていません'
        },
        { status: 400 }
      );
    }

    // 日付形式の検証
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(weekStartDate)) {
      return NextResponse.json(
        {
          success: false,
          error: 'validation_error',
          message: '日付の形式が正しくありません (YYYY-MM-DD)'
        },
        { status: 400 }
      );
    }

    console.log(`最適化開始: ${weekStartDate}`);

    // アクティブなスタッフ一覧を取得
    const activeStaff = await StaffService.getActiveStaff();
    
    if (activeStaff.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'no_staff',
          message: 'アクティブなスタッフが存在しません'
        },
        { status: 400 }
      );
    }

    console.log(`取得したスタッフ数: ${activeStaff.length}`);

    // 最適化エンジンを初期化
    const optimizer = new ShiftOptimizationEngine(activeStaff, weekStartDate);

    // Phase 1: 基本配置
    console.log('Phase 1: 基本配置を実行中...');
    const basicShift = optimizer.phase1_basicAssignment();

    // 既存の配置がある場合は考慮（今後の拡張用）
    if (currentAssignments && currentAssignments.length > 0) {
      // TODO: 既存配置を初期値として設定するロジック
      console.log('既存の配置を考慮します（未実装）');
    }

    // Phase 2: 制約最適化
    console.log('Phase 2: 制約最適化を実行中...');
    const optimizedShift = optimizer.phase2_constraintOptimization(basicShift);

    // 最適化スコアを計算
    const finalScore = optimizer.calculateOptimizationScore(optimizedShift);
    const violations = optimizer.validateConstraints(optimizedShift);

    console.log(`最適化完了 - スコア: ${finalScore}, 制約違反: ${violations.length}件`);

    // レスポンスを返却
    return NextResponse.json(
      {
        success: true,
        data: optimizedShift,
        message: `最適化が完了しました (スコア: ${finalScore}, 制約違反: ${violations.length}件)`
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('最適化API エラー:', error);
    
    // エラーの種類に応じた適切なレスポンス
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          success: false,
          error: 'invalid_json',
          message: 'リクエストボディのJSON形式が正しくありません'
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'internal_error',
        message: '最適化処理中にエラーが発生しました'
      },
      { status: 500 }
    );
  }
}

/**
 * GET要求のハンドラー（情報提供用）
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      message: 'シフト最適化API',
      version: '1.0.0',
      methods: ['POST'],
      description: 'POST /api/optimization でシフトの最適化を実行できます',
      parameters: {
        weekStartDate: 'string (YYYY-MM-DD形式)',
        currentAssignments: 'ShiftAssignment[] (オプション)'
      }
    },
    { status: 200 }
  );
} 