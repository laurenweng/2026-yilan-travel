import {
  backpackCatalogById,
  backpackSlots,
  type BackpackArtwork,
  type BackpackItemId,
} from "./backpack-catalog";

export type BackpackDisplayState = "locked" | "unlocked" | "new" | "all";

export type BackpackDisplayItem = {
  artwork: BackpackArtwork;
  /** 只在已解鎖且找到對應行程時才有值；用來決定物品格是否可點開 Bottom Sheet。 */
  copy?: string;
  id: BackpackItemId;
  isNew: boolean;
  isUnlocked: boolean;
  name: string;
};

export type BackpackDisplay = {
  dialogue: string;
  hasNotification: boolean;
  items: BackpackDisplayItem[];
};

const unlockedCountByState: Record<BackpackDisplayState, number> = {
  locked: 0,
  unlocked: 1,
  new: 2,
  all: backpackSlots.length,
};

const dialogueByState: Record<BackpackDisplayState, string> = {
  locked: "旅行的途中，記得回來檢查背包唷！",
  unlocked: "哇！背包裡裝了滿滿的收穫",
  new: "背包裡好像有什麼新東西？",
  all: "背包裡好像有什麼新東西？",
};

const previewStateByMode: Record<string, BackpackDisplayState> = {
  "backpack-locked": "locked",
  "backpack-unlocked": "unlocked",
  "backpack-new": "new",
  "backpack-all": "all",
};

export const getBackpackDisplay = (
  state: BackpackDisplayState,
): BackpackDisplay => {
  const unlockedCount = unlockedCountByState[state];

  return {
    dialogue: dialogueByState[state],
    hasNotification: state === "new",
    items: backpackSlots.map((slotItemIds, index) => {
      const isUnlocked = index < unlockedCount;
      // 格位解鎖時顯示名單中最後一個候選（宜蘭青蛙怪／盾牌格顯示盾牌，代表旅程完成的最終狀態）。
      const catalogItem = backpackCatalogById.get(
        slotItemIds[slotItemIds.length - 1],
      )!;

      return {
        ...catalogItem,
        isNew: state === "new" && index === 1,
        isUnlocked,
      };
    }),
  };
};

export const getBackpackPreviewState = (
  mode: string | null,
  isDevelopment: boolean,
): BackpackDisplayState => {
  if (!isDevelopment || !mode) return "locked";
  return previewStateByMode[mode] ?? "locked";
};
