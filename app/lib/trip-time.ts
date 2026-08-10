import type { TripEvent, TripSnapshot } from "./trip-types";

const toTaipeiTimestamp = (event: TripEvent, time: string) =>
  Date.parse(`${event.date}T${time}:00+08:00`);

/** 台北時間下的行程開始時間戳。 */
export const getTripEventStartTimestamp = (event: TripEvent) =>
  toTaipeiTimestamp(event, event.startTime);

/** 台北時間下的行程結束時間戳。 */
export const getTripEventEndTimestamp = (event: TripEvent) =>
  toTaipeiTimestamp(event, event.endTime);

/** 依台北時間取得行程目前的階段、進行中項目與下一站。 */
export const resolveTripSnapshot = (
  events: TripEvent[],
  now: Date,
): TripSnapshot => {
  if (events.length === 0) {
    return {
      phase: "trip_complete",
      currentEvents: [],
      nextEvents: [],
      justEndedEvents: [],
      currentEvent: null,
      nextEvent: null,
      justEndedEvent: null,
    };
  }

  const currentTimestamp = now.getTime();

  const currentEvents = events.filter((event) => {
    const startTimestamp = getTripEventStartTimestamp(event);
    const endTimestamp = getTripEventEndTimestamp(event);
    return startTimestamp <= currentTimestamp && currentTimestamp < endTimestamp;
  });

  const upcomingEvents = events.filter(
    (event) => getTripEventStartTimestamp(event) > currentTimestamp,
  );
  const earliestUpcomingStart = upcomingEvents.reduce(
    (earliest, event) =>
      Math.min(earliest, getTripEventStartTimestamp(event)),
    Number.POSITIVE_INFINITY,
  );
  const nextEvents = upcomingEvents.filter(
    (event) => getTripEventStartTimestamp(event) === earliestUpcomingStart,
  );

  const endedEvents = events.filter(
    (event) => getTripEventEndTimestamp(event) <= currentTimestamp,
  );
  const latestEndedTimestamp = endedEvents.reduce(
    (latest, event) => Math.max(latest, getTripEventEndTimestamp(event)),
    Number.NEGATIVE_INFINITY,
  );
  const justEndedEvents = endedEvents.filter(
    (event) => getTripEventEndTimestamp(event) === latestEndedTimestamp,
  );

  const currentEvent = currentEvents[0] ?? null;
  const nextEvent = nextEvents[0] ?? null;
  const justEndedEvent = justEndedEvents[0] ?? null;

  if (currentEvent) {
    return {
      phase: "active",
      currentEvents,
      nextEvents,
      justEndedEvents,
      currentEvent,
      nextEvent,
      justEndedEvent,
    };
  }

  const firstEvent = events[0];
  if (nextEvent && currentTimestamp < getTripEventStartTimestamp(firstEvent)) {
    return {
      phase: "pre_trip",
      currentEvents,
      nextEvents,
      justEndedEvents,
      currentEvent: null,
      nextEvent,
      justEndedEvent,
    };
  }

  if (
    nextEvent &&
    justEndedEvent &&
    nextEvent.date !== justEndedEvent.date
  ) {
    return {
      phase: "resting",
      currentEvents,
      nextEvents,
      justEndedEvents,
      currentEvent: null,
      nextEvent,
      justEndedEvent,
    };
  }

  if (nextEvent) {
    return {
      phase: "en_route",
      currentEvents,
      nextEvents,
      justEndedEvents,
      currentEvent: null,
      nextEvent,
      justEndedEvent,
    };
  }

  return {
    phase: "trip_complete",
    currentEvents,
    nextEvents,
    justEndedEvents,
    currentEvent: null,
    nextEvent: null,
    justEndedEvent,
  };
};
