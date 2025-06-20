'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * メインナビゲーションコンポーネント
 */
export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'ダッシュボード', icon: '🏠' },
    { href: '/staff', label: 'スタッフ管理', icon: '👥' },
    { href: '/shifts', label: 'シフト作成', icon: '📅' },
    { href: '/constraints', label: '制約設定', icon: '⚙️' },
    { href: '/export', label: 'Excel出力', icon: '📊' },
  ];

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            {/* ロゴ */}
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-900">
                勤務表作成支援アプリ
              </Link>
            </div>

            {/* ナビゲーションメニュー */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* 右側のアクション */}
          <div className="flex items-center">
            <button className="bg-gray-100 p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-colors">
              <span className="sr-only">ユーザーメニュー</span>
              <span className="text-sm">ログイン（未実装）</span>
            </button>
          </div>
        </div>
      </div>

      {/* モバイルメニュー */}
      <div className="sm:hidden">
        <div className="pt-2 pb-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
} 