import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  resolveBackpackDisplay,
  parseSeenRewardItemIds,
  serializeSeenRewardItemIds,
  SEEN_REWARDS_STORAGE_KEY,
} from "../app/lib/backpack-progress.ts";
import type { BackpackItemId } from "../app/lib/backpack-catalog.ts";
import { parseTripCsv } from "../app/lib/trip-csv.ts";
import type { TripEvent } from "../app/lib/trip-types.ts";

const makeRewardEvent = (
  id: string,
  endTime: string,
  itemId: BackpackItemId,
): TripEvent => ({
  id,
  date: "2026-08-29",
  displayTime: `09:00 - ${endTime}`,
  startTime: "09:00",
  endTime,
  title: id,
  location: id,
  vehicles: [],
  roomAssignments: [],
  menuItems: [],
  reward: {
    artwork: "藥水.svg",
    copy: "測試物品文案",
    itemId,
    name: "測試物品",
  },
});

// 背包格位依旅程取得順序排列，讓已解鎖物品由左至右、由上至下連續出現。
const events: TripEvent[] = [
  makeRewardEvent("d1-meet", "10:00", "potion"),
  makeRewardEvent("d1-lunch", "11:00", "fried-chicken"),
];

test("每個物品在對應行程結束後解鎖", () => {
  const beforeAnyUnlock = resolveBackpackDisplay(
    events,
    new Date("2026-08-29T09:30:00+08:00"),
    new Set(),
  );
  const onlyFirstUnlocked = resolveBackpackDisplay(
    events,
    new Date("2026-08-29T10:00:00+08:00"),
    new Set(),
  );
  const bothUnlocked = resolveBackpackDisplay(
    events,
    new Date("2026-08-29T11:00:00+08:00"),
    new Set(),
  );

  const potionItem = (display: ReturnType<typeof resolveBackpackDisplay>) =>
    display.items.find((item) => item.id === "potion");
  const friedChickenItem = (
    display: ReturnType<typeof resolveBackpackDisplay>,
  ) => display.items.find((item) => item.id === "fried-chicken");

  assert.equal(potionItem(beforeAnyUnlock)?.isUnlocked, false);
  assert.equal(friedChickenItem(beforeAnyUnlock)?.isUnlocked, false);

  assert.equal(potionItem(onlyFirstUnlocked)?.isUnlocked, true);
  assert.equal(friedChickenItem(onlyFirstUnlocked)?.isUnlocked, false);

  assert.equal(potionItem(bothUnlocked)?.isUnlocked, true);
  assert.equal(friedChickenItem(bothUnlocked)?.isUnlocked, true);
});

test("沒有綁定獎勵的物品格維持鎖定", () => {
  const display = resolveBackpackDisplay(
    events,
    new Date("2026-08-29T11:00:00+08:00"),
    new Set(),
  );
  const appleItem = display.items.find((item) => item.id === "apple");

  assert.equal(appleItem?.isUnlocked, false);
  assert.equal(display.items.length, 9);
});

test("已解鎖但不在已讀集合中的物品標記為 New，且觸發導覽通知", () => {
  const display = resolveBackpackDisplay(
    events,
    new Date("2026-08-29T11:00:00+08:00"),
    new Set(),
  );

  assert.equal(display.items.find((item) => item.id === "potion")?.isNew, true);
  assert.equal(
    display.items.find((item) => item.id === "fried-chicken")?.isNew,
    true,
  );
  assert.equal(display.hasNotification, true);
});

test("已讀集合中的物品不再標記 New，全部已讀後通知消失", () => {
  const display = resolveBackpackDisplay(
    events,
    new Date("2026-08-29T11:00:00+08:00"),
    new Set(["potion", "fried-chicken"]),
  );

  assert.equal(display.items.find((item) => item.id === "potion")?.isNew, false);
  assert.equal(
    display.items.find((item) => item.id === "fried-chicken")?.isNew,
    false,
  );
  assert.equal(display.hasNotification, false);
});

test("清空已讀集合不會讓已解鎖物品重新鎖住，只會讓它重新顯示 New", () => {
  const display = resolveBackpackDisplay(
    events,
    new Date("2026-08-29T11:00:00+08:00"),
    new Set(),
  );

  assert.equal(display.items.find((item) => item.id === "potion")?.isUnlocked, true);
  assert.equal(display.items.find((item) => item.id === "potion")?.isNew, true);
});

test("localStorage 鍵名固定，解析出的已讀集合只包含合法物品 ID", () => {
  assert.equal(SEEN_REWARDS_STORAGE_KEY, "yilan-trip.seen-rewards.v1");

  const validSet = parseSeenRewardItemIds(
    JSON.stringify(["potion", "fried-chicken", "not-a-real-item"]),
  );
  assert.deepEqual([...validSet].sort(), ["fried-chicken", "potion"]);
});

test("localStorage 資料不存在或格式錯誤時安全回傳空集合", () => {
  assert.deepEqual(parseSeenRewardItemIds(null), new Set());
  assert.deepEqual(parseSeenRewardItemIds("not json"), new Set());
  assert.deepEqual(parseSeenRewardItemIds(JSON.stringify({ not: "an array" })), new Set());
});

