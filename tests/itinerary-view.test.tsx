import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { isValidElement, type ReactNode } from "react";
import { ItineraryView } from "../app/components/trip-handbook/itinerary-view";
import { getMenuArtworkWidth } from "../app/lib/trip-supplement-data";
import type { TripEvent } from "../app/lib/trip-types";

const itineraryEvent: TripEvent = {
  date: "2026-08-29",
  displayTime: "08.29 - 08.30",
  endTime: "10:00",
  id: "farm",
  location: "宜蘭市區中和路",
  mapUrl: "https://www.example.com/map",
  merchantPhone: "0212345678",
  roomAssignments: [],
  menuItems: [],
  startTime: "08:30",
  title: "張美阿嬤農場",
  vehicles: [],
};

const secondDayEvent: TripEvent = {
  ...itineraryEvent,
  date: "2026-08-30",
  id: "hot-spring",
  title: "溫泉任務",
};

const vehicleItineraryEvent: TripEvent = {
  ...itineraryEvent,
  action: {
    label: "看車輛分配",
    type: "vehicle",
  },
  vehicles: [
    {
      driver: "小王",
      passengers: ["小陳"],
      vehicle: "A",
    },
  ],
};

const transportItineraryEvent: TripEvent = {
  ...itineraryEvent,
  action: {
    label: "看交通資訊",
    type: "transport",
  },
  id: "transport",
  location: "",
  place: undefined,
  address: undefined,
  title: "前往宜蘭",
  transportSuggestion: "火車、客運",
};

const findElementByClassName = (node: ReactNode, className: string): ReactNode => {
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
    const Component = node.type;
    return findElementByClassName(Component(node.props), className);
  }

  return findElementByClassName(node.props.children, className);
};

const findElementsByClassName = (
  node: ReactNode,
  className: string,
): ReactNode[] => {
  if (Array.isArray(node)) {
    return node.flatMap((child) => findElementsByClassName(child, className));
  }

  if (!isValidElement<{ children?: ReactNode; className?: string }>(node)) {
    return [];
  }

  const childMatches =
    node.props.className?.split(" ").includes(className) ? [node] : [];

  if (typeof node.type === "function") {
    const Component = node.type;
    return [
      ...childMatches,
      ...findElementsByClassName(Component(node.props), className),
    ];
  }

  return [
    ...childMatches,
    ...findElementsByClassName(node.props.children, className),
  ];
};

const getTextContent = (node: ReactNode): string => {
  if (typeof node === "string" || typeof node === "number") return `${node}`;
  if (Array.isArray(node)) return node.map(getTextContent).join("");

  if (!isValidElement<{ children?: ReactNode }>(node)) return "";
  if (typeof node.type === "function") {
    const Component = node.type;
    return getTextContent(Component(node.props));
  }

  return getTextContent(node.props.children);
};

test("行程卡依資料欄位顯示五行資訊", () => {
  const view = ItineraryView({
    events: [itineraryEvent],
    onDateChange: () => {},
    onOpenEvent: () => {},
    selectedDate: "2026-08-29",
  });
  const cardContent = findElementByClassName(view, "itinerary-card-content");
  const cardText = getTextContent(cardContent);

  assert.match(cardText, /時間｜08\.29 - 08\.30/);
  assert.match(cardText, /地址｜宜蘭市區中和路/);
  assert.match(cardText, /Map｜https:\/\/www\.example\.com\/map/);
  assert.match(cardText, /商家電話｜0212345678/);
});

test("行程卡的 Map 網址可在新分頁開啟", () => {
  const view = ItineraryView({
    events: [itineraryEvent],
    onDateChange: () => {},
    onOpenEvent: () => {},
    selectedDate: "2026-08-29",
  });
  const mapLink = findElementByClassName(view, "itinerary-card-map-link");

  assert.ok(isValidElement(mapLink));
  assert.equal(mapLink.type, "a");
  assert.equal(mapLink.props.href, "https://www.example.com/map");
  assert.equal(mapLink.props.target, "_blank");
  assert.equal(mapLink.props.rel, "noreferrer");
});

