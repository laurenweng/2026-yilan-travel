import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  getTravelerArtworkName,
  getTravelerGenderFromSearch,
  type TravelerArtworkName,
} from "../app/lib/traveler-gender.ts";

const readLosslessWebpSize = (artworkName: string) => {
  const artwork = readFileSync(
    new URL(`../public/assets/yilan/${artworkName}`, import.meta.url),
  );

  assert.equal(artwork.subarray(12, 16).toString(), "VP8L");

  const dimensionBits = artwork.readUInt32LE(21);

  return {
    height: ((dimensionBits >>> 14) & 0x3fff) + 1,
    width: (dimensionBits & 0x3fff) + 1,
  };
};

test("gender=female 啟用女生小旅人", () => {
  assert.equal(getTravelerGenderFromSearch("?gender=female"), "female");
  assert.equal(
    getTravelerGenderFromSearch("?preview=place-9&gender=female"),
    "female",
  );
});

test("缺省或不符合的 gender 回退至男生小旅人", () => {
  for (const search of ["", "?gender=", "?gender=Female", "?gender=girl"]) {
    assert.equal(getTravelerGenderFromSearch(search), "male");
  }
});

test("女生模式切換新版人物素材，並共用新版大合照", () => {
  const artworkPairs: Array<[TravelerArtworkName, string]> = [
    ["new-character1.webp", "new-g-character1.webp"],
    ["new-character2.webp", "new-g-character2.webp"],
    ["new-character3.webp", "new-g-character3.webp"],
    ["head.webp", "g-head.webp"],
    ["new-大合照.webp", "new-大合照.webp"],
  ];

  for (const [maleArtworkName, femaleArtworkName] of artworkPairs) {
    assert.equal(
      getTravelerArtworkName(maleArtworkName, "female"),
      femaleArtworkName,
    );
    assert.equal(
      getTravelerArtworkName(maleArtworkName, "male"),
      maleArtworkName,
    );
  }
});

test("新版人物與大合照皆為輕量 WebP 素材", () => {
  const artworkNames = [
    "new-character1.webp",
    "new-character2.webp",
    "new-character3.webp",
    "new-g-character1.webp",
    "new-g-character2.webp",
    "new-g-character3.webp",
    "new-大合照.webp",
  ];

  artworkNames.forEach((artworkName) => {
    const artwork = readFileSync(
      new URL(`../public/assets/yilan/${artworkName}`, import.meta.url),
    );

    assert.equal(artwork.subarray(0, 4).toString(), "RIFF");
    assert.equal(artwork.subarray(8, 12).toString(), "WEBP");
    assert.ok(artwork.byteLength < 200_000, `${artworkName} 檔案過大`);
  });
});

test("新版小旅人 WebP 提供三倍顯示尺寸給 Retina 螢幕", () => {
  const expectedArtworkSizes = [
    ["new-character1.webp", { height: 630, width: 333 }],
    ["new-character2.webp", { height: 654, width: 330 }],
    ["new-character3.webp", { height: 651, width: 336 }],
    ["new-g-character1.webp", { height: 630, width: 333 }],
    ["new-g-character2.webp", { height: 654, width: 330 }],
    ["new-g-character3.webp", { height: 651, width: 336 }],
  ] as const;

  expectedArtworkSizes.forEach(([artworkName, expectedSize]) => {
    assert.deepEqual(readLosslessWebpSize(artworkName), expectedSize);
  });
});
