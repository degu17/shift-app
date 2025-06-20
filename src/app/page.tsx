import FeatureCard from '@/components/ui/feature-card';

/**
 * メインダッシュボードページ
 * 勤務表作成アプリのホーム画面として機能
 */
export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-8xl mx-auto px-6 py-2">
        {/* ヘッダー */}
        <div className="text-center mb-4 pt-2">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            勤務表作成支援アプリ（テスト用）
          </h1>
          <p className="text-lg text-gray-600">
            ※テスト用のため、一部機能とセキュリティ面は十分な実装をしていません。
          </p>
        </div>

        {/* 機能カード */}
        <div className="flex flex-wrap justify-center gap-8 mb-16">
          {/* スタッフ管理 */}
          <FeatureCard
            href="/staff"
            title="スタッフ管理"
            description="スタッフの登録・編集と勤務可能シフトの設定"
            iconColor="text-blue-600"
            icon={
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
          />

          {/* シフト作成 */}
          <FeatureCard
            href="/shifts"
            title="シフト作成"
            description="AI支援による自動シフト生成と手動調整"
            iconColor="text-green-600"
            icon={
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
          />

          {/* 制約設定 */}
          <FeatureCard
            href="/constraints"
            title="制約設定"
            description="シフト作成の制約とルールの詳細設定"
            iconColor="text-purple-600"
            icon={
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
          />

          {/* Excel出力 */}
          <FeatureCard
            title="Excel出力（拡張用）"
            description="Excel出力の形式の設定を実装可能です"
            iconColor="text-gray-400"
            isDisabled={true}
            icon={
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          />

          {/* 設定（今後の拡張用） */}
          <FeatureCard
            title="高度な設定"
            description="カスタムルールとAI設定（実装予定）"
            iconColor="text-gray-400"
            isDisabled={true}
            icon={
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
          />
        </div>

        {/* フッター情報 */}
        <div className="text-center pt-8 border-t border-gray-200">
          <p className="text-gray-500">
            Version 1.0.0 - Next.js 15.3.3 + TypeScript 5.8.3
          </p>
        </div>
      </div>
    </div>
  );
} 