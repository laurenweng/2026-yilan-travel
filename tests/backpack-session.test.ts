import assert from "node:assert/strict";
import test from "node:test";
import * as backpackSessionModule from "../app/lib/backpack-session.ts";
import {
  closeBackpackItem,
  createBackpackSession,
  openBackpackItem,
  resolveSessionBackpackDisplay,
  selectSeenItemIds,
} from "../app/lib/backpack-session.ts";
import type { BackpackDisplayItem } from "../app/lib/backpack-state.ts";
import type { BackpackItemId } from "../app/lib/backpack-catalog.ts";
import type { TripEvent } from "../app/lib/trip-types.ts";

const makeItem = (
  id: BackpackItemId,
  name: string,
): BackpackDisplayItem => ({
  artwork: "藥水.webp",
  copy: "測試物品文案",
  id,
  isChallengeAvailable: false,
  isNew: true,
  isUnlocked: true,
  name,
});

const makeChallengeItem = (): BackpackDisplayItem => ({
  ...makeItem("potion", "神秘藥水"),
  challenge: {
    acceptableAnswers: ["冬山車站", "冬山火車站"],
    question: "集合地點旁的車站名稱是什麼？",
  },
  isChallengeAvailable: true,
  isNew: false,
  isUnlocked: false,
});

const challengeSessionActions = backpackSessionModule as typeof backpackSessionModule & {
  openBackpackChallenge?: (
    session: ReturnType<typeof createBackpackSession>,
    item: BackpackDisplayItem,
  ) => ReturnType<typeof createBackpackSession>;
  submitBackpackChallengeAnswer?: (
    session: ReturnType<typeof createBackpackSession>,
    answer: string,
    mode: { isTripTimePreview: boolean },
  ) => {
    isCorrect: boolean;
    session: ReturnType<typeof createBackpackSession>;
    shouldPersist: boolean;
  };
};

const makeRewardEvent = (
  id: string,
  endTime: string,
  itemId: BackpackItemId,
): TripEvent => ({
  date: "2026-08-29",
  displayTime: `09:00 - ${endTime}`,
  endTime,
  id,
  location: id,
  menuItems: [],
  roomAssignments: [],
  startTime: "09:00",
  title: id,
  vehicles: [],
  reward: {
    artwork: "藥水.webp",
    copy: "測試物品文案",
    itemId,
    name: "測試物品",
  },
});

test("新 session 保存正式已讀與答對集合，預覽集合及選取內容保持空白", () => {
  const session = createBackpackSession(
    new Set(["potion"]),
    new Set(["fried-chicken"]),
  );

  assert.equal(session.selectedItem, null);
  assert.equal(session.selectedChallengeItem, null);
  assert.deepEqual([...session.seenItemIds], ["potion"]);
  assert.deepEqual([...session.solvedItemIds], ["fried-chicken"]);
  assert.deepEqual([...session.previewSeenItemIds], []);
  assert.deepEqual([...session.previewSolvedItemIds], []);
});

test("答錯保留問題且不寫入進度，答對後解鎖並直接選取物品詳情", () => {
  assert.equal(typeof challengeSessionActions.openBackpackChallenge, "function");
  assert.equal(
    typeof challengeSessionActions.submitBackpackChallengeAnswer,
    "function",
  );
  const challengeItem = makeChallengeItem();
  const openedSession = challengeSessionActions.openBackpackChallenge?.(
    createBackpackSession(),
    challengeItem,
  );
  assert.equal(openedSession?.selectedChallengeItem, challengeItem);

  const wrongResult = challengeSessionActions.submitBackpackChallengeAnswer?.(
    openedSession!,
    "羅東車站",
    { isTripTimePreview: false },
  );
  assert.equal(wrongResult?.isCorrect, false);
  assert.equal(wrongResult?.shouldPersist, false);
  assert.equal(wrongResult?.session.selectedChallengeItem, challengeItem);

  const correctResult = challengeSessionActions.submitBackpackChallengeAnswer?.(
    wrongResult!.session,
    " 冬山・火車站！ ",
    { isTripTimePreview: false },
  );
  assert.equal(correctResult?.isCorrect, true);
  assert.equal(correctResult?.shouldPersist, true);
  assert.equal(correctResult?.session.selectedChallengeItem, null);
  assert.equal(correctResult?.session.selectedItem?.id, "potion");
  assert.equal(correctResult?.session.selectedItem?.isUnlocked, true);
  assert.deepEqual(correctResult?.session.solvedItemIds, new Set(["potion"]));
  assert.deepEqual(correctResult?.session.seenItemIds, new Set(["potion"]));
});

test("開啟物品後保存的是傳入的物品快照本身，不是事後查表結果", () => {
  const bombItem = makeItem("bomb", "宜蘭青蛙怪");
  const { session } = openBackpackItem(createBackpackSession(), bombItem, {
    isTripTimePreview: false,
  });

  // 用 === 鎖住「存快照」的修法：日後若改回依 id 查表就會失敗。
  assert.equal(session.selectedItem, bombItem);
});

