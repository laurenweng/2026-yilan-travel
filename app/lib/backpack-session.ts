import type { BackpackItemId } from "./backpack-catalog";
import { resolveBackpackDisplay } from "./backpack-progress";
import {
  getBackpackDisplay,
  type BackpackDisplay,
  type BackpackDisplayItem,
  type BackpackDisplayState,
} from "./backpack-state";
import type { TripEvent } from "./trip-types";

export type BackpackSession = {
  /** 正式已讀集合，會寫入 localStorage。 */
  seenItemIds: ReadonlySet<BackpackItemId>;
  /** place-N／after-place-N 預覽專用，只存在記憶體、不寫入 localStorage。 */
  previewSeenItemIds: ReadonlySet<BackpackItemId>;
  /**
   * 開啟當下的物品快照。刻意保存整個物件而非 ID：格位內容會隨時間推進換人
   * （宜蘭青蛙怪→盾牌），若改成依 ID 事後查表，Sheet 會在時間跨越時中途消失。
   */
  selectedItem: BackpackDisplayItem | null;
};

export type BackpackSessionMode = {
  isTripTimePreview: boolean;
};

export const createBackpackSession = (
  seenItemIds: ReadonlySet<BackpackItemId> = new Set(),
): BackpackSession => ({
  seenItemIds,
  previewSeenItemIds: new Set(),
  selectedItem: null,
});

const addItemId = (
  itemIds: ReadonlySet<BackpackItemId>,
  itemId: BackpackItemId,
): ReadonlySet<BackpackItemId> =>
  itemIds.has(itemId) ? itemIds : new Set([...itemIds, itemId]);

/**
 * 開啟物品並標記已讀。是否需要寫入 localStorage 以回傳值表示，
 * 而不是在此產生副作用，呼叫端才能在 React 狀態更新之外自行決定寫入時機。
 */
export const openBackpackItem = (
  session: BackpackSession,
  item: BackpackDisplayItem,
  { isTripTimePreview }: BackpackSessionMode,
): { session: BackpackSession; shouldPersist: boolean } => {
  if (isTripTimePreview) {
    return {
      session: {
        ...session,
        previewSeenItemIds: addItemId(session.previewSeenItemIds, item.id),
        selectedItem: item,
      },
      shouldPersist: false,
    };
  }

  const nextSeenItemIds = addItemId(session.seenItemIds, item.id);

  return {
    session: { ...session, seenItemIds: nextSeenItemIds, selectedItem: item },
    shouldPersist: nextSeenItemIds !== session.seenItemIds,
  };
};

export const closeBackpackItem = (session: BackpackSession): BackpackSession => ({
  ...session,
  selectedItem: null,
});

/** 依模式選出要餵給背包運算的已讀集合。 */
export const selectSeenItemIds = (
  session: BackpackSession,
  { isTripTimePreview }: BackpackSessionMode,
): ReadonlySet<BackpackItemId> =>
  isTripTimePreview ? session.previewSeenItemIds : session.seenItemIds;

/** 依目前模式決定背包畫面：視覺預覽走固定畫面，其餘依真實行程時間運算。 */
export const resolveSessionBackpackDisplay = ({
  backpackState,
  effectiveTime,
  events,
  isBackpackVisualPreview,
  isTripTimePreview,
  session,
}: {
  backpackState: BackpackDisplayState;
  effectiveTime: Date;
  events: TripEvent[];
  isBackpackVisualPreview: boolean;
  isTripTimePreview: boolean;
  session: BackpackSession;
}): BackpackDisplay => {
  if (isBackpackVisualPreview) return getBackpackDisplay(backpackState);

  return resolveBackpackDisplay(
    events,
    effectiveTime,
    selectSeenItemIds(session, { isTripTimePreview }),
  );
};
