import type { TripEvent } from "./trip-types";

export type HomeEventTitleGroup = {
  events: TripEvent[];
  title: string;
};

export type HomeEventTimeGroup = {
  events: TripEvent[];
  timeLabel: string;
  titleGroups: HomeEventTitleGroup[];
};

export const formatHomeEventTimeLabel = (event: TripEvent) =>
  `${event.startTime}–${event.endTime}`;

/**
 * 依時間範圍分組，再依行程名稱分組，讓同時段同名稱的行程只顯示一次時間與名稱。
 *
 * 前提：傳入的行程必須同屬一天。分組鍵只用 `開始–結束` 時間、不含日期，
 * 因為呼叫端只會傳入 `resolveTripSnapshot` 的 `currentEvents`（同一瞬間進行中）
 * 或 `nextEvents`（開始時間戳完全相同），兩者必然同日。
 * 若日後要傳入跨日的行程清單，分組鍵必須改為包含 `event.date`。
 */
export const groupHomeEventsByTimeAndTitle = (
  events: TripEvent[],
): HomeEventTimeGroup[] => {
  const timeGroups: HomeEventTimeGroup[] = [];

  for (const event of events) {
    const timeLabel = formatHomeEventTimeLabel(event);
    let timeGroup = timeGroups.find((group) => group.timeLabel === timeLabel);
    if (!timeGroup) {
      timeGroup = { events: [], timeLabel, titleGroups: [] };
      timeGroups.push(timeGroup);
    }
    timeGroup.events.push(event);

    let titleGroup = timeGroup.titleGroups.find(
      (group) => group.title === event.title,
    );
    if (!titleGroup) {
      titleGroup = { events: [], title: event.title };
      timeGroup.titleGroups.push(titleGroup);
    }
    titleGroup.events.push(event);
  }

  return timeGroups;
};
