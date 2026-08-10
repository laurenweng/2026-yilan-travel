import {
  getTripEventEndTimestamp,
  getTripEventStartTimestamp,
} from "./trip-time";
import type { TripEvent } from "./trip-types";

const placeModePattern = /^(after-)?place-(\d+)$/;

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
