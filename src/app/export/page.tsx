/**
 * Excel出力ページ
 * 実装説明を表示するシンプルなページ
 */
export default function ExportPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Excel出力
          </h1>
        </div>

        {/* メインコンテンツ */}
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="max-w-2xl mx-auto">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            
            <p className="text-lg text-gray-600 leading-relaxed">
              実際の実装では、設定等を実装可能です。<br />
              現在はシフト作成、スタッフ管理から使用できます。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 