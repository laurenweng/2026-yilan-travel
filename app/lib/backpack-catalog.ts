export type BackpackItemId =
  | "apple"
  | "drink"
  | "eyes"
  | "heart"
  | "star"
  | "potion"
  | "lightning"
  | "fried-chicken"
  | "bomb"
  | "shield";

export type BackpackArtwork =
  | "蘋果.svg"
  | "飲料.svg"
  | "眼睛.svg"
  | "愛心.svg"
  | "星星.svg"
  | "藥水.svg"
  | "閃電.svg"
  | "烤雞.svg"
  | "青蛙.svg"
  | "盾牌.svg";

export type BackpackCatalogItem = {
  artwork: BackpackArtwork;
  id: BackpackItemId;
  name: string;
};

export const backpackCatalog: BackpackCatalogItem[] = [
  { artwork: "蘋果.svg", id: "apple", name: "蘋果" },
  { artwork: "飲料.svg", id: "drink", name: "飲料" },
  { artwork: "眼睛.svg", id: "eyes", name: "眼睛" },
  { artwork: "愛心.svg", id: "heart", name: "愛心" },
  { artwork: "星星.svg", id: "star", name: "星星" },
  { artwork: "藥水.svg", id: "potion", name: "藥水" },
  { artwork: "閃電.svg", id: "lightning", name: "閃電" },
  { artwork: "烤雞.svg", id: "fried-chicken", name: "甕缸雞腿" },
  { artwork: "青蛙.svg", id: "bomb", name: "宜蘭青蛙怪" },
  { artwork: "盾牌.svg", id: "shield", name: "盾牌" },
];

export const backpackCatalogById: ReadonlyMap<BackpackItemId, BackpackCatalogItem> =
  new Map(backpackCatalog.map((item) => [item.id, item]));

/**
 * 九個固定格位依旅程取得順序排列，讓已解鎖物品由左至右、由上至下連續出現。
 * 第三格由宜蘭青蛙怪／盾牌共用：享用中餐時遇到宜蘭青蛙怪擋路，雷射對決賽後取得盾牌並取代它。
 * 同一格同時解鎖多個候選時取陣列中較後者。
 */
export const backpackSlots: BackpackItemId[][] = [
  ["potion"],
  ["fried-chicken"],
  ["bomb", "shield"],
  ["eyes"],
  ["drink"],
  ["heart"],
  ["lightning"],
  ["star"],
  ["apple"],
];

const normalizeArtworkName = (value: string) =>
  value.trim().replace(/\.svg$/i, "");

export const findBackpackItemByArtwork = (value?: string) => {
  const normalizedValue = value ? normalizeArtworkName(value) : "";
  if (!normalizedValue) return null;

  return (
    backpackCatalog.find(
      (item) =>
        item.name === normalizedValue ||
        normalizeArtworkName(item.artwork) === normalizedValue,
    ) ?? null
  );
};