test("日期頁籤使用第一天與第二天標籤", () => {
  const view = ItineraryView({
    events: [itineraryEvent, secondDayEvent],
    onDateChange: () => {},
    onOpenEvent: () => {},
    selectedDate: "2026-08-29",
  });
  const dateSwitcher = findElementByClassName(view, "date-switcher");

  assert.equal(getTextContent(dateSwitcher), "第一天第二天");
});

test("切換到第二天時只顯示第二日行程", () => {
  const view = ItineraryView({
    events: [itineraryEvent, secondDayEvent],
    onDateChange: () => {},
    onOpenEvent: () => {},
    selectedDate: "2026-08-30",
  });
  const cardContent = findElementByClassName(view, "itinerary-card-content");
  const cardText = getTextContent(cardContent);

  assert.match(cardText, /溫泉任務/);
  assert.doesNotMatch(cardText, /張美阿嬤農場/);
});

test("行程背景不渲染路線直線或編號節點", () => {
  const view = ItineraryView({
    events: [itineraryEvent],
    onDateChange: () => {},
    onOpenEvent: () => {},
    selectedDate: "2026-08-29",
  });

  assert.equal(findElementByClassName(view, "itinerary-route-line"), null);
  assert.equal(findElementByClassName(view, "itinerary-node"), null);
});

test("行程卡片列表使用獨立捲動區", () => {
  const view = ItineraryView({
    events: [itineraryEvent],
    onDateChange: () => {},
    onOpenEvent: () => {},
    selectedDate: "2026-08-29",
  });

  assert.ok(findElementByClassName(view, "itinerary-scroll-region"));
});

test("行程兩側樹木完整貼齊可視區域邊緣", () => {
  const stylesheet = readFileSync(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );
  const leftTreeRule = stylesheet.match(/\.itinerary-tree\s*\{[^}]*\}/s)?.[0] ?? "";
  const rightTreeRule = stylesheet.match(
    /\.itinerary-tree-right\s*\{[^}]*\}/s,
  )?.[0] ?? "";

  assert.match(leftTreeRule, /left:\s*0;/);
  assert.doesNotMatch(leftTreeRule, /left:\s*-/);
  assert.match(rightTreeRule, /right:\s*0;/);
  assert.doesNotMatch(rightTreeRule, /right:\s*-/);
});

test("行程卡僅由操作按鈕開啟 Bottom Sheet，並保留像素邊框", () => {
  const view = ItineraryView({
    events: [vehicleItineraryEvent],
    onDateChange: () => {},
    onOpenEvent: () => {},
    selectedDate: "2026-08-29",
  });
  const pixelFrame = findElementByClassName(view, "pixel-frame");
  const cardContent = findElementByClassName(view, "itinerary-card-content");
  const actionButton = findElementByClassName(view, "itinerary-card-action");

  assert.ok(isValidElement(pixelFrame));
  assert.match(pixelFrame.props.className, /itinerary-card/);
  assert.ok(cardContent);
  assert.equal(findElementByClassName(view, "itinerary-card-button"), null);
  assert.ok(isValidElement(actionButton));
  assert.equal(actionButton.type, "button");
});

test("交通行程可顯示交通建議與對應操作按鈕", () => {
  const view = ItineraryView({
    events: [transportItineraryEvent],
    onDateChange: () => {},
    onOpenEvent: () => {},
    selectedDate: "2026-08-29",
  });
  const cardContent = findElementByClassName(view, "itinerary-card-content");
  const actionButton = findElementByClassName(view, "itinerary-card-action");

  assert.match(getTextContent(cardContent), /交通建議｜火車、客運/);
  assert.match(getTextContent(actionButton), /看交通資訊/);
});

test("開啟 Bottom Sheet 的按鈕文字使用 1.7 行高", () => {
  const stylesheet = readFileSync(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );

  assert.match(
    stylesheet,
    /\.itinerary-card-action\s*\{[^}]*line-height:\s*1\.7;/s,
  );
});

