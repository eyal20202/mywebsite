import type { APIRoute } from 'astro';
import { getCalendarClient, DEFAULT_CALENDAR_ID, DEFAULT_TIMEZONE } from '../../../utils/google';

type AvailabilityRequest = {
  date?: string; // YYYY-MM-DD
  start?: string; // ISO
  end?: string; // ISO
  durationMinutes?: number; // default 30
  timezone?: string;
  workingHours?: { startHour: number; endHour: number };
};

function toISO(date: Date) {
  return date.toISOString();
}

function generateSlots(
  date: Date,
  busyIntervals: Array<{ start: Date; end: Date }>,
  durationMinutes: number,
  workingHours: { startHour: number; endHour: number }
) {
  const slots: string[] = [];
  const start = new Date(date);
  start.setHours(workingHours.startHour, 0, 0, 0);
  const end = new Date(date);
  end.setHours(workingHours.endHour, 0, 0, 0);

  for (let t = new Date(start); t < end; t = new Date(t.getTime() + durationMinutes * 60000)) {
    const tEnd = new Date(t.getTime() + durationMinutes * 60000);
    const overlapsBusy = busyIntervals.some((b) => t < b.end && tEnd > b.start);
    if (!overlapsBusy && tEnd <= end) {
      slots.push(toISO(t));
    }
  }
  return slots;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    if (!import.meta.env.GOOGLE_CLIENT_ID || !import.meta.env.GOOGLE_CLIENT_SECRET) {
      return new Response(JSON.stringify({ slots: [], message: 'development: calendar not configured yet' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    const body = (await request.json()) as AvailabilityRequest;
    const durationMinutes = body.durationMinutes ?? 30;
    const timezone = body.timezone ?? DEFAULT_TIMEZONE;
    const workingHours = body.workingHours ?? { startHour: 9, endHour: 18 };

    let dayStart: Date;
    let dayEnd: Date;
    if (body.start && body.end) {
      dayStart = new Date(body.start);
      dayEnd = new Date(body.end);
    } else {
      const dateStr = body.date ?? new Date().toISOString().slice(0, 10);
      dayStart = new Date(`${dateStr}T00:00:00`);
      dayEnd = new Date(`${dateStr}T23:59:59`);
    }

    const calendar = getCalendarClient();
    const fb = await calendar.freebusy.query({
      requestBody: {
        timeMin: dayStart.toISOString(),
        timeMax: dayEnd.toISOString(),
        timeZone: timezone,
        items: [{ id: DEFAULT_CALENDAR_ID }],
      },
    });

    const busy = (fb.data.calendars?.[DEFAULT_CALENDAR_ID]?.busy ?? []).map((b) => ({
      start: new Date(b.start!),
      end: new Date(b.end!),
    }));

    // Generate slots for each day in range (support multi-day)
    const slots: string[] = [];
    const current = new Date(dayStart);
    while (current <= dayEnd) {
      slots.push(...generateSlots(current, busy, durationMinutes, workingHours));
      current.setDate(current.getDate() + 1);
    }

    return new Response(JSON.stringify({ slots, timezone }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to fetch availability', development: true }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};


