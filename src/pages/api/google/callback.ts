import type { APIRoute } from 'astro';
import { createOAuthClient } from '../../../utils/google';

export const GET: APIRoute = async ({ url }) => {
  try {
    const code = url.searchParams.get('code');
    if (!code) {
      return new Response('Missing code', { status: 400 });
    }
    const client = createOAuthClient();
    const { tokens } = await client.getToken(code);

    // Security note: In a real app, store tokens securely server-side.
    const hasRefresh = !!tokens.refresh_token;
    const message = hasRefresh
      ? 'OAuth success. Copy the refresh token and save as GOOGLE_REFRESH_TOKEN.'
      : 'OAuth success. No refresh token returned. Try again with prompt=consent.';

    return new Response(
      JSON.stringify({
        message,
        refresh_token: tokens.refresh_token ?? null,
        access_token: tokens.access_token ?? null,
        expiry_date: tokens.expiry_date ?? null,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: 'OAuth callback failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};


