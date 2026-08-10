import assert from "node:assert/strict";
import test from "node:test";
import { createCarAssignmentRows } from "../app/lib/car-assignment.ts";
import type { TripEvent } from "../app/lib/trip-types.ts";

const event: TripEvent = {
  id: "event-1",
  date: "2026-08-29",
  displayTime: "08:30 - 10:00",
  startTime: "08:30",
  endTime: "10:00",
  title: "集合",
  location: "示範地點",
  vehicles: [
    { vehicle: "A", driver: "小任", passengers: ["小安", "小宇"] },
    { vehicle: "B", driver: "", passengers: [] },
  ],
  roomAssignments: [],
  menuItems: [],
};

test("分車 Sheet 只輸出有資料的車輛，且保留駕駛與乘客文案", () => {
  const rows = createCarAssignmentRows(event);

  assert.deepEqual(rows, [
    {
      driverLabel: "駕駛：小任",
      passengersLabel: "乘客：小安、小宇",
      vehicle: "A",
    },
  ]);
});

test("尚未填入 CSV 分車資料時，保留設計稿的三車分配", () => {
  const rows = createCarAssignmentRows({
    ...event,
    vehicles: [],
  });

  assert.deepEqual(rows, [
    {
      driverLabel: "駕駛：小王",
      passengersLabel: "乘客：阿明、小陳、小林",
      vehicle: "A",
    },
    {
      driverLabel: "駕駛：小王",
      passengersLabel: "乘客：阿明、小陳、小林",
      vehicle: "B",
    },
    {
      driverLabel: "駕駛：小王",
      passengersLabel: "乘客：阿明、小陳、小林",
      vehicle: "C",
    },
  ]);
});
