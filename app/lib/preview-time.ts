import {
  getTripEventEndTimestamp,
  getTripEventStartTimestamp,
} from "./trip-time";
import type { TripEvent } from "./trip-types";

const placeModePattern = /^(after-)?place-(\d+)$/;
const liveScheduleDateMap: Record<string, string> = {
  "2026-08-17": "2026-08-29",
  "2026-08-18": "2026-08-30",
};

const taipeiDateTimeFormatter = new Intl.DateTimeFormat("en-CA", {
  day: "2-digit",
  hour: "2-digit",
  hourCycle: "h23",
  minute: "2-digit",
  month: "2-digit",
  second: "2-digit",
  timeZone: "Asia/Taipei",
  year: "numeric",
});

const getTaipeiDateTimeParts = (now: Date) =>
  Object.fromEntries(
    taipeiDateTimeFormatter
      .formatToParts(now)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  ) as Record<string, string>;

/**
 * 測試網址 `?test=live`：將 8/17、8/18 的台北目前時刻平移到正式旅程日。
 * 只用於測試網址，不會改動正式資料或一般網址的時間。
 */
export const getLiveScheduleTestTime = (mode: string | null, now: Date) => {
  if (mode !== "live") return null;

  const { day, hour, minute, month, second, year } = getTaipeiDateTimeParts(now);
  const mappedDate = liveScheduleDateMap[`${year}-${month}-${day}`];
  if (!mappedDate) return null;

  return new Date(
    `${mappedDate}T${hour}:${minute}:${second}.${String(now.getMilliseconds()).padStart(3, "0")}+08:00`,
  );
};

/**
 * 開發預覽時間：依排序後的行程解析網址後綴。
 * - `place-N`：第 N 筆（1-based）行程進行中，回傳其開始時間。
 * - `after-place-N`：第 N 筆行程剛結束，回傳其結束時間。
 * 非開發環境、未知模式或超出範圍都回傳 `null`（正式環境忽略 preview）。
 */
export const getPreviewTime = (
  mode: string | null,
  isDevelopment: boolean,
  events: TripEvent[],
): Date | null => {
  if (!isDevelopment || !mode) return null;

  const sortedEvents = [...events].sort(
    (firstEvent, secondEvent) =>
      getTripEventStartTimestamp(firstEvent) -
      getTripEventStartTimestamp(secondEvent),
  );

  if (mode === "pre-trip") {
    const firstEvent = sortedEvents[0];
    return firstEvent
      ? new Date(getTripEventStartTimestamp(firstEvent) - 60_000)
      : null;
  }

  const match = placeModePattern.exec(mode);
  if (!match) return null;

  const isAfter = Boolean(match[1]);
  const placeNumber = Number(match[2]);
  if (placeNumber < 1) return null;

  const targetEvent = sortedEvents[placeNumber - 1];
  if (!targetEvent) return null;

  const timestamp = isAfter
    ? getTripEventEndTimestamp(targetEvent)
    : getTripEventStartTimestamp(targetEvent);
  return new Date(timestamp);
};
