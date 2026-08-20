import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  loadTripEventsWithFallback,
  parseTripCsv,
} from "../app/lib/trip-csv.ts";

const csvHeader =
  "ID,日期,開始,結束,行程名稱,時間,地點,地址,交通建議,Map,商家電話,按鈕,備註,A車駕駛,A車乘客,B車駕駛,B車乘客,C車駕駛,C車乘客,房間分配,菜單,Google地圖,能量,能量文案,解鎖對應,物品文案,解鎖對應2,物品文案2,對話文案";
const csvHeaderWithDialogueCharacter = `${csvHeader},對話角色`;

test("保留同一段行程的各車駕駛與乘客", () => {
  const csvText = [
    csvHeader,
    "event-1,2026-08-29,08:30,09:30,集合,08.29 - 08.30,冬山火車站,宜蘭縣冬山鄉,,https://www.example.com/map,0212345678,看車輛分配,,小任,小安、小宇,小晴,小米,小路,小山,,,,,,,,,",
  ].join("\n");

  const result = parseTripCsv(csvText);

  assert.equal(result.events.length, 1);
  assert.deepEqual(result.events[0].vehicles, [
    { vehicle: "A", driver: "小任", passengers: ["小安", "小宇"] },
    { vehicle: "B", driver: "小晴", passengers: ["小米"] },
    { vehicle: "C", driver: "小路", passengers: ["小山"] },
  ]);
  assert.equal(result.events[0].displayTime, "08.29 - 08.30");
  assert.equal(result.events[0].merchantPhone, "0212345678");
  assert.equal(result.events[0].mapUrl, "https://www.example.com/map");
});

test("支援單位數小時並標準化為兩位數時間", () => {
  const csvText = [
    "ID,日期,開始,結束,行程名稱",
    "event-1,2026-08-30,9:00,10:30,早餐時間",
  ].join("\n");

  const result = parseTripCsv(csvText);

  assert.equal(result.warnings.length, 0);
  assert.equal(result.events.length, 1);
  assert.equal(result.events[0].startTime, "09:00");
  assert.equal(result.events[0].endTime, "10:30");
});

test("雲端 CSV 可讀時優先使用雲端資料", async () => {
  const requestedSourceUrls: string[] = [];
  const cloudCsvText = [
    csvHeader,
    "cloud-event,2026-08-29,10:00,11:00,雲端行程,10:00 - 11:00,,,,,,,,,,,,,,,,,,,,,",
  ].join("\n");
  const fetcher = (async (sourceUrl: string | URL | Request) => {
    requestedSourceUrls.push(String(sourceUrl));
    return new Response(cloudCsvText, { status: 200 });
  }) as typeof fetch;

  const result = await loadTripEventsWithFallback(
    "https://example.com/cloud.csv",
    "/data/trip-demo.csv",
    fetcher,
  );

  assert.equal(result.events[0]?.id, "cloud-event");
  assert.deepEqual(requestedSourceUrls, ["https://example.com/cloud.csv"]);
});

test("雲端 CSV 無法讀取時改用本機備援資料", async () => {
  const requestedSourceUrls: string[] = [];
  const localCsvText = [
    csvHeader,
    "local-event,2026-08-29,10:00,11:00,本機備援行程,10:00 - 11:00,,,,,,,,,,,,,,,,,,,,,",
  ].join("\n");
  const fetcher = (async (sourceUrl: string | URL | Request) => {
    const requestedSourceUrl = String(sourceUrl);
    requestedSourceUrls.push(requestedSourceUrl);
    return requestedSourceUrl === "https://example.com/cloud.csv"
      ? new Response("雲端來源失敗", { status: 503 })
      : new Response(localCsvText, { status: 200 });
  }) as typeof fetch;

  const result = await loadTripEventsWithFallback(
    "https://example.com/cloud.csv",
    "/data/trip-demo.csv",
    fetcher,
  );

  assert.equal(result.events[0]?.id, "local-event");
  assert.deepEqual(requestedSourceUrls, [
    "https://example.com/cloud.csv",
    "/data/trip-demo.csv",
  ]);
});

