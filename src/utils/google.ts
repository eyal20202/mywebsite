import { google, calendar_v3 } from 'googleapis';

const requiredEnvVars = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
];

function assertEnv() {
  for (const key of requiredEnvVars) {
    if (!(import.meta as any).env[key]) {
      throw new Error(`Missing required env var: ${key}`);
    }
  }
}

export function createOAuthClient() {
  assertEnv();
  const clientId = (import.meta as any).env.GOOGLE_CLIENT_ID as string;
  const clientSecret = (import.meta as any).env.GOOGLE_CLIENT_SECRET as string;
  const redirectUri = ((import.meta as any).env.GOOGLE_REDIRECT_URI as string) || 'http://localhost:4321/api/google/callback';

  return new google.auth.OAuth2({
    clientId,
    clientSecret,
    redirectUri,
  });
}

export function getAuthorizedOAuthClient() {
  const oauth2Client = createOAuthClient();
  const refreshToken = (import.meta as any).env.GOOGLE_REFRESH_TOKEN as string | undefined;
  if (refreshToken) {
    oauth2Client.setCredentials({ refresh_token: refreshToken });
  }
  return oauth2Client;
}

export function getCalendarClient(auth?: any): calendar_v3.Calendar {
  const oauthClient = auth ?? getAuthorizedOAuthClient();
  return google.calendar({ version: 'v3', auth: oauthClient });
}

export const DEFAULT_TIMEZONE = ((import.meta as any).env.TIMEZONE as string) || 'UTC';
export const DEFAULT_CALENDAR_ID = ((import.meta as any).env.GOOGLE_CALENDAR_ID as string) || 'primary';

export const CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/userinfo.email',
];


