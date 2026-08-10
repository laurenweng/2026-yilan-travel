import assert from "node:assert/strict";
import test from "node:test";
import {
  formatItineraryDateLabel,
  getInitialItineraryDate,
} from "../app/lib/itinerary-date.ts";

test("8 月 30 日前預設顯示第一日行程", () => {
  const selectedDate = getInitialItineraryDate(
    new Date("2026-08-29T23:59:00+08:00"),
  );

  assert.equal(selectedDate, "2026-08-29");
});

test("8 月 30 日起預設顯示第二日行程", () => {
  const selectedDate = getInitialItineraryDate(
    new Date("2026-08-30T00:00:00+08:00"),
  );

  assert.equal(selectedDate, "2026-08-30");
});

test("兩個行程日期分別顯示第一天與第二天", () => {
  assert.equal(formatItineraryDateLabel("2026-08-29"), "第一天");
  assert.equal(formatItineraryDateLabel("2026-08-30"), "第二天");
});
