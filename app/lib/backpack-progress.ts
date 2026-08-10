import {
  backpackCatalog,
  backpackCatalogById,
  backpackSlots,
  type BackpackItemId,
} from "./backpack-catalog";
import type { BackpackDisplay, BackpackDisplayItem } from "./backpack-state";
import { getTripEventEndTimestamp } from "./trip-time";
import type { TripEvent } from "./trip-types";

export const SEEN_REWARDS_STORAGE_KEY = "yilan-trip.seen-rewards.v1";

const dialogueByUnlockState = {
  locked: "旅行的途中，記得回來檢查背包唷！",
  unlocked: "哇！背包裡裝了滿滿的收穫",
  new: "背包裡好像有什麼新東西？",
};

type RewardEntry = {
  copy: string;
  endTimestamp: number;
};

/** 依真實行程時間與已讀集合，計算九個背包格位的解鎖／已讀狀態。 */
export const resolveBackpackDisplay = (
  events: TripEvent[],
  now: Date,
  seenItemIds: ReadonlySet<BackpackItemId>,
): BackpackDisplay => {
  const rewardEntryByItemId = new Map<BackpackItemId, RewardEntry>();
  for (const event of events) {
    const endTimestamp = getTripEventEndTimestamp(event);
    if (event.reward) {
      rewardEntryByItemId.set(event.reward.itemId, {
        copy: event.reward.copy,
        endTimestamp,
      });
    }
    if (event.reward2) {
      rewardEntryByItemId.set(event.reward2.itemId, {
        copy: event.reward2.copy,
        endTimestamp,
      });
    }
  }

  const currentTimestamp = now.getTime();
  const items: BackpackDisplayItem[] = backpackSlots.map((slotItemIds) => {
    // 格位候選依名單順序逐一比較，已解鎖中結束時間最晚者（同分取較後者）勝出。
    let winningItemId: BackpackItemId | null = null;
    let winningTimestamp = Number.NEGATIVE_INFINITY;

    for (const itemId of slotItemIds) {
      const rewardEntry = rewardEntryByItemId.get(itemId);
      if (!rewardEntry || rewardEntry.endTimestamp > currentTimestamp) continue;
      if (rewardEntry.endTimestamp >= winningTimestamp) {
        winningTimestamp = rewardEntry.endTimestamp;
        winningItemId = itemId;
      }
    }

    const catalogItem = backpackCatalogById.get(winningItemId ?? slotItemIds[0])!;
    const isUnlocked = winningItemId !== null;
    const isNew = isUnlocked && !seenItemIds.has(catalogItem.id);

    return {
      artwork: catalogItem.artwork,
      copy: winningItemId ? rewardEntryByItemId.get(winningItemId)?.copy : undefined,
      id: catalogItem.id,
      isNew,
      isUnlocked,
      name: catalogItem.name,
    };
  });

  const hasUnseenItem = items.some((item) => item.isNew);
  const unlockedCount = items.filter((item) => item.isUnlocked).length;
  const dialogue =
    unlockedCount === 0
      ? dialogueByUnlockState.locked
      : hasUnseenItem
        ? dialogueByUnlockState.new
        : dialogueByUnlockState.unlocked;

  return { dialogue, hasNotification: hasUnseenItem, items };
};

/** 解析 localStorage 已讀集合字串，格式錯誤或不存在都安全回傳空集合。 */
export const parseSeenRewardItemIds = (
  rawValue: string | null,
): Set<BackpackItemId> => {
  if (!rawValue) return new Set();

  try {
    const parsed = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) return new Set();

    const validItemIds = new Set(backpackCatalog.map((item) => item.id));
    return new Set(
      parsed.filter(
        (value): value is BackpackItemId =>
          typeof value === "string" && validItemIds.has(value as BackpackItemId),
      ),
    );
  } catch {
    return new Set();
  }
};

/** 讀取正式模式下的已讀集合；伺服器端渲染時回傳空集合。 */
export const readSeenRewardItemIds = (): Set<BackpackItemId> => {
  if (typeof window === "undefined") return new Set();
  return parseSeenRewardItemIds(window.localStorage.getItem(SEEN_REWARDS_STORAGE_KEY));
};

/** 將已讀集合序列化成 JSON 陣列字串，供寫入 localStorage。 */
export const serializeSeenRewardItemIds = (
  seenItemIds: ReadonlySet<BackpackItemId>,
): string => JSON.stringify([...seenItemIds]);

/** 寫入正式模式下的已讀集合；無痕模式或配額不足時安靜失敗，不影響畫面。 */
export const writeSeenRewardItemIds = (
  seenItemIds: ReadonlySet<BackpackItemId>,
): void => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      SEEN_REWARDS_STORAGE_KEY,
      serializeSeenRewardItemIds(seenItemIds),
    );
  } catch {
    // 無痕模式或儲存配額不足：忽略，讀取狀態仍以記憶體內的 seenItemIds 為準。
  }
};
