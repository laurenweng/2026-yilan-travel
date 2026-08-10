import assert from "node:assert/strict";
import test from "node:test";
import {
  getTripEventEndTimestamp,
  getTripEventStartTimestamp,
  resolveTripSnapshot,
} from "../app/lib/trip-time.ts";
import type { TripEvent } from "../app/lib/trip-types.ts";

const events: TripEvent[] = [
  {
    id: "first-event",
    date: "2026-08-29",
    displayTime: "08:30 - 10:00",
    startTime: "08:30",
    endTime: "10:00",
    title: "第一站",
    location: "示範地點一",
    vehicles: [],
    roomAssignments: [],
    menuItems: [],
  },
  {
    id: "second-event",
    date: "2026-08-29",
    displayTime: "11:40 - 13:00",
    startTime: "11:40",
    endTime: "13:00",
    title: "第二站",
    location: "示範地點二",
    vehicles: [],
    roomAssignments: [],
    menuItems: [],
  },
];

test("第一個行程開始前顯示行前狀態與下一站", () => {
  const result = resolveTripSnapshot(
    events,
    new Date("2026-08-29T08:29:59+08:00"),
  );

  assert.equal(result.phase, "pre_trip");
  assert.equal(result.currentEvent, null);
  assert.equal(result.nextEvent?.id, "first-event");
});

test("開始時間包含在進行中區間，結束時間不包含", () => {
  const activeResult = resolveTripSnapshot(
    events,
    new Date("2026-08-29T08:30:00+08:00"),
  );
  const enRouteResult = resolveTripSnapshot(
    events,
    new Date("2026-08-29T10:00:00+08:00"),
  );

  assert.equal(activeResult.phase, "active");
  assert.equal(activeResult.currentEvent?.id, "first-event");
  assert.equal(enRouteResult.phase, "en_route");
  assert.equal(enRouteResult.currentEvent, null);
  assert.equal(enRouteResult.nextEvent?.id, "second-event");
});

test("最後一個行程結束後顯示旅程完成", () => {
  const result = resolveTripSnapshot(
    events,
    new Date("2026-08-29T13:00:00+08:00"),
  );

  assert.equal(result.phase, "trip_complete");
  assert.equal(result.currentEvent, null);
  assert.equal(result.nextEvent, null);
});

const makeEvent = (
  id: string,
  startTime: string,
  endTime: string,
): TripEvent => ({
  id,
  date: "2026-08-29",
  displayTime: `${startTime} - ${endTime}`,
  startTime,
  endTime,
  title: id,
  location: id,
  vehicles: [],
  roomAssignments: [],
  menuItems: [],
});

const concurrentEvents: TripEvent[] = [
  makeEvent("dongshan-a", "16:50", "17:20"),
  makeEvent("dongshan-b", "16:50", "17:20"),
  makeEvent("dongshan-c", "16:50", "17:20"),
  makeEvent("supplement-shop", "17:20", "17:50"),
  makeEvent("supplement-scenery", "17:20", "17:50"),
];

test("同時段的三個冬山行程全部列入 currentEvents", () => {
  const result = resolveTripSnapshot(
    concurrentEvents,
    new Date("2026-08-29T17:00:00+08:00"),
  );

  assert.equal(result.phase, "active");
  assert.deepEqual(
    result.currentEvents.map((event) => event.id),
    ["dongshan-a", "dongshan-b", "dongshan-c"],
  );
  assert.equal(result.currentEvent?.id, "dongshan-a");
});

test("下一時段同時開始的多筆行程全部列入 nextEvents", () => {
  const result = resolveTripSnapshot(
    concurrentEvents,
    new Date("2026-08-29T17:00:00+08:00"),
  );

  assert.deepEqual(
    result.nextEvents.map((event) => event.id),
    ["supplement-shop", "supplement-scenery"],
  );
  assert.equal(result.nextEvent?.id, "supplement-shop");
});

test("沒有進行中的行程時 currentEvents 為空陣列", () => {
  const result = resolveTripSnapshot(
    concurrentEvents,
    new Date("2026-08-29T16:00:00+08:00"),
  );

  assert.equal(result.phase, "pre_trip");
  assert.deepEqual(result.currentEvents, []);
  assert.deepEqual(
    result.nextEvents.map((event) => event.id),
    ["dongshan-a", "dongshan-b", "dongshan-c"],
  );
});

const gapEvents: TripEvent[] = [
  makeEvent("checkin", "17:50", "18:20"),
  makeEvent("dinner", "18:30", "20:00"),
];

test("行程結束但下一筆還沒開始的空檔，justEndedEvents 記錄剛結束的行程", () => {
  const result = resolveTripSnapshot(
    gapEvents,
    new Date("2026-08-29T18:20:00+08:00"),
  );

  assert.equal(result.phase, "en_route");
  assert.deepEqual(
    result.justEndedEvents.map((event) => event.id),
    ["checkin"],
  );
  assert.equal(result.justEndedEvent?.id, "checkin");
});

test("同時段結束的多筆行程全部列入 justEndedEvents", () => {
  const result = resolveTripSnapshot(
    concurrentEvents,
    new Date("2026-08-29T17:20:00+08:00"),
  );

  assert.deepEqual(
    result.justEndedEvents.map((event) => event.id),
    ["dongshan-a", "dongshan-b", "dongshan-c"],
  );
});

test("還沒有任何行程結束時 justEndedEvents 為空陣列", () => {
  const result = resolveTripSnapshot(
    gapEvents,
    new Date("2026-08-29T17:00:00+08:00"),
  );

  assert.deepEqual(result.justEndedEvents, []);
  assert.equal(result.justEndedEvent, null);
});

test("匯出的時間輔助函式回傳台北時區時間戳", () => {
  const event = makeEvent("dongshan-a", "16:50", "17:20");

  assert.equal(
    getTripEventStartTimestamp(event),
    Date.parse("2026-08-29T16:50:00+08:00"),
  );
  assert.equal(
    getTripEventEndTimestamp(event),
    Date.parse("2026-08-29T17:20:00+08:00"),
  );
});

const overnightEvents: TripEvent[] = [
  makeEvent("night-market", "21:30", "23:00"),
  {
    ...makeEvent("breakfast", "09:00", "10:30"),
    date: "2026-08-30",
  },
];

test("跨日空檔從上一筆結束起顯示休息中", () => {
  const result = resolveTripSnapshot(
    overnightEvents,
    new Date("2026-08-29T23:00:00+08:00"),
  );

  assert.equal(result.phase, "resting");
  assert.equal(result.justEndedEvent?.id, "night-market");
  assert.equal(result.nextEvent?.id, "breakfast");
});

test("隔日行程開始前一秒仍顯示休息中", () => {
  const result = resolveTripSnapshot(
    overnightEvents,
    new Date("2026-08-30T08:59:59+08:00"),
  );

  assert.equal(result.phase, "resting");
});

test("隔日行程開始時切回進行中", () => {
  const result = resolveTripSnapshot(
    overnightEvents,
    new Date("2026-08-30T09:00:00+08:00"),
  );

  assert.equal(result.phase, "active");
  assert.equal(result.currentEvent?.id, "breakfast");
});
