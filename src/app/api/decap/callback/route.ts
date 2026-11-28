import { NextResponse } from 'next/server';

/**
 * GitHub returns here after the person approves the content editor. We swap
 * the one-time code for an access token and hand it to the /admin window that
 * opened the pop-up, using the message format Decap CMS expects.
 */
export const dynamic = 'force-dynamic';

const page = (status: 'success' | 'error', content: unknown, origin: string) => {
  const message = `authorization:github:${status}:${JSON.stringify(content)}`;
  // The token is only posted to the /admin page of this same site.
  return `<!doctype html><html><head><meta charset="utf-8"><title>VBamboo</title></head><body>
<p>${status === 'success' ? 'Đã đăng nhập, cửa sổ này sẽ tự đóng…' : 'Đăng nhập không thành công. Hãy đóng cửa sổ và thử lại.'}</p>
<script>
(function () {
  var origin = ${JSON.stringify(origin)};
  var message = ${JSON.stringify(message)};
  function receive(e) {
    if (e.origin !== origin) return;
    window.removeEventListener('message', receive);
    window.opener && window.opener.postMessage(message, origin);
    ${status === 'success' ? 'setTimeout(function () { window.close(); }, 300);' : ''}
  }
  window.addEventListener('message', receive);
  window.opener && window.opener.postMessage('authorizing:github', origin);
})();
</script></body></html>`;
};

const html = (body: string, status = 200) =>
  new NextResponse(body, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });

export async function GET(req: Request) {
  const url = new URL(req.url);
  const origin = url.origin;
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const cookieState = req.headers
    .get('cookie')
    ?.split(/;\s*/)
    .find((c) => c.startsWith('decap_oauth_state='))
    ?.split('=')[1];

  if (!code || !state || !cookieState || state !== cookieState) {
    return html(page('error', { message: 'Invalid sign-in state, please try again.' }, origin), 400);
  }
  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return html(page('error', { message: 'GitHub OAuth is not configured on this deployment.' }, origin), 500);
  }

  try {
    const r = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code, redirect_uri: `${origin}/api/decap/callback` }),
    });
    const data = (await r.json()) as { access_token?: string; error_description?: string };
    if (!data.access_token) {
      return html(page('error', { message: data.error_description || 'GitHub did not return a token.' }, origin), 401);
    }
    const res = html(page('success', { token: data.access_token, provider: 'github' }, origin));
    res.cookies.set('decap_oauth_state', '', { path: '/api/decap', maxAge: 0 });
    return res;
  } catch {
    return html(page('error', { message: 'Could not reach GitHub.' }, origin), 502);
  }
}