test("讀取交通、車輛、房間與菜單按鈕所需的行程資料", () => {
  const csvText = [
    csvHeader,
    [
      "transport-1",
      "2026-08-29",
      "10:00",
      "11:20",
      "前往宜蘭",
      "10:00 - 11:20",
      "",
      "",
      "火車、客運",
      "",
      "",
      "看交通資訊",
      ...Array(17).fill(""),
    ].join(","),
  ].join("\n");

  const result = parseTripCsv(csvText);

  assert.equal(result.events.length, 1);
  assert.equal(result.events[0].transportSuggestion, "火車、客運");
  assert.deepEqual(result.events[0].action, {
    label: "看交通資訊",
    type: "transport",
  });
});

test("房間分配以換行區分房間並以分號保留同房多張床", () => {
  const roomAssignments = [
    "主棟 - 2F A房｜雙人床：Linda、Lauren；雙人床：Jeff、Jeff 女兒",
    "貨櫃屋 - A room｜雙人床：國倫、世彥",
  ].join("\n");
  const csvText = [
    csvHeader,
    [
      "room-1",
      "2026-08-29",
      "17:50",
      "18:20",
      "民宿入住",
      "17:50 - 18:20",
      "富英農舍包棟民宿",
      "",
      "",
      "",
      "",
      "看房間分配",
      "",
      ...Array(6).fill(""),
      `"${roomAssignments}"`,
      ...Array(9).fill(""),
    ].join(","),
  ].join("\n");

  const result = parseTripCsv(csvText);

  assert.deepEqual(result.events[0].roomAssignments, [
    {
      artwork: "主建築.webp",
      details: ["雙人床：Linda、Lauren", "雙人床：Jeff、Jeff 女兒"],
      name: "主棟 - 2F A房",
    },
    {
      artwork: "貨櫃屋.webp",
      details: ["雙人床：國倫、世彥"],
      name: "貨櫃屋 - A room",
    },
  ]);
});

test("讀取行程能量與結束後解鎖的物品資料", () => {
  const csvText = [
    csvHeader,
    [
      "event-1",
      "2026-08-29",
      "11:20",
      "11:40",
      "宜蘭集合",
      "11:20 - 11:40",
      "冬山火車站",
      "宜蘭縣冬山鄉冬山村中正路1號",
      "",
      "https://maps.app.goo.gl/8rbeQDzSU4jMF91XA",
      "",
      "看車輛分配",
      "",
      ...Array(9).fill(""),
      "50%",
      "終於抵達，見到同伴們了",
      "藥水",
      "獲得來自宜蘭的神秘藥水，喝下它，就可以看見宜蘭的另類魅力！",
      "",
      "",
      "",
    ].join(","),
  ].join("\n");

  const result = parseTripCsv(csvText);

  assert.equal(result.warnings.length, 0);
  assert.equal(result.events[0].energy, 50);
  assert.equal(result.events[0].energyCopy, "終於抵達，見到同伴們了");
  assert.deepEqual(result.events[0].reward, {
    artwork: "藥水.webp",
    copy: "獲得來自宜蘭的神秘藥水，喝下它，就可以看見宜蘭的另類魅力！",
    itemId: "potion",
    name: "神秘藥水",
  });
});

test("讀取第二個獎勵欄位，一個行程可同時綁定兩個物品", () => {
  const csvText = [
    csvHeader,
    [
      "d1-lunch",
      "2026-08-29",
      "11:40",
      "13:00",
      "享用中餐",
      "11:40 - 13:00",
      "番割田甕缸雞",
      "",
      "",
      "",
      "",
      "看車輛分配",
      "",
      ...Array(9).fill(""),
      "50%",
      "終於抵達，見到同伴們了",
      "甕缸雞腿",
      "吃了香氣四溢的甕缸雞腿，獲得滿滿的力量，可以正式迎接今天的宜蘭之旅！",
      "宜蘭青蛙怪",
      "一群宜蘭青蛙怪擋住了去路，呱呱！呱呱！",
      "",
    ].join(","),
  ].join("\n");

  const result = parseTripCsv(csvText);

  assert.equal(result.warnings.length, 0);
  assert.deepEqual(result.events[0].reward, {
    artwork: "炸雞.webp",
    copy: "吃了香氣四溢的甕缸雞腿，獲得滿滿的力量，可以正式迎接今天的宜蘭之旅！",
    itemId: "fried-chicken",
    name: "甕缸雞腿",
  });
  assert.deepEqual(result.events[0].reward2, {
    artwork: "青蛙.webp",
    copy: "一群宜蘭青蛙怪擋住了去路，呱呱！呱呱！",
    itemId: "bomb",
    name: "宜蘭青蛙怪",
  });
});

