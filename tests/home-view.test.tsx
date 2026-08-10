import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { isValidElement, type ReactElement, type ReactNode } from "react";
import { CharacterDialogue } from "../app/components/trip-handbook/character-dialogue";
import { HomeView } from "../app/components/trip-handbook/home-view";
import type { TripEvent, TripSnapshot } from "../app/lib/trip-types";

const activeEvent: TripEvent = {
  date: "2026-08-29",
  displayTime: "08:30 - 10:00",
  endTime: "10:00",
  id: "first-event",
  location: "宜蘭",
  menuItems: [],
  note: "",
  roomAssignments: [],
  startTime: "08:30",
  title: "第一站",
  vehicles: [],
};

const makeEvent = (
  id: string,
  title: string,
  place?: string,
): TripEvent => ({
  date: "2026-08-29",
  displayTime: "16:50 - 17:20",
  endTime: "17:20",
  id,
  location: place ?? "",
  menuItems: [],
  place,
  roomAssignments: [],
  startTime: "16:50",
  title,
  vehicles: [],
});

const dongshanEvents: TripEvent[] = [
  makeEvent("d1-dessert", "冬山自由觀光（推薦行程）", "鹽滷豆花專賣店"),
  makeEvent("d1-ricecake", "冬山自由觀光（推薦行程）", "小華村純米手作粿店"),
  makeEvent("d1-scallion-pancake", "冬山自由觀光（推薦行程）", "冬山金珠蔥油餅"),
];

const activeSnapshot: TripSnapshot = {
  currentEvents: [activeEvent],
  nextEvents: [],
  justEndedEvents: [],
  currentEvent: activeEvent,
  nextEvent: null,
  justEndedEvent: null,
  phase: "active",
};

const concurrentActiveSnapshot: TripSnapshot = {
  currentEvents: dongshanEvents,
  nextEvents: [],
  justEndedEvents: [],
  currentEvent: dongshanEvents[0],
  nextEvent: null,
  justEndedEvent: null,
  phase: "active",
};

const enRouteSnapshot: TripSnapshot = {
  currentEvents: [],
  nextEvents: [activeEvent],
  justEndedEvents: [],
  currentEvent: null,
  nextEvent: activeEvent,
  justEndedEvent: null,
  phase: "en_route",
};

const concurrentEnRouteSnapshot: TripSnapshot = {
  currentEvents: [],
  nextEvents: dongshanEvents,
  justEndedEvents: [],
  currentEvent: null,
  nextEvent: dongshanEvents[0],
  justEndedEvent: null,
  phase: "en_route",
};

const completeSnapshot: TripSnapshot = {
  currentEvents: [],
  nextEvents: [],
  justEndedEvents: [],
  currentEvent: null,
  nextEvent: null,
  justEndedEvent: null,
  phase: "trip_complete",
};

const findElementByClassName = (
  node: ReactNode,
  className: string,
): ReactElement | null => {
  if (Array.isArray(node)) {
    for (const child of node) {
      const match = findElementByClassName(child, className);
      if (match) return match;
    }

    return null;
  }

  if (!isValidElement<{ children?: ReactNode; className?: string }>(node)) {
    return null;
  }

  if (node.props.className?.split(" ").includes(className)) return node;

  if (typeof node.type === "function") {
    const Component = node.type as (props: unknown) => ReactNode;
    return findElementByClassName(Component(node.props), className);
  }

  return findElementByClassName(node.props.children, className);
};

const collectText = (node: ReactNode): string => {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);

  if (Array.isArray(node)) {
    return node.map((child) => collectText(child)).join(" ");
  }

  if (!isValidElement<{ children?: ReactNode }>(node)) return "";

  if (typeof node.type === "function") {
    const Component = node.type as (props: unknown) => ReactNode;
    return collectText(Component(node.props));
  }

  return collectText(node.props.children);
};

test("丸鴨對話輸出可供定位的角色 class", () => {
  const dialogue = CharacterDialogue({
    character: "duck",
    children: "丸鴨台詞",
    className: "duck-dialogue",
  });

  assert.ok(findElementByClassName(dialogue, "character-dialogue--duck"));
});