test("行程卡使用雙層凹角像素外框與陰影，且不設定固定高度", () => {
  const stylesheet = readFileSync(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );
  const itineraryCardRule = stylesheet.match(/\.itinerary-card\s*\{[^}]*\}/s)?.[0] ?? "";
  const itineraryCardInsetRule = stylesheet.match(
    /\.itinerary-card::before\s*\{[^}]*\}/s,
  )?.[0] ?? "";

  assert.match(itineraryCardRule, /clip-path:\s*polygon/);
  assert.match(itineraryCardRule, /filter:\s*drop-shadow/);
  assert.doesNotMatch(itineraryCardRule, /(?:min-)?height:/);
  assert.match(itineraryCardInsetRule, /background:\s*var\(--color-panel\)/);
  assert.match(itineraryCardInsetRule, /clip-path:\s*polygon/);
  assert.match(itineraryCardInsetRule, /inset:\s*3px/);
});

test("三個頁面大標與行程內容使用柔黑真粗體", () => {
  const stylesheet = readFileSync(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );
  const pageTitleRule = stylesheet.match(
    /\.trip-hero h1,\s*\.itinerary-header h1,\s*\.backpack-view h1\s*\{[^}]*\}/s,
  )?.[0] ?? "";
  const itineraryViewRule = stylesheet.match(/\.itinerary-view\s*\{[^}]*\}/s)?.[0] ?? "";
  const itineraryContentRule = stylesheet.match(
    /\.itinerary-card-content\s*\{[^}]*\}/s,
  )?.[0] ?? "";

  assert.match(stylesheet, /GenSenRounded2TW-B\.otf/);
  assert.match(pageTitleRule, /font-family:\s*var\(--font-rounded\)/);
  assert.match(pageTitleRule, /font-synthesis:\s*none/);
  assert.match(pageTitleRule, /font-weight:\s*700/);
  assert.match(itineraryViewRule, /font-family:\s*var\(--font-rounded\)/);
  assert.match(itineraryContentRule, /font-synthesis:\s*none/);
});

test("宜蘭員旅大標與行程大標同為 36px", () => {
  const stylesheet = readFileSync(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );
  const tripTitleRule = stylesheet.match(/\.trip-hero h1\s*\{[^}]*\}/s)?.[0] ?? "";
  const itineraryTitleRule = stylesheet.match(
    /\.itinerary-header h1\s*\{[^}]*\}/s,
  )?.[0] ?? "";

  assert.match(tripTitleRule, /font-size:\s*36px/);
  assert.match(itineraryTitleRule, /font-size:\s*36px/);
});

test("兩天的行程卡片皆由上方排列並維持 16px 間距", () => {
  const stylesheet = readFileSync(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );
  const itineraryCardListRule = stylesheet.match(
    /\.itinerary-card-list\s*\{[^}]*\}/s,
  )?.[0] ?? "";

  assert.match(itineraryCardListRule, /align-content:\s*start/);
  assert.match(itineraryCardListRule, /gap:\s*16px/);
});

test("菜單甜甜圈圖示顯示寬度縮小至 49px", () => {
  assert.equal(getMenuArtworkWidth("甜甜圈.svg"), 49);
  assert.equal(getMenuArtworkWidth("起司.svg"), 52);
});

test("三位路人皆載入互斥的 A、B 動作影格", () => {
  const view = ItineraryView({
    events: [itineraryEvent],
    onDateChange: () => {},
    onOpenEvent: () => {},
    selectedDate: "2026-08-29",
  });

  const actionFrames = findElementsByClassName(
    view,
    "itinerary-person-action",
  );
  const baseFrames = findElementsByClassName(
    view,
    "itinerary-person-base",
  );

  assert.equal(actionFrames.length, 3);
  assert.equal(baseFrames.length, 3);
  assert.equal(
    findElementsByClassName(view, "itinerary-person-frame").length,
    6,
  );
});