test("獎勵預設啟用答題，並讀取題目與多個可接受答案", () => {
  const csvText = [
    "ID,日期,開始,結束,行程名稱,解鎖對應,物品文案,解鎖題目,正確答案",
    "event-1,2026-08-29,11:20,11:40,宜蘭集合,藥水,測試物品文案,集合地點旁的車站名稱是什麼？,冬山車站｜冬山火車站",
  ].join("\n");

  const result = parseTripCsv(csvText);

  assert.equal(result.warnings.length, 0);
  assert.deepEqual(result.events[0].reward?.challenge, {
    acceptableAnswers: ["冬山車站", "冬山火車站"],
    question: "集合地點旁的車站名稱是什麼？",
  });
});

test("啟用答題為 false 時保留原本的時間到即解鎖", () => {
  const csvText = [
    "ID,日期,開始,結束,行程名稱,解鎖對應,物品文案,解鎖題目,正確答案,啟用答題",
    "event-1,2026-08-29,13:00,14:30,雷射對決賽,盾牌,測試物品文案,,,false",
  ].join("\n");

  const result = parseTripCsv(csvText);

  assert.equal(result.warnings.length, 0);
  assert.equal(result.events[0].reward?.challenge, undefined);
});

test("同一行兩個獎勵可分別控制答題，青蛙怪不會關掉雞腿題目", () => {
  const csvText = [
    "ID,日期,開始,結束,行程名稱,解鎖對應,物品文案,解鎖題目,正確答案,解鎖對應2,物品文案2,啟用答題2",
    "event-1,2026-08-29,11:40,13:00,享用中餐,甕缸雞腿,雞腿文案,桌上的招牌料理是什麼？,甕缸雞,宜蘭青蛙怪,青蛙怪文案,false",
  ].join("\n");

  const result = parseTripCsv(csvText);

  assert.deepEqual(result.events[0].reward?.challenge, {
    acceptableAnswers: ["甕缸雞"],
    question: "桌上的招牌料理是什麼？",
  });
  assert.equal(result.events[0].reward2?.challenge, undefined);
});

test("啟用答題但題目或答案不完整時加入警告並回退為直接解鎖", () => {
  const csvText = [
    "ID,日期,開始,結束,行程名稱,解鎖對應,物品文案,解鎖題目,正確答案",
    "event-1,2026-08-29,11:20,11:40,宜蘭集合,藥水,測試物品文案,集合地點旁的車站名稱是什麼？,",
  ].join("\n");

  const result = parseTripCsv(csvText);

  assert.equal(result.events[0].reward?.challenge, undefined);
  assert.deepEqual(result.warnings, [
    { rowNumber: 2, message: "獎勵啟用答題時需要同時填寫解鎖題目與正確答案" },
  ]);
});

test("第二個獎勵只填其中一欄時保留行程並加入警告", () => {
  const csvText = [
    csvHeader,
    [
      "d1-lunch",
      "2026-08-29",
      "11:40",
      "13:00",
      "享用中餐",
      "11:40 - 13:00",
      "番割田甕缸雞",
      "",
      "",
      "",
      "",
      "看車輛分配",
      "",
      ...Array(9).fill(""),
      "50%",
      "終於抵達，見到同伴們了",
      "甕缸雞腿",
      "吃了香氣四溢的甕缸雞腿，獲得滿滿的力量，可以正式迎接今天的宜蘭之旅！",
      "宜蘭青蛙怪",
      "",
      "",
    ].join(","),
  ].join("\n");

  const result = parseTripCsv(csvText);

  assert.equal(result.events.length, 1);
  assert.equal(result.events[0].reward2, undefined);
  assert.equal(result.warnings.length, 1);
  assert.match(result.warnings[0].message, /獎勵2/);
});

