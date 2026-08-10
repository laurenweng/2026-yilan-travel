export type RoomAssignment = {
  artwork: "主建築.svg" | "貨櫃屋.svg";
  details: string[];
  name: string;
};

export const defaultRoomAssignments: RoomAssignment[] = [
  {
    artwork: "主建築.svg",
    details: ["雙人床：小王", "4人床：阿明、小陳、小林"],
    name: "主棟 - 1F",
  },
  {
    artwork: "主建築.svg",
    details: ["雙人床：小王", "雙人床：阿明、小陳、小林"],
    name: "主棟 - 2F",
  },
  {
    artwork: "貨櫃屋.svg",
    details: ["雙人床：小陳、小林"],
    name: "貨櫃屋 - A room",
  },
  {
    artwork: "貨櫃屋.svg",
    details: ["雙人床：阿明、小陳、小林"],
    name: "貨櫃屋 - A room",
  },
];

export const defaultMenuItems = [
  "主廚招待餐前小點",
  "義式檸檬沙拉",
  "蒜香奶油鮮魷魚",
  "鹽烤頂級草蝦",
  "主廚愛心滿出來炒飯",
  "味の鰻海魚一夜干",
  "爐烤PRIME翼板牛排",
  "黃金雞湯",
  "鹽味黃金手羽先",
  "季節時蔬饗宴",
  "青蔥豬五花",
  "主廚招待點心",
];

export type MenuArtwork =
  | "甜甜圈.svg"
  | "起司.svg"
  | "魚肉.svg"
  | "香腸.svg"
  | "烤雞.svg";

export const menuArtwork: MenuArtwork[] = [
  "甜甜圈.svg",
  "起司.svg",
  "魚肉.svg",
  "香腸.svg",
  "烤雞.svg",
];

export const getMenuArtworkWidth = (artwork: MenuArtwork) =>
  artwork === "甜甜圈.svg" ? 49 : 52;
