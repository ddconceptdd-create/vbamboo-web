import { NextResponse, type NextRequest } from 'next/server';

const LOCALES = ['vi', 'en'];
const DEFAULT_LOCALE = 'vi';

/** Sends any address without a language prefix to the Vietnamese version. */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const first = pathname.split('/')[1];
  if (LOCALES.includes(first)) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = `/${DEFAULT_LOCALE}${pathname === '/' ? '' : pathname}`;
  url.search = search;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!api|keystatic|_next|brand|images|downloads|icon|apple-icon|favicon|robots.txt|sitemap.xml|.*\\..*).*)'],
};