test("保留行程但警告不合法能量與不完整獎勵資料", () => {
  const csvText = [
    csvHeader,
    [
      "event-1",
      "2026-08-29",
      "11:20",
      "11:40",
      "宜蘭集合",
      "11:20 - 11:40",
      "冬山火車站",
      "",
      "",
      "",
      "",
      "",
      "",
      ...Array(9).fill(""),
      "101%",
      "終於抵達，見到同伴們了",
      "藥水",
      "",
      "",
      "",
      "",
    ].join(","),
  ].join("\n");

  const result = parseTripCsv(csvText);

  assert.equal(result.events.length, 1);
  assert.equal(result.events[0].energy, undefined);
  assert.equal(result.events[0].reward, undefined);
  assert.equal(result.warnings.length, 2);
  assert.match(result.warnings[0].message, /能量/);
  assert.match(result.warnings[1].message, /獎勵/);
});

test("讀取對話文案欄位，供人物與鴨子的台詞使用", () => {
  const csvText = [
    csvHeader,
    [
      "event-1",
      "2026-08-29",
      "11:20",
      "11:40",
      "宜蘭集合",
      "11:20 - 11:40",
      "冬山火車站",
      "",
      "",
      "",
      "",
      "看車輛分配",
      "",
      ...Array(9).fill(""),
      "",
      "",
      "",
      "",
      "",
      "",
      "終於到了！這裡的空氣真好～",
    ].join(","),
  ].join("\n");

  const result = parseTripCsv(csvText);

  assert.equal(result.warnings.length, 0);
  assert.equal(result.events[0].dialogueCopy, "終於到了！這裡的空氣真好～");
});

test("讀取對話角色欄位，指定要顯示小旅人而非預設判斷", () => {
  const csvText = [
    csvHeaderWithDialogueCharacter,
    [
      "event-1",
      "2026-08-29",
      "11:20",
      "11:40",
      "宜蘭集合",
      "11:20 - 11:40",
      "冬山火車站",
      "",
      "",
      "",
      "",
      "看車輛分配",
      "",
      ...Array(9).fill(""),
      "",
      "",
      "",
      "",
      "",
      "",
      "終於到了！這裡的空氣真好～",
      "小旅人",
    ].join(","),
  ].join("\n");

  const result = parseTripCsv(csvText);

  assert.equal(result.warnings.length, 0);
  assert.equal(result.events[0].dialogueCharacter, "travelerWaving");
});

test("對話角色空白時保持 undefined", () => {
  const csvText = [
    csvHeaderWithDialogueCharacter,
    [
      "event-1",
      "2026-08-29",
      "11:20",
      "11:40",
      "宜蘭集合",
      "11:20 - 11:40",
      "冬山火車站",
      ...Array(23).fill(""),
    ].join(","),
  ].join("\n");

  const result = parseTripCsv(csvText);

  assert.equal(result.warnings.length, 0);
  assert.equal(result.events[0].dialogueCharacter, undefined);
});

test("對話文案空白時保持 undefined，不產生警告", () => {
  const csvText = [
    csvHeader,
    [
      "event-1",
      "2026-08-29",
      "11:20",
      "11:40",
      "宜蘭集合",
      "11:20 - 11:40",
      "冬山火車站",
      ...Array(22).fill(""),
    ].join(","),
  ].join("\n");

  const result = parseTripCsv(csvText);

  assert.equal(result.warnings.length, 0);
  assert.equal(result.events[0].dialogueCopy, undefined);
});

test("讀取首頁各狀態的角色與台詞", () => {
  const csvText = [
    "ID,日期,開始,結束,行程名稱,對話角色,行前對話文案,前往對話文案,進行中對話文案,休息中對話文案,完成對話文案",
    "event-1,2026-08-29,10:00,11:00,第一站,小旅人-驚慌,行前台詞,前往台詞,進行中台詞,休息台詞,完成台詞",
  ].join("\n");

  const result = parseTripCsv(csvText);

  assert.equal(result.warnings.length, 0);
  assert.equal(result.events[0].dialogueCharacter, "travelerWarning");
  assert.equal(result.events[0].preTripDialogueCopy, "行前台詞");
  assert.equal(result.events[0].enRouteDialogueCopy, "前往台詞");
  assert.equal(result.events[0].activeDialogueCopy, "進行中台詞");
  assert.equal(result.events[0].restingDialogueCopy, "休息台詞");
  assert.equal(result.events[0].tripCompleteDialogueCopy, "完成台詞");
});

