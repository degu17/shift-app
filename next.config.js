/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
  experimental: {
    // 最新機能の有効化
    optimizePackageImports: ['firebase'],
  },
  env: {
    // 環境変数の設定（必要に応じて）
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  // Vercel用の設定
  output: 'standalone',
  // トレイリングスラッシュの設定
  trailingSlash: false,
  // リダイレクト設定
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig; 