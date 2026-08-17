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
  | "照片.svg"
  | "飲料.webp"
  | "眼睛.webp"
  | "愛心.webp"
  | "星星.webp"
  | "藥水.webp"
  | "閃電.webp"
  | "炸雞.webp"
  | "青蛙.webp"
  | "盾牌.webp";

export type BackpackDetailArtwork = "大合照.webp";

export type BackpackCatalogItem = {
  aliases?: readonly string[];
  artwork: BackpackArtwork;
  detailArtwork?: BackpackDetailArtwork;
  id: BackpackItemId;
  name: string;
};

export const backpackCatalog: BackpackCatalogItem[] = [
  {
    aliases: ["蘋果"],
    artwork: "照片.svg",
    detailArtwork: "大合照.webp",
    id: "apple",
    name: "大合照",
  },
  { artwork: "飲料.webp", id: "drink", name: "迎賓飲料" },
  { artwork: "眼睛.webp", id: "eyes", name: "宜蘭的眼界" },
  { artwork: "愛心.webp", id: "heart", name: "回憶" },
  { artwork: "星星.webp", id: "star", name: "五星好評" },
  { artwork: "藥水.webp", id: "potion", name: "神秘藥水" },
  { artwork: "閃電.webp", id: "lightning", name: "療癒力量" },
  { artwork: "炸雞.webp", id: "fried-chicken", name: "甕缸雞腿" },
  { artwork: "青蛙.webp", id: "bomb", name: "宜蘭青蛙怪" },
  { artwork: "盾牌.webp", id: "shield", name: "勇氣盾牌" },
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
  value.trim().replace(/\.(?:svg|webp)$/i, "");

export const findBackpackItemByArtwork = (value?: string) => {
  const normalizedValue = value ? normalizeArtworkName(value) : "";
  if (!normalizedValue) return null;

  return (
    backpackCatalog.find(
      (item) =>
        item.name === normalizedValue ||
        normalizeArtworkName(item.artwork) === normalizedValue ||
        (item.aliases?.includes(normalizedValue) ?? false),
    ) ?? null
  );
};
