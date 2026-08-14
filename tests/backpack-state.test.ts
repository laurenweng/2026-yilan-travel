import assert from "node:assert/strict";
import test from "node:test";
import {
  getBackpackDisplay,
  getBackpackPreviewState,
  type BackpackDisplayState,
} from "../app/lib/backpack-state.ts";
import { backpackCatalog } from "../app/lib/backpack-catalog.ts";

test("背包四種狀態依序解鎖 0、1、2、9 個物品", () => {
  const states: BackpackDisplayState[] = ["locked", "unlocked", "new", "all"];
  const unlockedCounts = states.map(
    (state) =>
      getBackpackDisplay(state).items.filter((item) => item.isUnlocked).length,
  );

  assert.deepEqual(unlockedCounts, [0, 1, 2, 9]);
});

test("只有新物品狀態顯示第二格 New 與導覽通知", () => {
  const newDisplay = getBackpackDisplay("new");
  const otherDisplays = ["locked", "unlocked", "all"].map((state) =>
    getBackpackDisplay(state as BackpackDisplayState),
  );

  assert.equal(newDisplay.items[1].isNew, true);
  assert.equal(newDisplay.items.filter((item) => item.isNew).length, 1);
  assert.equal(newDisplay.hasNotification, true);
  assert.equal(
    otherDisplays.every((display) => !display.hasNotification),
    true,
  );
});

test("四種狀態使用設計稿指定的鴨子對話", () => {
  assert.equal(
    getBackpackDisplay("locked").dialogue,
    "旅行的途中，記得回來檢查背包唷！",
  );
  assert.equal(
    getBackpackDisplay("unlocked").dialogue,
    "哇！背包裡裝了滿滿的收穫",
  );
  assert.equal(
    getBackpackDisplay("new").dialogue,
    "背包裡好像有什麼新東西？",
  );
  assert.equal(
    getBackpackDisplay("all").dialogue,
    "背包裡好像有什麼新東西？",
  );
});

test("背包預覽只在開發環境套用", () => {
  assert.equal(getBackpackPreviewState("backpack-locked", true), "locked");
  assert.equal(getBackpackPreviewState("backpack-unlocked", true), "unlocked");
  assert.equal(getBackpackPreviewState("backpack-new", true), "new");
  assert.equal(getBackpackPreviewState("backpack-all", true), "all");
  assert.equal(getBackpackPreviewState("backpack-all", false), "locked");
  assert.equal(getBackpackPreviewState("unknown", true), "locked");
});

test("背包物品使用旅程主題標題", () => {
  const namesById = Object.fromEntries(
    backpackCatalog.map((item) => [item.id, item.name]),
  );

  assert.deepEqual(
    {
      drink: namesById.drink,
      eyes: namesById.eyes,
      heart: namesById.heart,
      lightning: namesById.lightning,
      potion: namesById.potion,
      shield: namesById.shield,
      star: namesById.star,
    },
    {
      drink: "迎賓飲料",
      eyes: "宜蘭的眼界",
      heart: "回憶",
      lightning: "療癒力量",
      potion: "神秘藥水",
      shield: "勇氣盾牌",
      star: "五星好評",
    },
  );
});