const countElementsByClassName = (node: ReactNode, className: string): number => {
  if (Array.isArray(node)) {
    return node.reduce<number>(
      (total, child) => total + countElementsByClassName(child, className),
      0,
    );
  }

  if (!isValidElement<{ children?: ReactNode; className?: string }>(node)) {
    return 0;
  }

  const selfCount = node.props.className?.split(" ").includes(className) ? 1 : 0;

  if (typeof node.type === "function") {
    const Component = node.type as (props: unknown) => ReactNode;
    return selfCount + countElementsByClassName(Component(node.props), className);
  }

  return selfCount + countElementsByClassName(node.props.children, className);
};

const countComponentInstances = (node: ReactNode, component: unknown): number => {
  if (Array.isArray(node)) {
    return node.reduce<number>(
      (total, child) => total + countComponentInstances(child, component),
      0,
    );
  }

  if (!isValidElement<{ children?: ReactNode }>(node)) return 0;

  return (
    (node.type === component ? 1 : 0) +
    countComponentInstances(node.props.children, component)
  );
};

test("同時段同名稱的行程合併成一筆時間與一筆名稱，底下列出各自地點", () => {
  const view = HomeView({
    events: [],
    loadState: "ready",
    onRefresh: () => {},
    snapshot: concurrentActiveSnapshot,
    warningCount: 0,
  });
  const eventCard = findElementByClassName(view, "home-event-card");

  assert.ok(eventCard);
  assert.equal(countElementsByClassName(view, "home-event-card"), 1);
  assert.equal(countElementsByClassName(view, "home-event-row"), 1);
  assert.equal(countElementsByClassName(view, "home-event-title-group"), 1);
  assert.equal(countElementsByClassName(view, "home-event-place"), 3);

  const cardText = collectText(eventCard);
  assert.match(cardText, /現在進行中/);
  assert.match(cardText, /鹽滷豆花專賣店/);
  assert.match(cardText, /小華村純米手作粿店/);
  assert.match(cardText, /冬山金珠蔥油餅/);
});

test("同時段但名稱不同的行程共用一個時間，但分成不同名稱區塊", () => {
  const farmParkEvent: TripEvent = {
    ...makeEvent("d1-farm-park", "補助推薦景點", "良食農創園區"),
    endTime: "17:50",
    startTime: "17:20",
  };
  const shoppingEvent: TripEvent = {
    ...makeEvent("d1-shopping", "採買時間", "喜互惠生鮮超市冬山店"),
    endTime: "17:50",
    startTime: "17:20",
  };
  const view = HomeView({
    events: [],
    loadState: "ready",
    onRefresh: () => {},
    snapshot: {
      currentEvents: [farmParkEvent, shoppingEvent],
      nextEvents: [],
      justEndedEvents: [],
      currentEvent: farmParkEvent,
      nextEvent: null,
      justEndedEvent: null,
      phase: "active",
    },
    warningCount: 0,
  });

  assert.equal(countElementsByClassName(view, "home-event-row"), 1);
  assert.equal(countElementsByClassName(view, "home-event-title-group"), 2);
  assert.equal(
    collectText(findElementByClassName(view, "home-event-card"))
      .match(/17:20–17:50/g)?.length,
    1,
  );
});

test("有地點才顯示地點，沒有地點就不顯示該行", () => {
  const withPlace = makeEvent("d1-lunch", "享用中餐", "番割田甕缸雞");
  const withoutPlace = makeEvent("d1-group", "共同行程", undefined);

  const withPlaceView = HomeView({
    events: [],
    loadState: "ready",
    onRefresh: () => {},
    snapshot: {
      currentEvents: [withPlace],
      nextEvents: [],
      justEndedEvents: [],
      currentEvent: withPlace,
      nextEvent: null,
      justEndedEvent: null,
      phase: "active",
    },
    warningCount: 0,
  });
  const withoutPlaceView = HomeView({
    events: [],
    loadState: "ready",
    onRefresh: () => {},
    snapshot: {
      currentEvents: [withoutPlace],
      nextEvents: [],
      justEndedEvents: [],
      currentEvent: withoutPlace,
      nextEvent: null,
      justEndedEvent: null,
      phase: "active",
    },
    warningCount: 0,
  });

  assert.equal(countElementsByClassName(withPlaceView, "home-event-place"), 1);
  assert.match(collectText(withPlaceView), /番割田甕缸雞/);

  assert.equal(
    countElementsByClassName(withoutPlaceView, "home-event-place"),
    0,
  );
});

