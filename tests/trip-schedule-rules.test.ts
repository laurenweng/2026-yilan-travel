import assert from "node:assert/strict";
import test from "node:test";
import { applyTripScheduleRules } from "../app/lib/trip-schedule-rules.ts";
import type { TripEvent, TripReward } from "../app/lib/trip-types.ts";

const eyesReward: TripReward = {
  artwork: "眼睛.svg",
  copy: "小旅行就是東看看西看看，獲得了宜蘭的眼界",
  itemId: "eyes",
  name: "宜蘭的眼界",
};

type EventOptions = {
  endTime?: string;
  place?: string;
  reward?: TripReward;
  startTime?: string;
};

const makeEvent = (
  id: string,
  {
    endTime = "17:20",
    place,
    reward,
    startTime = "16:50",
  }: EventOptions = {},
): TripEvent => ({
  date: "2026-08-29",
  displayTime: `${startTime} - ${endTime}`,
  endTime,
  id,
  location: place ?? "",
  menuItems: [],
  place,
  reward,
  roomAssignments: [],
  startTime,
  title: id,
  vehicles: [],
});

const makeSchedule = (controlValue: string): TripEvent[] => [
  makeEvent("d1-group", {
    endTime: "16:30",
    place: controlValue,
    reward: eyesReward,
    startTime: "14:50",
  }),
  makeEvent("d1-dessert"),
  makeEvent("d1-ricecake"),
  makeEvent("d1-scallion-pancake"),
  makeEvent("d1-farm-park", { endTime: "17:50", startTime: "17:20" }),
  makeEvent("d1-shopping", { endTime: "17:50", startTime: "17:20" }),
];

test("字串 false 忽略大小寫與前後空白後觸發", () => {
  for (const controlValue of ["false", "FALSE", "False", "  false  "]) {
    const result = applyTripScheduleRules(makeSchedule(controlValue));
    assert.equal(result.some((event) => event.id === "d1-group"), false);
  }
});

test("非 false 字串不調整行程", () => {
  for (const controlValue of ["待確認", "true", "", "falsey"]) {
    const events = makeSchedule(controlValue);
    const result = applyTripScheduleRules(events);
    assert.strictEqual(result, events);
    assert.equal(result.some((event) => event.id === "d1-group"), true);
    assert.equal(
      result.find((event) => event.id === "d1-dessert")?.displayTime,
      "16:50 - 17:20",
    );
  }
});

test("取消共同行程後調整五筆時間並轉移眼睛獎勵", () => {
  const events = makeSchedule("false");
  const result = applyTripScheduleRules(events);
  const eventsById = new Map(result.map((event) => [event.id, event]));

  assert.equal(eventsById.has("d1-group"), false);
  for (const id of ["d1-dessert", "d1-ricecake", "d1-scallion-pancake"]) {
    assert.deepEqual(
      {
        displayTime: eventsById.get(id)?.displayTime,
        endTime: eventsById.get(id)?.endTime,
        startTime: eventsById.get(id)?.startTime,
      },
      {
        displayTime: "14:50 - 16:30",
        endTime: "16:30",
        startTime: "14:50",
      },
    );
  }
  for (const id of ["d1-farm-park", "d1-shopping"]) {
    assert.deepEqual(
      {
        displayTime: eventsById.get(id)?.displayTime,
        endTime: eventsById.get(id)?.endTime,
        startTime: eventsById.get(id)?.startTime,
      },
      {
        displayTime: "16:30 - 17:30",
        endTime: "17:30",
        startTime: "16:30",
      },
    );
  }
  assert.deepEqual(eventsById.get("d1-dessert")?.reward, eyesReward);
  assert.equal(eventsById.get("d1-ricecake")?.reward, undefined);
  assert.equal(eventsById.get("d1-scallion-pancake")?.reward, undefined);
  assert.equal(
    events.find((event) => event.id === "d1-dessert")?.startTime,
    "16:50",
  );
});

test("目標行程缺失時仍調整其他存在行程", () => {
  const result = applyTripScheduleRules([
    makeEvent("d1-group", { place: "false", reward: eyesReward }),
    makeEvent("d1-shopping", { endTime: "17:50", startTime: "17:20" }),
  ]);

  assert.deepEqual(
    result.map((event) => event.id),
    ["d1-shopping"],
  );
  assert.equal(result[0].displayTime, "16:30 - 17:30");
});
