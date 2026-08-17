import Papa from "papaparse";
import type {
  RoomAssignment,
  TripDataWarning,
  TripEvent,
  TripParseResult,
  VehicleAssignment,
  VehicleCode,
} from "./trip-types";
import { findBackpackItemByArtwork } from "./backpack-catalog";
import { applyTripScheduleRules } from "./trip-schedule-rules";

type TripCsvRow = {
  ID?: string;
  日期?: string;
  開始?: string;
  結束?: string;
  行程名稱?: string;
  活動?: string;
  時間?: string;
  地址?: string;
  地點?: string;
  商家電話?: string;
  Map?: string;
  備註?: string;
  交通建議?: string;
  按鈕?: string;
  A車駕駛?: string;
  A車乘客?: string;
  B車駕駛?: string;
  B車乘客?: string;
  C車駕駛?: string;
  C車乘客?: string;
  房間分配?: string;
  菜單?: string;
  Google地圖?: string;
  能量?: string;
  能量文案?: string;
  解鎖對應?: string;
  物品文案?: string;
  文案?: string;
  解鎖對應2?: string;
  物品文案2?: string;
  對話文案?: string;
  對話角色?: string;
  行前對話文案?: string;
  前往對話文案?: string;
  進行中對話文案?: string;
  休息中對話文案?: string;
  完成對話文案?: string;
};

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^(?:[01]?\d|2[0-3]):[0-5]\d$/;

const normalizeText = (value?: string) => value?.trim() ?? "";

const normalizeTime = (value?: string) => {
  const normalizedValue = normalizeText(value);
  if (!timePattern.test(normalizedValue)) return normalizedValue;

  const [hour, minute] = normalizedValue.split(":");
  return `${hour.padStart(2, "0")}:${minute}`;
};

const readFirstText = (...values: Array<string | undefined>) =>
  values.map(normalizeText).find(Boolean) ?? "";

const splitList = (value?: string) =>
  normalizeText(value)
    .split(/[、\n]/)
    .map((item) => item.trim())
    .filter(Boolean);

const parseRoomAssignments = (value?: string): RoomAssignment[] =>
  normalizeText(value)
    .split(/\r?\n/)
    .map((roomLine) => roomLine.trim())
    .filter(Boolean)
    .map((roomLine) => {
      const [roomName, ...roomDetailParts] = roomLine.split("｜");
      const roomDetails = roomDetailParts
        .join("｜")
        .split("；")
        .map((roomDetail) => roomDetail.trim())
        .filter(Boolean);

      return {
        artwork: roomName.includes("貨櫃屋") ? "貨櫃屋.webp" : "主建築.webp",
        details: roomDetails,
        name: roomName.trim(),
      };
    });

const isValidDate = (date: string) => {
  if (!datePattern.test(date)) return false;

  const [year, month, day] = date.split("-").map(Number);
  const parsedDate = new Date(Date.UTC(year, month - 1, day));

  return (
    parsedDate.getUTCFullYear() === year &&
    parsedDate.getUTCMonth() === month - 1 &&
    parsedDate.getUTCDate() === day
  );
};

const toTaipeiTimestamp = (date: string, time: string) =>
  Date.parse(`${date}T${time}:00+08:00`);

