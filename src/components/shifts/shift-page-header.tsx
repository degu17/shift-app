'use client';

/**
 * シフトページヘッダーのプロパティ
 */
interface ShiftPageHeaderProps {
  viewMode: 'week' | 'month';
  onViewModeChange: (mode: 'week' | 'month') => void;
  onExportExcel?: () => void;
  onAutoOptimize?: () => void;
  optimizationLoading?: boolean;
}

/**
 * シフトページヘッダーコンポーネント
 * 表示切り替えボタンとアクションボタンを含む
 */
export default function ShiftPageHeader({
  viewMode,
  onViewModeChange,
  onExportExcel,
  onAutoOptimize,
  optimizationLoading = false
}: ShiftPageHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">シフト作成</h1>
        <p className="text-gray-600 mt-1">
          テスト用のため、休み希望などは反映されません。
        </p>
      </div>
      
      <div className="flex space-x-3">
        {/* 表示切り替えボタン */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => onViewModeChange('week')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              viewMode === 'week'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            週表示
          </button>
          <button
            onClick={() => onViewModeChange('month')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              viewMode === 'month'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            月表示
          </button>
        </div>
        
        {/* Excel出力ボタン */}
        <button 
          onClick={onExportExcel}
          className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 transition-colors"
        >
          Excel出力
        </button>

        {viewMode === 'week' && (
          <button 
            onClick={onAutoOptimize}
            disabled={optimizationLoading}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {optimizationLoading && (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {optimizationLoading ? '最適化中...' : '自動最適化'}
          </button>
        )}
      </div>
    </div>
  );
} 