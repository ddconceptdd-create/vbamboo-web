import { NextResponse } from 'next/server';

/**
 * Sign-in for the content editor at /admin (Decap CMS, GitHub backend).
 *
 * The editor opens this address in a pop-up; we send the person to GitHub to
 * approve, and GitHub returns to /api/decap/callback. Needs two Vercel
 * environment variables from a GitHub OAuth App (see docs/HUONG-DAN-CMS.md):
 *   GITHUB_OAUTH_CLIENT_ID, GITHUB_OAUTH_CLIENT_SECRET
 */
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  if (!clientId) {
    return new NextResponse('GITHUB_OAUTH_CLIENT_ID is not set on this deployment.', { status: 500 });
  }
  const url = new URL(req.url);
  const scope = url.searchParams.get('scope') === 'public_repo' ? 'public_repo' : 'repo';
  const state = crypto.randomUUID();
  const authorize = new URL('https://github.com/login/oauth/authorize');
  authorize.searchParams.set('client_id', clientId);
  authorize.searchParams.set('redirect_uri', `${url.origin}/api/decap/callback`);
  authorize.searchParams.set('scope', scope);
  authorize.searchParams.set('state', state);

  const res = NextResponse.redirect(authorize.toString());
  res.cookies.set('decap_oauth_state', state, {
    httpOnly: true,
    secure: url.protocol === 'https:',
    sameSite: 'lax',
    path: '/api/decap',
    maxAge: 600,
  });
  return res;
}