test("有能量與能量文案時，能量條與文案取自目前行程的第一筆", () => {
  const eventWithEnergy: TripEvent = {
    ...makeEvent("d1-checkin", "民宿入住", "富英農舍包棟民宿"),
    energy: 20,
    energyCopy: "終於到民宿啦～重頭戲開始！",
  };
  const view = HomeView({
    events: [],
    loadState: "ready",
    onRefresh: () => {},
    snapshot: {
      currentEvents: [eventWithEnergy],
      nextEvents: [],
      justEndedEvents: [],
      currentEvent: eventWithEnergy,
      nextEvent: null,
      justEndedEvent: null,
      phase: "active",
    },
    warningCount: 0,
  });
  const energyBar = findElementByClassName(view, "energy-bar");

  assert.ok(energyBar);
  assert.equal(energyBar.props["aria-valuenow"], 20);
  assert.match(collectText(view), /終於到民宿啦～重頭戲開始！/);
});

test("行程結束但下一站還沒開始的空檔，能量條與文案維持顯示剛結束的行程", () => {
  const checkinEvent: TripEvent = {
    ...makeEvent("d1-checkin", "民宿入住", "富英農舍包棟民宿"),
    energy: 20,
    energyCopy: "終於到民宿啦～重頭戲開始！",
  };
  const dinnerEvent: TripEvent = {
    ...makeEvent("d1-dinner", "晚餐時間", "富英農舍包棟民宿"),
    energy: 80,
    energyCopy: "我最期待烤肉車！",
  };
  const view = HomeView({
    events: [],
    loadState: "ready",
    onRefresh: () => {},
    snapshot: {
      currentEvents: [],
      nextEvents: [dinnerEvent],
      justEndedEvents: [checkinEvent],
      currentEvent: null,
      nextEvent: dinnerEvent,
      justEndedEvent: checkinEvent,
      phase: "en_route",
    },
    warningCount: 0,
  });
  const energyBar = findElementByClassName(view, "energy-bar");

  assert.ok(energyBar);
  assert.equal((energyBar.props as { "aria-valuenow": number })["aria-valuenow"], 20);
  assert.match(collectText(view), /終於到民宿啦～重頭戲開始！/);
  assert.doesNotMatch(collectText(view), /我最期待烤肉車！/);

  const eventCard = findElementByClassName(view, "home-event-card");
  assert.match(collectText(eventCard), /富英農舍包棟民宿/);
  assert.match(collectText(eventCard), /前往下一站/);
});

test("前往畫面的卡片與對話取下一站，能量仍取剛結束行程", () => {
  const lunchEvent: TripEvent = {
    ...makeEvent("d1-lunch", "享用中餐", "餐廳"),
    activeDialogueCopy: "享用午餐中",
    dialogueCharacter: "travelerWaving",
    energy: 50,
    energyCopy: "補充能量中",
  };
  const laserEvent: TripEvent = {
    ...makeEvent("d1-laser", "雷射對決賽", "戰鬥區"),
    dialogueCharacter: "travelerWarning",
    enRouteDialogueCopy: "青蛙怪發出戰鬥邀請，大家準備好了嗎？",
  };
  const view = HomeView({
    events: [lunchEvent, laserEvent],
    loadState: "ready",
    onRefresh: () => {},
    snapshot: {
      currentEvents: [],
      nextEvents: [laserEvent],
      justEndedEvents: [lunchEvent],
      currentEvent: null,
      nextEvent: laserEvent,
      justEndedEvent: lunchEvent,
      phase: "en_route",
    },
    warningCount: 0,
  });

  assert.equal(
    findElementByClassName(view, "energy-bar")?.props["aria-valuenow"],
    50,
  );
  assert.match(collectText(view), /補充能量中/);
  assert.match(collectText(view), /雷射對決賽/);
  assert.match(collectText(view), /青蛙怪發出戰鬥邀請/);
  assert.doesNotMatch(collectText(view), /享用午餐中/);
});