test("正式模式開啟物品會要求寫入 localStorage，並記入正式已讀集合", () => {
  const { session, shouldPersist } = openBackpackItem(
    createBackpackSession(),
    makeItem("potion", "藥水"),
    { isTripTimePreview: false },
  );

  assert.equal(shouldPersist, true);
  assert.deepEqual([...session.seenItemIds], ["potion"]);
  assert.deepEqual([...session.previewSeenItemIds], []);
});

test("預覽模式開啟物品不寫入 localStorage，且完全不動正式已讀集合", () => {
  const initialSession = createBackpackSession(new Set(["potion"]));
  const { session, shouldPersist } = openBackpackItem(
    initialSession,
    makeItem("bomb", "宜蘭青蛙怪"),
    { isTripTimePreview: true },
  );

  assert.equal(shouldPersist, false);
  assert.deepEqual([...session.seenItemIds], ["potion"]);
  assert.deepEqual([...session.previewSeenItemIds], ["bomb"]);
  assert.equal(session.selectedItem?.id, "bomb");
});

test("重複開啟同一物品不再要求寫入，避免多餘的 localStorage 寫入", () => {
  const potionItem = makeItem("potion", "藥水");
  const firstOpen = openBackpackItem(createBackpackSession(), potionItem, {
    isTripTimePreview: false,
  });
  const secondOpen = openBackpackItem(firstOpen.session, potionItem, {
    isTripTimePreview: false,
  });

  assert.equal(firstOpen.shouldPersist, true);
  assert.equal(secondOpen.shouldPersist, false);
  assert.equal(secondOpen.session.selectedItem, potionItem);
  assert.deepEqual([...secondOpen.session.seenItemIds], ["potion"]);
});

test("關閉只清掉選取物品，不影響任何已讀集合", () => {
  const { session } = openBackpackItem(
    createBackpackSession(),
    makeItem("potion", "藥水"),
    { isTripTimePreview: false },
  );
  const closedSession = closeBackpackItem(session);

  assert.equal(closedSession.selectedItem, null);
  assert.deepEqual([...closedSession.seenItemIds], ["potion"]);
});

test("依模式選出要餵給背包運算的已讀集合", () => {
  const session = {
    ...createBackpackSession(new Set<BackpackItemId>(["potion"])),
    previewSeenItemIds: new Set<BackpackItemId>(["bomb"]),
  };

  assert.deepEqual(
    [...selectSeenItemIds(session, { isTripTimePreview: false })],
    ["potion"],
  );
  assert.deepEqual(
    [...selectSeenItemIds(session, { isTripTimePreview: true })],
    ["bomb"],
  );
});

test("三向分支：視覺預覽走固定畫面，其餘依真實時間運算", () => {
  const events = [makeRewardEvent("d1-meet", "10:00", "potion")];
  const afterUnlock = new Date("2026-08-29T10:30:00+08:00");
  const session = createBackpackSession();

  const visualPreview = resolveSessionBackpackDisplay({
    backpackState: "all",
    effectiveTime: afterUnlock,
    events,
    isBackpackVisualPreview: true,
    isTripTimePreview: false,
    session,
  });
  const realMode = resolveSessionBackpackDisplay({
    backpackState: "locked",
    effectiveTime: afterUnlock,
    events,
    isBackpackVisualPreview: false,
    isTripTimePreview: false,
    session,
  });

  // 視覺預覽不看行程資料，九格全解鎖。
  assert.equal(
    visualPreview.items.filter((item) => item.isUnlocked).length,
    9,
  );
  // 正式模式只解鎖真的到時間的那一個。
  assert.equal(realMode.items.filter((item) => item.isUnlocked).length, 1);
  assert.equal(
    realMode.items.find((item) => item.isUnlocked)?.id,
    "potion",
  );
});

test("預覽已讀只影響預覽模式的 New，不影響正式模式", () => {
  const events = [makeRewardEvent("d1-meet", "10:00", "potion")];
  const afterUnlock = new Date("2026-08-29T10:30:00+08:00");
  const session = {
    ...createBackpackSession(),
    previewSeenItemIds: new Set<BackpackItemId>(["potion"]),
  };

  const previewDisplay = resolveSessionBackpackDisplay({
    backpackState: "locked",
    effectiveTime: afterUnlock,
    events,
    isBackpackVisualPreview: false,
    isTripTimePreview: true,
    session,
  });
  const realDisplay = resolveSessionBackpackDisplay({
    backpackState: "locked",
    effectiveTime: afterUnlock,
    events,
    isBackpackVisualPreview: false,
    isTripTimePreview: false,
    session,
  });

  assert.equal(
    previewDisplay.items.find((item) => item.id === "potion")?.isNew,
    false,
  );
  assert.equal(
    realDisplay.items.find((item) => item.id === "potion")?.isNew,
    true,
  );
});
