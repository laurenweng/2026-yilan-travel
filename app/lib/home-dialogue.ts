import type { DialogueCharacter } from "./dialogue-character";
import type { TripEvent, TripPhase, TripSnapshot } from "./trip-types";

export type HomeDialoguePresentation = {
  character: DialogueCharacter;
  copy: string;
};

type DialogueCopyField = keyof Pick<
  TripEvent,
  | "activeDialogueCopy"
  | "enRouteDialogueCopy"
  | "preTripDialogueCopy"
  | "restingDialogueCopy"
  | "tripCompleteDialogueCopy"
>;

/** 每個階段在 CSV 沒有對應對話文案時顯示的預設台詞。 */
export const defaultHomeDialogueCopy: Record<TripPhase, string> = {
  active: "我是宜蘭導遊丸鴨！今天就由我帶大家一起玩吧～",
  en_route: "下一站準備出發，跟緊隊伍別掉隊囉～",
  pre_trip: "我是小旅人，東西都帶齊了嗎？再檢查一次吧！",
  resting: "今天辛苦啦！先好好休息，明天再繼續冒險～",
  trip_complete: "旅程結束囉！快去我的背包看看這趟收集到的紀念品吧！",
};

const defaultHomeDialogueCharacter: Record<TripPhase, DialogueCharacter> = {
  active: "duck",
  en_route: "duck",
  pre_trip: "travelerWaving",
  resting: "duck",
  trip_complete: "travelerWithMap",
};

const findDialogueEvent = (
  sourceEvents: TripEvent[],
  dialogueCopyField: DialogueCopyField,
) => sourceEvents.find((event) => event[dialogueCopyField]);

/** 依首頁階段從同一筆行程解析唯一角色與台詞。 */
export const resolveHomeDialogue = (
  events: TripEvent[],
  snapshot: TripSnapshot,
): HomeDialoguePresentation => {
  let sourceEvents: TripEvent[];
  let dialogueCopyField: DialogueCopyField;

  if (snapshot.phase === "pre_trip") {
    sourceEvents = events[0] ? [events[0]] : [];
    dialogueCopyField = "preTripDialogueCopy";
  } else if (snapshot.phase === "active") {
    sourceEvents = snapshot.currentEvents;
    dialogueCopyField = "activeDialogueCopy";
  } else if (snapshot.phase === "en_route") {
    sourceEvents = snapshot.nextEvents;
    dialogueCopyField = "enRouteDialogueCopy";
  } else if (snapshot.phase === "resting") {
    sourceEvents = snapshot.justEndedEvents;
    dialogueCopyField = "restingDialogueCopy";
  } else {
    const lastEvent = events.at(-1);
    sourceEvents = lastEvent ? [lastEvent] : [];
    dialogueCopyField = "tripCompleteDialogueCopy";
  }

  const dialogueEvent = findDialogueEvent(sourceEvents, dialogueCopyField);

  return {
    character:
      dialogueEvent?.dialogueCharacter ??
      defaultHomeDialogueCharacter[snapshot.phase],
    copy:
      dialogueEvent?.[dialogueCopyField] ??
      defaultHomeDialogueCopy[snapshot.phase],
  };
};