test("跨日休息顯示明日行程與休息台詞，但不顯示能量列", () => {
  const nightMarketEvent: TripEvent = {
    ...makeEvent("d1-night-market", "羅東夜市", "羅東夜市"),
    dialogueCharacter: "duck",
    energy: 5,
    energyCopy: "今天玩得太盡興啦，體力大透支～",
    restingDialogueCopy: "今晚先好好休息，明天再繼續冒險～",
  };
  const breakfastEvent: TripEvent = {
    ...makeEvent("d2-breakfast", "早餐時間", "民宿"),
    date: "2026-08-30",
    displayTime: "09:00 - 10:30",
    startTime: "09:00",
    endTime: "10:30",
  };
  const view = HomeView({
    events: [nightMarketEvent, breakfastEvent],
    loadState: "ready",
    onRefresh: () => {},
    snapshot: {
      currentEvents: [],
      nextEvents: [breakfastEvent],
      justEndedEvents: [nightMarketEvent],
      currentEvent: null,
      nextEvent: breakfastEvent,
      justEndedEvent: nightMarketEvent,
      phase: "resting",
    },
    warningCount: 0,
  });

  assert.match(collectText(view), /休息中/);
  assert.match(collectText(view), /明日\s+09:00/);
  assert.match(collectText(view), /早餐時間/);
  assert.match(collectText(view), /今晚先好好休息/);
  assert.equal(findElementByClassName(view, "energy-bar"), null);
  assert.equal(findElementByClassName(view, "home-progress-status"), null);
  assert.doesNotMatch(collectText(view), /體力大透支/);
});

test("每種行程階段的角色對話區都只渲染一個角色", () => {
  const preTripEvent: TripEvent = {
    ...activeEvent,
    dialogueCharacter: "travelerWaving",
    preTripDialogueCopy: "準備出發",
  };
  const activeDialogueEvent: TripEvent = {
    ...activeEvent,
    activeDialogueCopy: "進行中",
    dialogueCharacter: "duck",
  };
  const completeEvent: TripEvent = {
    ...activeEvent,
    dialogueCharacter: "travelerWithMap",
    tripCompleteDialogueCopy: "旅程完成",
  };
  const restingEvent: TripEvent = {
    ...activeEvent,
    dialogueCharacter: "duck",
    restingDialogueCopy: "休息中",
  };
  const views = [
    HomeView({
      events: [preTripEvent],
      loadState: "ready",
      onRefresh: () => {},
      snapshot: {
        ...activeSnapshot,
        currentEvent: null,
        currentEvents: [],
        nextEvent: preTripEvent,
        nextEvents: [preTripEvent],
        phase: "pre_trip",
      },
      warningCount: 0,
    }),
    HomeView({
      events: [activeDialogueEvent],
      loadState: "ready",
      onRefresh: () => {},
      snapshot: {
        ...enRouteSnapshot,
        nextEvent: activeDialogueEvent,
        nextEvents: [activeDialogueEvent],
      },
      warningCount: 0,
    }),
    HomeView({
      events: [restingEvent, activeEvent],
      loadState: "ready",
      onRefresh: () => {},
      snapshot: {
        currentEvent: null,
        currentEvents: [],
        justEndedEvent: restingEvent,
        justEndedEvents: [restingEvent],
        nextEvent: activeEvent,
        nextEvents: [activeEvent],
        phase: "resting",
      },
      warningCount: 0,
    }),
    HomeView({
      events: [activeDialogueEvent],
      loadState: "ready",
      onRefresh: () => {},
      snapshot: {
        ...activeSnapshot,
        currentEvent: activeDialogueEvent,
        currentEvents: [activeDialogueEvent],
      },
      warningCount: 0,
    }),
    HomeView({
      events: [completeEvent],
      loadState: "ready",
      onRefresh: () => {},
      snapshot: completeSnapshot,
      warningCount: 0,
    }),
  ];

  views.forEach((view) => {
    assert.equal(countComponentInstances(view, CharacterDialogue), 1);
  });
});

