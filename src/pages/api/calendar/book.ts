import type { APIRoute } from 'astro';
import { getCalendarClient, DEFAULT_CALENDAR_ID, DEFAULT_TIMEZONE } from '../../../utils/google';

type BookRequest = {
  name: string;
  email: string;
  start: string; // ISO
  durationMinutes?: number;
  notes?: string;
};

export const POST: APIRoute = async ({ request }) => {
  try {
    if (!import.meta.env.GOOGLE_CLIENT_ID || !import.meta.env.GOOGLE_CLIENT_SECRET) {
      return new Response(JSON.stringify({ ok: false, message: 'development: calendar not configured yet' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    const { name, email, start, durationMinutes = 30, notes }: BookRequest = await request.json();
    if (!name || !email || !start) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const startDate = new Date(start);
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);

    const calendar = getCalendarClient();
    const created = await calendar.events.insert({
      calendarId: DEFAULT_CALENDAR_ID,
      conferenceDataVersion: 1,
      requestBody: {
        summary: `Meeting with ${name}`,
        description: notes ?? undefined,
        start: { dateTime: startDate.toISOString(), timeZone: DEFAULT_TIMEZONE },
        end: { dateTime: endDate.toISOString(), timeZone: DEFAULT_TIMEZONE },
        attendees: [{ email, displayName: name }],
        reminders: { useDefault: true },
        conferenceData: {
          createRequest: {
            requestId: `meet-${Date.now()}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        },
      },
    });

    return new Response(
      JSON.stringify({ id: created.data.id, htmlLink: created.data.htmlLink, hangoutLink: (created.data as any).hangoutLink ?? null }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to create event', development: true }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};


