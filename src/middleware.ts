import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * 認証ミドルウェア
 * 保護されたルートへのアクセス制御を行う
 */
export function middleware(request: NextRequest) {
  // 認証が不要なパブリックパス
  const publicPaths = ['/login', '/'];
  
  const { pathname } = request.nextUrl;
  
  // パブリックパスの場合はそのまま通す
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }
  
  // TODO: Firebase Authenticationでのトークン検証
  // 現在は開発段階のため、認証チェックは無効化
  
  return NextResponse.next();
}

/**
 * ミドルウェアが適用されるパスの設定
 */
export const config = {
  matcher: [
    /*
     * 以下のパス以外の全てのリクエストに適用:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 