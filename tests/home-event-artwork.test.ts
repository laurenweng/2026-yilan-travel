import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import {
  getHomeEventArtwork,
  normalizeHomeEventArtworkName,
  titlesWithoutArtwork,
} from "../app/lib/home-event-artwork.ts";
import { parseTripCsv } from "../app/lib/trip-csv.ts";

test("行程名稱直接對應到 cards 目錄下的插圖", () => {
  assert.equal(
    getHomeEventArtwork("享用中餐"),
    "/assets/yilan/cards/享用中餐.svg",
  );
  assert.equal(
    getHomeEventArtwork("雷射對決賽"),
    "/assets/yilan/cards/雷射對決賽.svg",
  );
});

test("括號註記會被正規化掉，冬山自由觀光（推薦行程）對到冬山自由觀光", () => {
  assert.equal(normalizeHomeEventArtworkName("冬山自由觀光（推薦行程）"), "冬山自由觀光");
  assert.equal(
    getHomeEventArtwork("冬山自由觀光（推薦行程）"),
    "/assets/yilan/cards/冬山自由觀光.svg",
  );
});

test("未知行程名稱回傳 null，不產生破圖", () => {
  assert.equal(getHomeEventArtwork("還沒有插圖的行程"), null);
  assert.equal(getHomeEventArtwork(""), null);
});

test("採買時間刻意不放插圖，與同時段的補助推薦景點共用畫面", () => {
  assert.equal(titlesWithoutArtwork.has("採買時間"), true);
  assert.equal(getHomeEventArtwork("採買時間"), null);
  // 同時段的另一筆仍保留插圖。
  assert.equal(
    getHomeEventArtwork("補助推薦景點"),
    "/assets/yilan/cards/補助推薦景點.svg",
  );
});

test("正式 CSV 的每個行程名稱，若非刻意排除就必須對得到實際存在的插圖檔案", () => {
  const csvText = readFileSync(
    new URL("../public/data/trip-demo.csv", import.meta.url),
    "utf8",
  );
  const cardFileNames = new Set(
    readdirSync(new URL("../public/assets/yilan/cards", import.meta.url)),
  );
  const { events } = parseTripCsv(csvText);

  const missing = [
    ...new Set(
      events
        .filter(
          (event) =>
            !titlesWithoutArtwork.has(
              normalizeHomeEventArtworkName(event.title),
            ),
        )
        .map((event) => ({
          artwork: getHomeEventArtwork(event.title),
          title: event.title,
        }))
        .filter(
          ({ artwork }) =>
            artwork === null || !cardFileNames.has(artwork.split("/").at(-1)!),
        )
        .map(({ title }) => title),
    ),
  ];

  assert.deepEqual(missing, []);
});