test("沒有能量時不顯示能量條，沒有能量文案時不顯示文案", () => {
  const eventWithoutEnergy = makeEvent("d1-group", "共同行程", "待確認");
  const view = HomeView({
    events: [],
    loadState: "ready",
    onRefresh: () => {},
    snapshot: {
      currentEvents: [eventWithoutEnergy],
      nextEvents: [],
      justEndedEvents: [],
      currentEvent: eventWithoutEnergy,
      nextEvent: null,
      justEndedEvent: null,
      phase: "active",
    },
    warningCount: 0,
  });

  assert.equal(findElementByClassName(view, "energy-bar"), null);
  assert.equal(countElementsByClassName(view, "home-progress-status"), 1);
});

test("同時進行的行程卡片不提供任何可點擊控制", () => {
  const view = HomeView({
    events: [],
    loadState: "ready",
    onRefresh: () => {},
    snapshot: concurrentActiveSnapshot,
    warningCount: 0,
  });
  const eventCard = findElementByClassName(view, "home-event-card");

  assert.ok(eventCard);
  assert.equal(eventCard.type, "div");
  assert.equal(findElementByClassName(eventCard, "home-event-row-button"), null);
});

test("下一時段同時開始的行程全部列在前往下一站卡片", () => {
  const view = HomeView({
    events: [],
    loadState: "ready",
    onRefresh: () => {},
    snapshot: concurrentEnRouteSnapshot,
    warningCount: 0,
  });
  const eventCard = findElementByClassName(view, "home-event-card");

  assert.ok(eventCard);
  assert.equal(countElementsByClassName(view, "home-event-row"), 1);
  assert.equal(countElementsByClassName(view, "home-event-place"), 3);

  const cardText = collectText(eventCard);
  assert.match(cardText, /前往下一站/);
  assert.match(cardText, /鹽滷豆花專賣店/);
  assert.match(cardText, /冬山金珠蔥油餅/);
});

test("每個名稱區塊各顯示一張對應插圖，同名同時段的行程共用一張", () => {
  const lunchEvent = makeEvent("d1-lunch", "享用中餐", "番割田甕缸雞");
  const lunchView = HomeView({
    events: [],
    loadState: "ready",
    onRefresh: () => {},
    snapshot: {
      currentEvents: [lunchEvent],
      nextEvents: [],
      justEndedEvents: [],
      currentEvent: lunchEvent,
      nextEvent: null,
      justEndedEvent: null,
      phase: "active",
    },
    warningCount: 0,
  });
  const lunchArtwork = findElementByClassName(lunchView, "home-event-artwork");

  assert.ok(lunchArtwork);
  assert.equal(lunchArtwork.props.src, "/assets/yilan/cards/享用中餐.svg");

  // 三筆冬山同名同時段合併成一個名稱區塊，因此只有一張插圖。
  const dongshanView = HomeView({
    events: [],
    loadState: "ready",
    onRefresh: () => {},
    snapshot: concurrentActiveSnapshot,
    warningCount: 0,
  });

  assert.equal(countElementsByClassName(dongshanView, "home-event-artwork"), 1);
  assert.equal(
    findElementByClassName(dongshanView, "home-event-artwork")?.props.src,
    "/assets/yilan/cards/冬山自由觀光.svg",
  );
});

test("沒有對應插圖的行程使用無插圖版型", () => {
  const unknownEvent = makeEvent("custom", "臨時加開的行程", "某地");
  const view = HomeView({
    events: [],
    loadState: "ready",
    onRefresh: () => {},
    snapshot: {
      currentEvents: [unknownEvent],
      nextEvents: [],
      justEndedEvents: [],
      currentEvent: unknownEvent,
      nextEvent: null,
      justEndedEvent: null,
      phase: "active",
    },
    warningCount: 0,
  });

  assert.equal(findElementByClassName(view, "home-event-artwork"), null);
});

test("首頁現在行程卡片只顯示資訊，不提供按鈕互動", () => {
  const view = HomeView({
    events: [],
    loadState: "ready",
    onRefresh: () => {},
    snapshot: activeSnapshot,
    warningCount: 0,
  });
  const eventCard = findElementByClassName(view, "home-event-card");

  assert.ok(eventCard);
  assert.equal(eventCard.type, "div");
});

