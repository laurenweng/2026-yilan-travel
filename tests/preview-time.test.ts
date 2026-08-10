import assert from "node:assert/strict";
import test from "node:test";
import { getPreviewTime } from "../app/lib/preview-time.ts";
import type { TripEvent } from "../app/lib/trip-types.ts";

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

// 故意打亂順序，驗證函式會自行依開始時間排序後再取第 N 筆。
const events: TripEvent[] = [
  makeEvent("place-3-a", "16:50", "17:20"),
  makeEvent("place-1", "10:00", "11:00"),
  makeEvent("place-6", "17:20", "17:50"),
  makeEvent("place-3-c", "16:50", "17:20"),
  makeEvent("place-2", "11:00", "12:00"),
  makeEvent("place-3-b", "16:50", "17:20"),
];

test("place-N 取排序後第 N 筆行程的開始時間", () => {
  assert.equal(
    getPreviewTime("place-1", true, events)?.toISOString(),
    "2026-08-29T02:00:00.000Z",
  );
  assert.equal(
    getPreviewTime("place-2", true, events)?.toISOString(),
    "2026-08-29T03:00:00.000Z",
  );
});

test("同時段的多筆行程 place-N 都落在同一開始時間", () => {
  const third = getPreviewTime("place-3", true, events)?.toISOString();
  const fourth = getPreviewTime("place-4", true, events)?.toISOString();
  const fifth = getPreviewTime("place-5", true, events)?.toISOString();

  assert.equal(third, "2026-08-29T08:50:00.000Z");
  assert.equal(fourth, "2026-08-29T08:50:00.000Z");
  assert.equal(fifth, "2026-08-29T08:50:00.000Z");
});

test("after-place-N 取第 N 筆行程的結束時間", () => {
  assert.equal(
    getPreviewTime("after-place-3", true, events)?.toISOString(),
    "2026-08-29T09:20:00.000Z",
  );
  assert.equal(
    getPreviewTime("after-place-6", true, events)?.toISOString(),
    "2026-08-29T09:50:00.000Z",
  );
});

test("pre-trip 回傳第一筆行程開始前一分鐘", () => {
  assert.equal(
    getPreviewTime("pre-trip", true, events)?.toISOString(),
    "2026-08-29T01:59:00.000Z",
  );
});

test("正式環境忽略 pre-trip 預覽", () => {
  assert.equal(getPreviewTime("pre-trip", false, events), null);
});

test("正式環境、未知模式、超出範圍都回傳 null", () => {
  assert.equal(getPreviewTime("place-1", false, events), null);
  assert.equal(getPreviewTime("active", true, events), null);
  assert.equal(getPreviewTime("place-0", true, events), null);
  assert.equal(getPreviewTime("place-99", true, events), null);
  assert.equal(getPreviewTime(null, true, events), null);
});