test("對話角色中文標籤映射到既有角色素材", () => {
  const labelsByExpectedCharacter = new Map([
    ["鴨子", "duck"],
    ["小旅人-揮手", "travelerWaving"],
    ["小旅人-驚慌", "travelerWarning"],
    ["小旅人-地圖", "travelerWithMap"],
    ["小旅人", "travelerWaving"],
  ]);

  labelsByExpectedCharacter.forEach((expectedCharacter, label) => {
    const csvText = [
      "ID,日期,開始,結束,行程名稱,對話角色",
      `event-1,2026-08-29,10:00,11:00,第一站,${label}`,
    ].join("\n");

    const result = parseTripCsv(csvText);

    assert.equal(result.warnings.length, 0);
    assert.equal(result.events[0].dialogueCharacter, expectedCharacter);
  });
});

test("無效對話角色保留行程並加入資料警告", () => {
  const csvText = [
    "ID,日期,開始,結束,行程名稱,對話角色",
    "event-1,2026-08-29,10:00,11:00,第一站,恐龍",
  ].join("\n");

  const result = parseTripCsv(csvText);

  assert.equal(result.events.length, 1);
  assert.equal(result.events[0].dialogueCharacter, undefined);
  assert.equal(result.warnings.length, 1);
  assert.match(result.warnings[0].message, /對話角色必須是/);
});

test("舊對話文案相容為進行中台詞，且新欄優先", () => {
  const legacyResult = parseTripCsv([
    "ID,日期,開始,結束,行程名稱,對話文案",
    "event-1,2026-08-29,10:00,11:00,第一站,舊版進行中台詞",
  ].join("\n"));
  const newResult = parseTripCsv([
    "ID,日期,開始,結束,行程名稱,對話文案,進行中對話文案",
    "event-1,2026-08-29,10:00,11:00,第一站,舊版進行中台詞,新版台詞",
  ].join("\n"));

  assert.equal(legacyResult.events[0].activeDialogueCopy, "舊版進行中台詞");
  assert.equal(newResult.events[0].activeDialogueCopy, "新版台詞");
});

test("略過結束時間早於開始時間的行程", () => {
  const csvText = [
    csvHeader,
    [
      "event-1",
      "2026-08-29",
      "10:00",
      "09:30",
      "錯誤行程",
      "08.29 - 08.30",
      "示範地點",
      ...Array(22).fill(""),
    ].join(","),
  ].join("\n");

  const result = parseTripCsv(csvText);

  assert.equal(result.events.length, 0);
  assert.equal(result.warnings.length, 1);
  assert.match(result.warnings[0].message, /結束時間/);
});

test("G6 字串為 false 時返回取消後的統一行程", () => {
  const originalCsvText = readFileSync(
    new URL("../public/data/trip-demo.csv", import.meta.url),
    "utf8",
  );
  const cancelledCsvText = originalCsvText.replace(
    ",14:50 - 16:30,待確認,",
    ",14:50 - 16:30,  FALSE  ,",
  );
  assert.notEqual(cancelledCsvText, originalCsvText);

  const result = parseTripCsv(cancelledCsvText);
  const eventsById = new Map(result.events.map((event) => [event.id, event]));

  assert.equal(result.warnings.length, 0);
  assert.equal(result.events.length, 17);
  assert.equal(eventsById.has("d1-group"), false);
  assert.deepEqual(
    result.events.slice(4, 7).map((event) => event.id),
    ["d1-dessert", "d1-ricecake", "d1-scallion-pancake"],
  );
  assert.equal(eventsById.get("d1-dessert")?.displayTime, "14:50 - 16:30");
  assert.equal(eventsById.get("d1-ricecake")?.endTime, "16:30");
  assert.equal(eventsById.get("d1-scallion-pancake")?.startTime, "14:50");
  assert.equal(eventsById.get("d1-farm-park")?.displayTime, "16:30 - 17:30");
  assert.equal(eventsById.get("d1-shopping")?.endTime, "17:30");
  assert.equal(eventsById.get("d1-dessert")?.reward?.itemId, "eyes");
  assert.equal(
    result.events.filter((event) => event.reward?.itemId === "eyes").length,
    1,
  );
});

