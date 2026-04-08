import { lineworksFetch } from "../lineworks/client";

interface CalendarEvent {
  eventId: string;
  summary: string;
  start: { dateTime: string };
  end: { dateTime: string };
  location?: string;
}

interface EventListResponse {
  events: CalendarEvent[];
}

export async function getCalendar(
  userId: string,
  date: string,
): Promise<string> {
  const fromDateTime = `${date}T00:00:00+09:00`;
  const untilDateTime = `${date}T23:59:59+09:00`;

  const params = new URLSearchParams({ fromDateTime, untilDateTime });
  const res = await lineworksFetch(
    `/users/${userId}/calendar/events?${params.toString()}`,
  );
  const data: EventListResponse = await res.json();

  const events = data.events ?? [];

  if (events.length === 0) {
    return `${date} の予定はありません。`;
  }

  return events
    .sort(
      (a, b) =>
        new Date(a.start.dateTime).getTime() -
        new Date(b.start.dateTime).getTime(),
    )
    .map((e) => {
      const start = new Date(e.start.dateTime).toLocaleTimeString("ja-JP", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const end = new Date(e.end.dateTime).toLocaleTimeString("ja-JP", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const location = e.location ? ` @ ${e.location}` : "";
      return `- ${start}〜${end} ${e.summary}${location}`;
    })
    .join("\n");
}

export async function checkFreeTime(
  userId: string,
  date: string,
  startHour: number,
  endHour: number,
): Promise<string> {
  const fromDateTime = `${date}T${String(startHour).padStart(2, "0")}:00:00+09:00`;
  const untilDateTime = `${date}T${String(endHour).padStart(2, "0")}:00:00+09:00`;

  const params = new URLSearchParams({ fromDateTime, untilDateTime });
  const res = await lineworksFetch(
    `/users/${userId}/calendar/events?${params.toString()}`,
  );
  const data: EventListResponse = await res.json();

  const events = data.events ?? [];

  if (events.length === 0) {
    return `${date} の ${startHour}時〜${endHour}時は空いています。`;
  }

  const eventList = events
    .map((e) => {
      const start = new Date(e.start.dateTime).toLocaleTimeString("ja-JP", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const end = new Date(e.end.dateTime).toLocaleTimeString("ja-JP", {
        hour: "2-digit",
        minute: "2-digit",
      });
      return `${start}〜${end} ${e.summary}`;
    })
    .join("、");

  return `${date} の ${startHour}時〜${endHour}時には以下の予定があります: ${eventList}`;
}
