import type { TripEvent } from "./trip-types";

type ScheduleOverride = Pick<
  TripEvent,
  "displayTime" | "endTime" | "startTime"
>;

const groupTripId = "d1-group";
const rewardTargetEventId = "d1-dessert";
const scheduleOverridesById: Record<string, ScheduleOverride> = {
  "d1-dessert": {
    displayTime: "14:50 - 16:30",
    endTime: "16:30",
    startTime: "14:50",
  },
  "d1-ricecake": {
    displayTime: "14:50 - 16:30",
    endTime: "16:30",
    startTime: "14:50",
  },
  "d1-scallion-pancake": {
    displayTime: "14:50 - 16:30",
    endTime: "16:30",
    startTime: "14:50",
  },
  "d1-farm-park": {
    displayTime: "16:30 - 17:30",
    endTime: "17:30",
    startTime: "16:30",
  },
  "d1-shopping": {
    displayTime: "16:30 - 17:30",
    endTime: "17:30",
    startTime: "16:30",
  },
};

export const applyTripScheduleRules = (events: TripEvent[]): TripEvent[] => {
  const groupEvent = events.find((event) => event.id === groupTripId);
  const isCancelled = groupEvent?.place?.trim().toLowerCase() === "false";

  if (!isCancelled) return events;

  return events
    .filter((event) => event.id !== groupTripId)
    .map((event) => {
      const scheduleOverride = scheduleOverridesById[event.id];
      const transferredReward =
        event.id === rewardTargetEventId ? groupEvent.reward : undefined;

      if (!scheduleOverride && !transferredReward) return event;

      return {
        ...event,
        ...scheduleOverride,
        ...(transferredReward ? { reward: transferredReward } : {}),
      };
    });
};