test("正式 CSV 提供兩日共十八個行程與四種按鈕資料", () => {
  const csvText = readFileSync(
    new URL("../public/data/trip-demo.csv", import.meta.url),
    "utf8",
  );
  const result = parseTripCsv(csvText);
  const actionLabels = result.events
    .map((event) => event.action?.label)
    .filter((label): label is string => Boolean(label));

  assert.equal(result.warnings.length, 0);
  assert.equal(result.events.length, 18);
  assert.equal(result.events[0].title, "前往宜蘭");
  assert.equal(result.events[1].endTime, "11:40");
  assert.equal(result.events[17].endTime, "17:00");
  assert.deepEqual(
    [...new Set(actionLabels)].sort(),
    ["看交通資訊", "看房間分配", "看菜單", "看車輛分配"].sort(),
  );
});

test("正式 CSV 保存每個行程的能量與九個物品解鎖對應", () => {
  const csvText = readFileSync(
    new URL("../public/data/trip-demo.csv", import.meta.url),
    "utf8",
  );
  const result = parseTripCsv(csvText);
  const eventsById = new Map(result.events.map((event) => [event.id, event]));
  const rewardItemIds = result.events
    .flatMap((event) => (event.reward ? [event.reward.itemId] : []));

  assert.equal(eventsById.get("d1-transport")?.energy, 100);
  assert.equal(eventsById.get("d1-dessert")?.energy, 60);
  assert.equal(eventsById.get("d2-goodbye")?.energyCopy, "整裝準備出發");
  assert.deepEqual(rewardItemIds, [
    "potion",
    "fried-chicken",
    "shield",
    "eyes",
    "drink",
    "heart",
    "lightning",
    "star",
    "apple",
  ]);
  assert.equal(eventsById.get("d1-dinner")?.reward?.itemId, "heart");
  assert.equal(eventsById.get("d1-free-time")?.reward?.itemId, "lightning");
  assert.equal(
    eventsById.get("d2-home")?.reward?.copy,
    "結束旅程，將所有旅行的回憶都放進心裡",
  );
});

test("正式 CSV 的蘋果解鎖對應會顯示為大合照", () => {
  const csvText = readFileSync(
    new URL("../public/data/trip-demo.csv", import.meta.url),
    "utf8",
  );
  const result = parseTripCsv(csvText);
  const groupPhotoReward = result.events.find(
    (event) => event.id === "d2-home",
  )?.reward;

  assert.equal(groupPhotoReward?.artwork, "照片.svg");
  assert.equal(
    groupPhotoReward?.copy,
    "結束旅程，將所有旅行的回憶都放進心裡",
  );
  assert.equal(groupPhotoReward?.itemId, "apple");
  assert.equal(groupPhotoReward?.name, "大合照");
});

test("正式 CSV 的享用中餐同時綁定甕缸雞腿與炸彈兩個獎勵", () => {
  const csvText = readFileSync(
    new URL("../public/data/trip-demo.csv", import.meta.url),
    "utf8",
  );
  const result = parseTripCsv(csvText);
  const eventsById = new Map(result.events.map((event) => [event.id, event]));

  assert.equal(eventsById.get("d1-lunch")?.reward?.itemId, "fried-chicken");
  assert.equal(eventsById.get("d1-lunch")?.reward?.name, "甕缸雞腿");
  assert.equal(eventsById.get("d1-lunch")?.reward?.artwork, "炸雞.webp");
  assert.equal(eventsById.get("d1-lunch")?.reward2?.itemId, "bomb");
  assert.equal(eventsById.get("d1-laser")?.reward?.itemId, "shield");
  assert.equal(
    eventsById.get("d1-laser")?.energyCopy,
    "戰意沸騰",
  );
});

test("正式 CSV 的八個收藏使用答題，青蛙怪與盾牌維持直接解鎖", () => {
  const csvText = readFileSync(
    new URL("../public/data/trip-demo.csv", import.meta.url),
    "utf8",
  );
  const result = parseTripCsv(csvText);
  const rewards = result.events.flatMap((event) =>
    [event.reward, event.reward2].filter(
      (reward): reward is NonNullable<typeof reward> => reward !== undefined,
    ),
  );

  assert.deepEqual(
    rewards
      .filter((reward) => reward.challenge)
      .map((reward) => reward.itemId),
    [
      "potion",
      "fried-chicken",
      "eyes",
      "drink",
      "heart",
      "lightning",
      "star",
      "apple",
    ],
  );
  assert.equal(
    rewards.find((reward) => reward.itemId === "bomb")?.challenge,
    undefined,
  );
  assert.equal(
    rewards.find((reward) => reward.itemId === "shield")?.challenge,
    undefined,
  );
});

