/**
 * 首頁對話框的角色設定。各狀態要出場哪個角色由 `home-view.tsx` 決定，
 * 這裡只負責記錄每個角色的素材與尺寸。
 */
import {
  getTravelerArtworkName,
  type TravelerArtworkName,
  type TravelerGender,
} from "./traveler-gender";

export type DialogueCharacter =
  | "travelerWaving"
  | "travelerWithMap"
  | "travelerWarning"
  | "duck";

const dialogueCharacterPresentations = {
  /** 揮手打招呼，用於行前狀態。 */
  travelerWaving: {
    height: 191,
    source: "/assets/yilan/character1.svg",
    width: 101,
  },
  /** 攤開地圖，用於旅程完成。 */
  travelerWithMap: {
    height: 197,
    source: "/assets/yilan/character3.svg",
    width: 102,
  },
  /** 驚慌護著背包，用於警告類行程（如雷射對決賽）。 */
  travelerWarning: {
    height: 198,
    source: "/assets/yilan/character2.svg",
    width: 100,
  },
  duck: {
    height: 117,
    source: "/assets/yilan/鴨子.svg",
    width: 91,
  },
} as const;

const travelerArtworkNames: Record<
  Exclude<DialogueCharacter, "duck">,
  TravelerArtworkName
> = {
  travelerWaving: "character1.svg",
  travelerWithMap: "character3.svg",
  travelerWarning: "character2.svg",
};

export const getDialogueCharacterPresentation = (
  character: DialogueCharacter,
  travelerGender: TravelerGender = "male",
) => {
  const presentation = dialogueCharacterPresentations[character];

  if (character === "duck") return presentation;

  return {
    ...presentation,
    source: `/assets/yilan/${getTravelerArtworkName(
      travelerArtworkNames[character],
      travelerGender,
    )}`,
  };
};
