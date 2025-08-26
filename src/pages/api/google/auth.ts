import type { APIRoute } from 'astro';
import { CALENDAR_SCOPES, createOAuthClient } from '../../../utils/google';

export const GET: APIRoute = async () => {
  try {
    const oauth2Client = createOAuthClient();
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: CALENDAR_SCOPES,
      prompt: 'consent',
    });
    return new Response(null, { status: 302, headers: { Location: url } });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to start OAuth' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};


