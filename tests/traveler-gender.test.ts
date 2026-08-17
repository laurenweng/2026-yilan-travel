import assert from "node:assert/strict";
import test from "node:test";
import {
  getTravelerArtworkName,
  getTravelerGenderFromSearch,
  type TravelerArtworkName,
} from "../app/lib/traveler-gender.ts";

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

test("女生模式切換所有五組小旅人素材", () => {
  const artworkPairs: Array<[TravelerArtworkName, string]> = [
    ["character1.webp", "g-character1.webp"],
    ["character2.webp", "g-character2.webp"],
    ["character3.webp", "g-character3.webp"],
    ["head.webp", "g-head.webp"],
    ["大合照.webp", "g-大合照.webp"],
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