test("能量列的角色使用 head 頭像素材", () => {
  const view = HomeView({
    events: [],
    loadState: "ready",
    onRefresh: () => {},
    snapshot: activeSnapshot,
    warningCount: 0,
  });
  const traveler = findElementByClassName(view, "home-progress-traveler");

  assert.ok(traveler);
  assert.equal(traveler.props.src, "/assets/yilan/head.svg");
  assert.equal(traveler.props.width, 48);
  assert.equal(traveler.props.height, 54);
});

test("女生版本的能量列使用 g-head 原始尺寸", () => {
  const view = HomeView({
    events: [],
    loadState: "ready",
    onRefresh: () => {},
    snapshot: activeSnapshot,
    travelerGender: "female",
    warningCount: 0,
  });
  const traveler = findElementByClassName(view, "home-progress-traveler");

  assert.ok(traveler);
  assert.equal(traveler.props.src, "/assets/yilan/g-head.svg");
  assert.equal(traveler.props.width, 48);
  assert.equal(traveler.props.height, 48);
});

test("CharacterDialogue 將女生版本傳給角色素材解析", () => {
  const dialogue = CharacterDialogue({
    character: "travelerWaving",
    children: "小旅人台詞",
    className: "pretrip-dialogue",
    travelerGender: "female",
  });
  const artwork = findElementByClassName(
    dialogue,
    "character-dialogue-artwork",
  );

  assert.ok(artwork);
  assert.equal(artwork.props.src, "/assets/yilan/g-character1.svg");
});

test("主視覺天空層放兩朵雲，且不干擾輔助技術與點擊", () => {
  const view = HomeView({
    events: [],
    loadState: "ready",
    onRefresh: () => {},
    snapshot: activeSnapshot,
    warningCount: 0,
  });
  const sky = findElementByClassName(view, "trip-hero-sky");

  assert.ok(sky);
  assert.equal(sky.props["aria-hidden"], "true");
  assert.ok(findElementByClassName(view, "trip-hero-cloud-left"));
  assert.ok(findElementByClassName(view, "trip-hero-cloud-right"));
});

test("雲的飄動動畫在使用者要求減少動態時停止", () => {
  const stylesheet = readFileSync(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );
  const reducedMotionBlocks = stylesheet.match(
    /@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*?\n\}/g,
  ) ?? [];

  assert.equal(
    reducedMotionBlocks.some(
      (block) =>
        /\.trip-hero-cloud-left/.test(block) &&
        /\.trip-hero-cloud-right/.test(block) &&
        /animation:\s*none/.test(block),
    ),
    true,
  );
});

test("首頁行程卡片改用可變高度 CSS 外框，不載入固定尺寸外框圖", () => {
  const enRouteView = HomeView({
    events: [],
    loadState: "ready",
    onRefresh: () => {},
    snapshot: enRouteSnapshot,
    warningCount: 0,
  });
  const activeView = HomeView({
    events: [],
    loadState: "ready",
    onRefresh: () => {},
    snapshot: activeSnapshot,
    warningCount: 0,
  });

  assert.equal(findElementByClassName(enRouteView, "home-event-frame"), null);
  assert.equal(findElementByClassName(activeView, "home-event-frame"), null);
  assert.ok(findElementByClassName(activeView, "home-event-card"));
});

test("首頁旅程結束卡片使用 CSS 外框，不載入深色 SVG", () => {
  const completeView = HomeView({
    events: [],
    loadState: "ready",
    onRefresh: () => {},
    snapshot: completeSnapshot,
    warningCount: 0,
  });

  assert.ok(findElementByClassName(completeView, "home-status-card"));
  assert.equal(findElementByClassName(completeView, "home-status-frame"), null);
});

test("首頁旅程結束顯示小旅人提醒查看背包", () => {
  const completeView = HomeView({
    events: [],
    loadState: "ready",
    onRefresh: () => {},
    snapshot: completeSnapshot,
    warningCount: 0,
  });

  assert.ok(findElementByClassName(completeView, "complete-dialogue"));
});