const readHttpsUrl = (value?: string) => {
  const normalizedValue = normalizeText(value);
  if (!normalizedValue) return undefined;

  try {
    const url = new URL(normalizedValue);
    return url.protocol === "https:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
};

const actionTypeByLabel = {
  看交通資訊: "transport",
  看車輛分配: "vehicle",
  看房間分配: "room",
  看菜單: "menu",
} as const;

const createAction = (value?: string) => {
  const label = normalizeText(value);
  const type = actionTypeByLabel[label as keyof typeof actionTypeByLabel];

  return type ? { label, type } : undefined;
};

const createVehicleAssignment = (
  vehicle: VehicleCode,
  driver?: string,
  passengers?: string,
): VehicleAssignment | null => {
  const normalizedDriver = normalizeText(driver);
  const normalizedPassengers = splitList(passengers);

  if (!normalizedDriver && normalizedPassengers.length === 0) return null;

  return {
    vehicle,
    driver: normalizedDriver,
    passengers: normalizedPassengers,
  };
};

const createVehicles = (row: TripCsvRow) =>
  [
    createVehicleAssignment("A", row.A車駕駛, row.A車乘客),
    createVehicleAssignment("B", row.B車駕駛, row.B車乘客),
    createVehicleAssignment("C", row.C車駕駛, row.C車乘客),
  ].filter((vehicle): vehicle is VehicleAssignment => vehicle !== null);

const parseEnergy = (
  value: string | undefined,
  warnings: TripDataWarning[],
  rowNumber: number,
) => {
  const normalizedValue = normalizeText(value);
  if (!normalizedValue) return undefined;

  const energyMatch = normalizedValue.match(/^(\d{1,3})%?$/);
  const energy = energyMatch ? Number(energyMatch[1]) : Number.NaN;

  if (!Number.isInteger(energy) || energy < 0 || energy > 100) {
    warnings.push({ rowNumber, message: "能量必須是 0% 到 100% 的整數" });
    return undefined;
  }

  return energy;
};

const dialogueCharacterByLabel = {
  鴨子: "duck",
  "小旅人-揮手": "travelerWaving",
  "小旅人-驚慌": "travelerWarning",
  "小旅人-地圖": "travelerWithMap",
  小旅人: "travelerWaving",
} as const;

const parseDialogueCharacter = (
  value: string | undefined,
  warnings: TripDataWarning[],
  rowNumber: number,
) => {
  const normalizedValue = normalizeText(value);
  if (!normalizedValue) return undefined;

  const character =
    dialogueCharacterByLabel[
      normalizedValue as keyof typeof dialogueCharacterByLabel
    ];
  if (character) return character;

  warnings.push({
    rowNumber,
    message:
      "對話角色必須是鴨子、小旅人-揮手、小旅人-驚慌或小旅人-地圖",
  });
  return undefined;
};

const createRewardFromValues = (
  artworkValue: string,
  copy: string,
  warnings: TripDataWarning[],
  rowNumber: number,
  label: string,
) => {
  if (!artworkValue && !copy) return undefined;

  if (!artworkValue || !copy) {
    warnings.push({ rowNumber, message: `${label}需要同時填寫解鎖對應與物品文案` });
    return undefined;
  }

  const backpackItem = findBackpackItemByArtwork(artworkValue);
  if (!backpackItem) {
    warnings.push({ rowNumber, message: `${label}的解鎖對應找不到背包物品` });
    return undefined;
  }

  return {
    artwork: backpackItem.artwork,
    copy,
    itemId: backpackItem.id,
    name: backpackItem.name,
  };
};

const createReward = (
  row: TripCsvRow,
  warnings: TripDataWarning[],
  rowNumber: number,
) =>
  createRewardFromValues(
    normalizeText(row.解鎖對應),
    readFirstText(row.物品文案, row.文案),
    warnings,
    rowNumber,
    "獎勵",
  );

const createReward2 = (
  row: TripCsvRow,
  warnings: TripDataWarning[],
  rowNumber: number,
) =>
  createRewardFromValues(
    normalizeText(row.解鎖對應2),
    normalizeText(row.物品文案2),
    warnings,
    rowNumber,
    "獎勵2",
  );

const isRowValid = (row: TripCsvRow, warnings: TripDataWarning[], rowNumber: number) => {
  const id = normalizeText(row.ID);
  const date = normalizeText(row.日期);
  const startTime = normalizeTime(row.開始);
  const endTime = normalizeTime(row.結束);
  const title = readFirstText(row.行程名稱, row.活動);

  if (!id || !isValidDate(date) || !timePattern.test(startTime) || !timePattern.test(endTime) || !title) {
    warnings.push({ rowNumber, message: "缺少必填欄位或日期時間格式錯誤" });
    return false;
  }

  if (toTaipeiTimestamp(date, endTime) <= toTaipeiTimestamp(date, startTime)) {
    warnings.push({ rowNumber, message: "結束時間必須晚於開始時間" });
    return false;
  }

  return true;
};

/** 將 Google Sheets 發布的 CSV 轉為已驗證、依時間排序的行程資料。 */
export const parseTripCsv = (csvText: string): TripParseResult => {
  const parsedCsv = Papa.parse<TripCsvRow>(csvText, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header) => header.trim(),
  });
  const warnings: TripDataWarning[] = parsedCsv.errors.map((error) => ({
    rowNumber: (error.row ?? 0) + 2,
    message: error.message,
  }));
  const eventIds = new Set<string>();
  const events: TripEvent[] = [];

  parsedCsv.data.forEach((row, index) => {
    const rowNumber = index + 2;
    if (!isRowValid(row, warnings, rowNumber)) return;

    const id = normalizeText(row.ID);
    if (eventIds.has(id)) {
      warnings.push({ rowNumber, message: "ID 不可重複" });
      return;
    }

    eventIds.add(id);
    const energy = parseEnergy(row.能量, warnings, rowNumber);
    const reward = createReward(row, warnings, rowNumber);
    const reward2 = createReward2(row, warnings, rowNumber);
    events.push({
      id,
      date: normalizeText(row.日期),
      startTime: normalizeTime(row.開始),
      endTime: normalizeTime(row.結束),
      title: readFirstText(row.行程名稱, row.活動),
      displayTime:
        normalizeText(row.時間) ||
        `${normalizeTime(row.開始)} - ${normalizeTime(row.結束)}`,
      location: readFirstText(row.地址, row.地點),
      place: normalizeText(row.地點) || undefined,
      address: normalizeText(row.地址) || undefined,
      transportSuggestion: normalizeText(row.交通建議) || undefined,
      action: createAction(row.按鈕),
      merchantPhone: normalizeText(row.商家電話) || undefined,
      note: normalizeText(row.備註) || undefined,
      energy,
      energyCopy: normalizeText(row.能量文案) || undefined,
      dialogueCopy: normalizeText(row.對話文案) || undefined,
      dialogueCharacter: parseDialogueCharacter(
        row.對話角色,
        warnings,
        rowNumber,
      ),
      preTripDialogueCopy: normalizeText(row.行前對話文案) || undefined,
      enRouteDialogueCopy: normalizeText(row.前往對話文案) || undefined,
      activeDialogueCopy:
        readFirstText(row.進行中對話文案, row.對話文案) || undefined,
      restingDialogueCopy: normalizeText(row.休息中對話文案) || undefined,
      tripCompleteDialogueCopy:
        normalizeText(row.完成對話文案) || undefined,
      reward,
      reward2,
      vehicles: createVehicles(row),
      roomAssignments: parseRoomAssignments(row.房間分配),
      menuItems: splitList(row.菜單),
      mapUrl: readHttpsUrl(readFirstText(row.Map, row.Google地圖)),
    });
  });

  const scheduledEvents = applyTripScheduleRules(events);
  scheduledEvents.sort((firstEvent, secondEvent) =>
    `${firstEvent.date}T${firstEvent.startTime}`.localeCompare(
      `${secondEvent.date}T${secondEvent.startTime}`,
    ),
  );

  return { events: scheduledEvents, warnings };
};

/** 每次開啟或按下更新時讀取 CSV，不快取行程資料。 */
export const loadTripEvents = async (
  sourceUrl: string,
  fetcher: typeof fetch = fetch,
): Promise<TripParseResult> => {
  const response = await fetcher(sourceUrl, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`目前無法取得行程（${response.status}）`);
  }

  return parseTripCsv(await response.text());
};

/** 雲端資料來源無法讀取時，改用本機 CSV，避免行程畫面完全失效。 */
export const loadTripEventsWithFallback = async (
  primarySourceUrl: string,
  fallbackSourceUrl: string,
  fetcher: typeof fetch = fetch,
): Promise<TripParseResult> => {
  try {
    return await loadTripEvents(primarySourceUrl, fetcher);
  } catch {
    return loadTripEvents(fallbackSourceUrl, fetcher);
  }
};
