import assert from "node:assert/strict";
import test from "node:test";
import {
  getDialogueCharacterPresentation,
  type DialogueCharacter,
} from "../app/lib/dialogue-character.ts";

test("行前對話使用揮手打招呼的小旅人", () => {
  assert.deepEqual(getDialogueCharacterPresentation("travelerWaving"), {
    height: 210,
    source: "/assets/yilan/new-character1.webp",
    width: 111,
  });
});

test("旅程完成對話使用攤開地圖的小旅人", () => {
  assert.deepEqual(getDialogueCharacterPresentation("travelerWithMap"), {
    height: 217,
    source: "/assets/yilan/new-character3.webp",
    width: 112,
  });
});

test("旅途中對話使用獨立鴨子素材", () => {
  assert.deepEqual(getDialogueCharacterPresentation("duck"), {
    height: 117,
    source: "/assets/yilan/鴨子.webp",
    width: 91,
  });
});

test("警告劇情對話使用驚慌小旅人素材", () => {
  assert.deepEqual(getDialogueCharacterPresentation("travelerWarning"), {
    height: 218,
    source: "/assets/yilan/new-character2.webp",
    width: 110,
  });
});

test("女生版本切換三種小旅人素材", () => {
  assert.equal(
    getDialogueCharacterPresentation("travelerWaving", "female").source,
    "/assets/yilan/new-g-character1.webp",
  );
  assert.equal(
    getDialogueCharacterPresentation("travelerWarning", "female").source,
    "/assets/yilan/new-g-character2.webp",
  );
  assert.equal(
    getDialogueCharacterPresentation("travelerWithMap", "female").source,
    "/assets/yilan/new-g-character3.webp",
  );
  assert.equal(
    getDialogueCharacterPresentation("duck", "female").source,
    "/assets/yilan/鴨子.webp",
  );
});

test("每個角色都指定了尺寸與素材路徑", () => {
  const characters: DialogueCharacter[] = [
    "travelerWaving",
    "travelerWithMap",
    "travelerWarning",
    "duck",
  ];

  for (const character of characters) {
    const presentation = getDialogueCharacterPresentation(character);

    assert.ok(presentation.height > 0, `${character} 缺少高度`);
    assert.ok(presentation.width > 0, `${character} 缺少寬度`);
    assert.match(presentation.source, /^\/assets\/yilan\/.+\.webp$/);
  }
});
