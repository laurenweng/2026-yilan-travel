/**
 * 首頁卡片插圖。檔名即行程名稱，統一為 76×64 的 SVG，放在
 * `public/assets/yilan/cards/`。
 *
 * 這裡刻意維護明確名單而非直接用行程名稱組 URL：CSV 由使用者編輯，
 * 名稱打錯時回傳 null（不顯示插圖）比產生 404 破圖好。
 * 新增插圖時，把檔名（不含副檔名）加進名單即可。
 */
const homeEventArtworkNames: ReadonlySet<string> = new Set([
  "享用中餐",
  "共同行程",
  "冬山自由觀光",
  "前往宜蘭",
  "前往羅東市區",
  "向民宿說掰掰",
  "回到甜蜜的家",
  "夜市巡禮",
  "宜蘭集合",
  "早餐時間",
  "晚餐時間",
  "民宿入住",
  "自由活動時間",
  "補助推薦景點",
  "雷射對決賽",
]);

/**
 * 刻意不放插圖的行程。這些行程與同時段的另一筆共用畫面，
 * 避免同一張卡片出現多張插圖而變得過長。
 *
 * 與「還沒準備插圖」區分開來記錄，防漂移測試才能繼續抓出真正的遺漏。
 */
export const titlesWithoutArtwork: ReadonlySet<string> = new Set([
  // 與同時段 17:20–17:50 的「補助推薦景點」共用插圖。
  "採買時間",
]);

/** 去掉全形括號註記，讓「冬山自由觀光（推薦行程）」對到「冬山自由觀光」。 */
export const normalizeHomeEventArtworkName = (title: string) =>
  title.replace(/（[^）]*）/g, "").trim();

/** 取得行程對應的插圖路徑；沒有對應插圖時回傳 null，卡片改用無插圖版型。 */
export const getHomeEventArtwork = (title: string) => {
  const artworkName = normalizeHomeEventArtworkName(title);
  if (!homeEventArtworkNames.has(artworkName)) return null;

  return `/assets/yilan/cards/${artworkName}.svg`;
};
