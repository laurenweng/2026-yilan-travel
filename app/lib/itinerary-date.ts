export const itineraryDates = ["2026-08-29", "2026-08-30"] as const;

export type ItineraryDate = (typeof itineraryDates)[number];

const secondDayStartsAt = Date.parse("2026-08-30T00:00:00+08:00");

export const getInitialItineraryDate = (now: Date): ItineraryDate =>
  now.getTime() < secondDayStartsAt ? "2026-08-29" : "2026-08-30";

export const formatItineraryDateLabel = (date: ItineraryDate) =>
  date === itineraryDates[0] ? "第一天" : "第二天";
