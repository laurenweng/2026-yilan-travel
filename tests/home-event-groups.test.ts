import assert from "node:assert/strict";
import test from "node:test";
import { groupHomeEventsByTimeAndTitle } from "../app/lib/home-event-groups.ts";
import type { TripEvent } from "../app/lib/trip-types.ts";

const makeEvent = (
  id: string,
  title: string,
  startTime: string,
  endTime: string,
  place?: string,
): TripEvent => ({
  date: "2026-08-29",
  displayTime: `${startTime} - ${endTime}`,
  endTime,
  id,
  location: place ?? "",
  menuItems: [],
  place,
  roomAssignments: [],
  startTime,
  title,
  vehicles: [],
});

test("單一行程回傳一個時間分組與一個名稱分組", () => {
  const event = makeEvent("d1-lunch", "享用中餐", "11:40", "13:00", "番割田甕缸雞");
  const groups = groupHomeEventsByTimeAndTitle([event]);

  assert.equal(groups.length, 1);
  assert.equal(groups[0].timeLabel, "11:40–13:00");
  assert.equal(groups[0].titleGroups.length, 1);
  assert.equal(groups[0].titleGroups[0].title, "享用中餐");
  assert.equal(groups[0].titleGroups[0].events.length, 1);
});

test("同時段同名稱的行程合併成一個時間分組與一個名稱分組，底下列出各自地點", () => {
  const events = [
    makeEvent("d1-dessert", "冬山自由觀光（推薦行程）", "16:50", "17:20", "鹽滷豆花專賣店"),
    makeEvent("d1-ricecake", "冬山自由觀光（推薦行程）", "16:50", "17:20", "小華村純米手作粿店"),
    makeEvent("d1-scallion-pancake", "冬山自由觀光（推薦行程）", "16:50", "17:20", "冬山金珠蔥油餅"),
  ];
  const groups = groupHomeEventsByTimeAndTitle(events);

  assert.equal(groups.length, 1);
  assert.equal(groups[0].timeLabel, "16:50–17:20");
  assert.equal(groups[0].titleGroups.length, 1);
  assert.deepEqual(
    groups[0].titleGroups[0].events.map((event) => event.place),
    ["鹽滷豆花專賣店", "小華村純米手作粿店", "冬山金珠蔥油餅"],
  );
});

test("同時段但名稱不同的行程留在同一個時間分組，但分成不同名稱分組", () => {
  const events = [
    makeEvent("d1-farm-park", "補助推薦景點", "17:20", "17:50", "良食農創園區"),
    makeEvent("d1-shopping", "採買時間", "17:20", "17:50", "喜互惠生鮮超市冬山店"),
  ];
  const groups = groupHomeEventsByTimeAndTitle(events);

  assert.equal(groups.length, 1);
  assert.equal(groups[0].timeLabel, "17:20–17:50");
  assert.equal(groups[0].titleGroups.length, 2);
  assert.equal(groups[0].titleGroups[0].title, "補助推薦景點");
  assert.equal(groups[0].titleGroups[1].title, "採買時間");
});

test("不同時段的行程分成不同時間分組", () => {
  const events = [
    makeEvent("d1-lunch", "享用中餐", "11:40", "13:00", "番割田甕缸雞"),
    makeEvent("d1-laser", "雷射對決賽", "13:30", "14:30", "安永心食館"),
  ];
  const groups = groupHomeEventsByTimeAndTitle(events);

  assert.equal(groups.length, 2);
  assert.equal(groups[0].timeLabel, "11:40–13:00");
  assert.equal(groups[1].timeLabel, "13:30–14:30");
});

test("沒有地點的行程不會產生地點文字，但仍保留名稱分組", () => {
  const event = makeEvent("d1-group", "共同行程", "14:50", "16:30");
  const groups = groupHomeEventsByTimeAndTitle([event]);

  assert.equal(groups[0].titleGroups[0].events[0].place, undefined);
});