test("正式 CSV 的能量文案維持短狀態，角色台詞承接故事與宜蘭知識", () => {
  const csvText = readFileSync(
    new URL("../public/data/trip-demo.csv", import.meta.url),
    "utf8",
  );
  const result = parseTripCsv(csvText);
  const eventsById = new Map(result.events.map((event) => [event.id, event]));
  const expectedEnergyCopyById = new Map([
    ["d1-transport", "期待值滿格"],
    ["d1-meet", "夥伴集合完畢"],
    ["d1-lunch", "補充能量中"],
    ["d1-laser", "戰意沸騰"],
    ["d1-group", "小隊同步中"],
    ["d1-dessert", "自由探索中"],
    ["d1-ricecake", "自由探索中"],
    ["d1-scallion-pancake", "自由探索中"],
    ["d1-farm-park", "採買模式開啟"],
    ["d1-shopping", "採買模式開啟"],
    ["d1-checkin", "需要稍作休息"],
    ["d1-dinner", "能量快速回升"],
    ["d1-free-time", "歡樂值上升"],
    ["d1-night-market", "宵夜雷達啟動"],
    ["d2-breakfast", "元氣重新滿格"],
    ["d2-goodbye", "整裝準備出發"],
    ["d2-luodong", "最後巡禮中"],
    ["d2-home", "能量緩慢下降"],
  ]);

  assert.equal(result.events.length, 18);
  assert.equal(result.warnings.length, 0);
  expectedEnergyCopyById.forEach((expectedCopy, id) => {
    assert.equal(eventsById.get(id)?.energyCopy, expectedCopy);
    assert.ok(expectedCopy.length <= 8);
  });

  assert.equal(
    result.events.filter((event) => event.activeDialogueCopy).length,
    15,
  );
  assert.equal(
    result.events.filter((event) => event.enRouteDialogueCopy).length,
    4,
  );
  assert.equal(
    result.events.filter((event) => event.restingDialogueCopy).length,
    1,
  );
  assert.equal(
    result.events.filter((event) => event.preTripDialogueCopy).length,
    1,
  );
  assert.equal(
    result.events.filter((event) => event.tripCompleteDialogueCopy).length,
    1,
  );

  assert.match(
    eventsById.get("d1-lunch")?.activeDialogueCopy ?? "",
    /甕缸雞.*雞油拌飯/,
  );
  assert.doesNotMatch(eventsById.get("d1-lunch")?.activeDialogueCopy ?? "", /炸雞/);
  const breakfastDialogueCopy =
    eventsById.get("d2-breakfast")?.activeDialogueCopy ?? "";
  assert.match(breakfastDialogueCopy, /宜蘭/);
  assert.match(breakfastDialogueCopy, /飯糰/);
  assert.match(breakfastDialogueCopy, /油條/);
  assert.equal(
    eventsById.get("d1-laser")?.enRouteDialogueCopy,
    "好像有一大群青蛙怪擋在路中央，還向我們發出戰鬥邀請，大家準備好了嗎？",
  );
  assert.equal(
    eventsById.get("d1-group")?.enRouteDialogueCopy,
    "危機解除！大家成功突破青蛙怪的阻擋，宜蘭冒險繼續前進～",
  );
  assert.match(
    eventsById.get("d1-dessert")?.enRouteDialogueCopy ?? "",
    /三十多年的做粿手藝.*小華村米粿.*金珠蔥油餅/,
  );
  assert.match(
    eventsById.get("d1-dessert")?.activeDialogueCopy ?? "",
    /河流與水田.*米食、茶和香魚/,
  );
  assert.match(
    eventsById.get("d1-night-market")?.activeDialogueCopy ?? "",
    /中山公園.*龍鳳腿.*羊肉湯.*包心粉圓/,
  );
  assert.match(
    eventsById.get("d2-luodong")?.activeDialogueCopy ?? "",
    /奕順軒.*諾貝爾.*奶凍捲.*牛舌餅/,
  );
});