test("每個物品格依旅程取得順序由左至右、由上至下排列", () => {
  const display = resolveBackpackDisplay(
    events,
    new Date("2026-08-29T11:00:00+08:00"),
    new Set(),
  );

  assert.deepEqual(
    display.items.map((item) => item.name),
    [
      "神秘藥水",
      "甕缸雞腿",
      "宜蘭青蛙怪",
      "宜蘭的眼界",
      "迎賓飲料",
      "回憶",
      "療癒力量",
      "五星好評",
      "大合照",
    ],
  );
});

test("宜蘭青蛙怪與盾牌共用第三格，依解鎖時間取最晚者", () => {
  const bombEvent = makeRewardEvent("d1-lunch", "13:00", "bomb");
  const shieldEvent = makeRewardEvent("d1-laser", "14:30", "shield");
  const slotEvents = [bombEvent, shieldEvent];
  const findSlotItem = (display: ReturnType<typeof resolveBackpackDisplay>) =>
    display.items.find((item) => item.id === "bomb" || item.id === "shield");

  const beforeBomb = resolveBackpackDisplay(
    slotEvents,
    new Date("2026-08-29T12:00:00+08:00"),
    new Set(),
  );
  assert.equal(findSlotItem(beforeBomb)?.isUnlocked, false);

  const afterBombOnly = resolveBackpackDisplay(
    slotEvents,
    new Date("2026-08-29T13:30:00+08:00"),
    new Set(),
  );
  assert.equal(findSlotItem(afterBombOnly)?.id, "bomb");
  assert.equal(findSlotItem(afterBombOnly)?.isUnlocked, true);

  const afterShield = resolveBackpackDisplay(
    slotEvents,
    new Date("2026-08-29T15:00:00+08:00"),
    new Set(),
  );
  assert.equal(findSlotItem(afterShield)?.id, "shield");
  assert.equal(findSlotItem(afterShield)?.isUnlocked, true);
  assert.equal(afterShield.items.length, 9);
});

test("盾牌取代宜蘭青蛙怪後，即使宜蘭青蛙怪已讀，該格仍重新顯示 New", () => {
  const bombEvent = makeRewardEvent("d1-lunch", "13:00", "bomb");
  const shieldEvent = makeRewardEvent("d1-laser", "14:30", "shield");

  const display = resolveBackpackDisplay(
    [bombEvent, shieldEvent],
    new Date("2026-08-29T15:00:00+08:00"),
    new Set(["bomb"]),
  );
  const shieldItem = display.items.find((item) => item.id === "shield");

  assert.equal(shieldItem?.isNew, true);
});

test("只有已解鎖且找到對應行程的物品才帶有物品文案，鎖定格沒有文案", () => {
  const display = resolveBackpackDisplay(
    events,
    new Date("2026-08-29T11:00:00+08:00"),
    new Set(),
  );

  assert.equal(
    display.items.find((item) => item.id === "potion")?.copy,
    "測試物品文案",
  );
  assert.equal(
    display.items.find((item) => item.id === "apple")?.copy,
    undefined,
  );
});

test("已解鎖但尚未到達現在時間的物品沒有文案", () => {
  const display = resolveBackpackDisplay(
    events,
    new Date("2026-08-29T09:30:00+08:00"),
    new Set(),
  );

  assert.equal(
    display.items.find((item) => item.id === "potion")?.copy,
    undefined,
  );
});

test("序列化已讀集合為 JSON 陣列字串，可被 parseSeenRewardItemIds 還原", () => {
  const serialized = serializeSeenRewardItemIds(
    new Set(["potion", "fried-chicken"]),
  );

  assert.deepEqual(
    [...parseSeenRewardItemIds(serialized)].sort(),
    ["fried-chicken", "potion"],
  );
});

test("共同行程取消後眼睛改在冬山自由觀光結束時解鎖", () => {
  const originalCsvText = readFileSync(
    new URL("../public/data/trip-demo.csv", import.meta.url),
    "utf8",
  );
  const cancelledEvents = parseTripCsv(
    originalCsvText.replace(
      ",14:50 - 16:30,待確認,",
      ",14:50 - 16:30,false,",
    ),
  ).events;
  const beforeEnd = resolveBackpackDisplay(
    cancelledEvents,
    new Date("2026-08-29T16:29:59+08:00"),
    new Set(),
  );
  const atEnd = resolveBackpackDisplay(
    cancelledEvents,
    new Date("2026-08-29T16:30:00+08:00"),
    new Set(),
  );

  assert.equal(
    beforeEnd.items.find((item) => item.id === "eyes")?.isUnlocked,
    false,
  );
  assert.equal(
    atEnd.items.find((item) => item.id === "eyes")?.isUnlocked,
    true,
  );
  assert.equal(
    atEnd.items.find((item) => item.id === "eyes")?.copy,
    "小旅行就是東看看西看看，獲得了宜蘭的眼界",
  );
});
