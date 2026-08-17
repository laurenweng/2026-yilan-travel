import type { BackpackArtwork, BackpackItemId } from "./backpack-catalog";
import type { DialogueCharacter } from "./dialogue-character";

export type VehicleCode = "A" | "B" | "C";

export type VehicleAssignment = {
  vehicle: VehicleCode;
  driver: string;
  passengers: string[];
};

export type TripActionType = "transport" | "vehicle" | "room" | "menu";

export type TripAction = {
  label: string;
  type: TripActionType;
};

export type TripReward = {
  artwork: BackpackArtwork;
  copy: string;
  itemId: BackpackItemId;
  name: string;
};

export type RoomAssignment = {
  artwork: "主建築.webp" | "貨櫃屋.webp";
  details: string[];
  name: string;
};

export type TripEvent = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  displayTime: string;
  location: string;
  place?: string;
  address?: string;
  transportSuggestion?: string;
  action?: TripAction;
  merchantPhone?: string;
  note?: string;
  energy?: number;
  energyCopy?: string;
  /** 首頁人物或鴨子導遊的台詞；哪一筆行程的值會顯示由畫面階段決定。 */
  dialogueCopy?: string;
  dialogueCharacter?: DialogueCharacter;
  preTripDialogueCopy?: string;
  enRouteDialogueCopy?: string;
  activeDialogueCopy?: string;
  restingDialogueCopy?: string;
  tripCompleteDialogueCopy?: string;
  reward?: TripReward;
  /** 少數行程（如享用中餐）同時綁定兩個獎勵，解鎖時間與 reward 相同。 */
  reward2?: TripReward;
  vehicles: VehicleAssignment[];
  roomAssignments: RoomAssignment[];
  menuItems: string[];
  mapUrl?: string;
};

export type TripDataWarning = {
  rowNumber: number;
  message: string;
};

export type TripParseResult = {
  events: TripEvent[];
  warnings: TripDataWarning[];
};

export type TripPhase =
  | "pre_trip"
  | "active"
  | "en_route"
  | "resting"
  | "trip_complete";

export type TripSnapshot = {
  phase: TripPhase;
  /** 目前進行中的所有行程（同時段會有多筆）。 */
  currentEvents: TripEvent[];
  /** 下一時段同時開始的所有行程。 */
  nextEvents: TripEvent[];
  /** 目前最近一次結束的所有行程（同時段結束會有多筆）。 */
  justEndedEvents: TripEvent[];
  /** 相容用單筆欄位，等於 `currentEvents[0] ?? null`。 */
  currentEvent: TripEvent | null;
  /** 相容用單筆欄位，等於 `nextEvents[0] ?? null`。 */
  nextEvent: TripEvent | null;
  /** 相容用單筆欄位，等於 `justEndedEvents[0] ?? null`。 */
  justEndedEvent: TripEvent | null;
};
