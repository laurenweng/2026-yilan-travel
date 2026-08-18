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
    height: 210,
    source: "/assets/yilan/new-character1.webp",
    width: 111,
  },
  /** 攤開地圖，用於旅程完成。 */
  travelerWithMap: {
    height: 217,
    source: "/assets/yilan/new-character3.webp",
    width: 112,
  },
  /** 驚慌護著背包，用於警告類行程（如雷射對決賽）。 */
  travelerWarning: {
    height: 218,
    source: "/assets/yilan/new-character2.webp",
    width: 110,
  },
  duck: {
    height: 117,
    source: "/assets/yilan/鴨子.webp",
    width: 91,
  },
} as const;

const travelerArtworkNames: Record<
  Exclude<DialogueCharacter, "duck">,
  TravelerArtworkName
> = {
  travelerWaving: "new-character1.webp",
  travelerWithMap: "new-character3.webp",
  travelerWarning: "new-character2.webp",
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
