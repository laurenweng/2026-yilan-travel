import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BackpackItemSheet } from "../app/components/trip-handbook/backpack-item-sheet";
import { BottomSheet } from "../app/components/trip-handbook/bottom-sheet";
import { CarAssignmentSheet } from "../app/components/trip-handbook/car-assignment-sheet";
import { EventInfoSheet } from "../app/components/trip-handbook/event-info-sheet";
import type { BackpackDisplayItem } from "../app/lib/backpack-state";
import type { TripEvent } from "../app/lib/trip-types";

const findElementsByClassName = (
  node: ReactNode,
  className: string,
): ReactElement[] => {
  if (Array.isArray(node)) {
    return node.flatMap((child) => findElementsByClassName(child, className));
  }

  if (!isValidElement<{ children?: ReactNode; className?: string }>(node)) {
    return [];
  }

  const matches = node.props.className?.split(" ").includes(className)
    ? [node]
    : [];

  if (typeof node.type === "function") {
    const Component = node.type;
    return [
      ...matches,
      ...findElementsByClassName(Component(node.props), className),
    ];
  }

  return [
    ...matches,
    ...findElementsByClassName(node.props.children, className),
  ];
};

const baseEvent: TripEvent = {
  date: "2026-08-29",
  displayTime: "08:30 - 10:00",
  endTime: "10:00",
  id: "test-event",
  location: "宜蘭",
  menuItems: [],
  roomAssignments: [],
  startTime: "08:30",
  title: "測試行程",
  vehicles: [],
};

const baseBackpackItem: BackpackDisplayItem = {
  artwork: "蘋果.svg",
  copy: "測試物品文案",
  id: "apple",
  isNew: false,
  isUnlocked: true,
  name: "蘋果",
};

const groupPhotoBackpackItem = {
  artwork: "照片.svg",
  copy: "結束旅程，將所有旅行的回憶都放進心裡",
  detailArtwork: "大合照.png",
  id: "apple",
  isNew: false,
  isUnlocked: true,
  name: "大合照",
} as BackpackDisplayItem;

test("BottomSheet 渲染標題、關閉按鈕與對話框外殼屬性", () => {
  const html = renderToStaticMarkup(
    <BottomSheet onClose={() => {}} returnFocusTo={null} title="車輛分配">
      <p className="test-only-content">內容區塊</p>
    </BottomSheet>,
  );

  assert.match(html, /class="sheet-overlay"/);
  assert.match(html, /class="bottom-sheet"/);
  assert.match(html, /role="dialog"/);
  assert.match(html, /aria-modal="true"/);
  assert.match(html, /tabindex="-1"/);
  assert.match(html, /class="bottom-sheet-handle"/);
  assert.match(html, />車輛分配<\/h2>/);
  assert.match(html, /aria-label="關閉車輛分配"/);
  assert.match(html, /class="test-only-content"/);
});

test("BottomSheet 的 section aria-labelledby 對應 h2 id", () => {
  const html = renderToStaticMarkup(
    <BottomSheet onClose={() => {}} returnFocusTo={null} title="物品">
      <p>子內容</p>
    </BottomSheet>,
  );

  const sectionId = html.match(/aria-labelledby="([^"]+)"/)?.[1];
  const headingId = html.match(/<h2 id="([^"]+)"/)?.[1];

  assert.ok(sectionId);
  assert.equal(sectionId, headingId);
});

test("EventInfoSheet 改用 BottomSheet 外殼並保留活動標題行", () => {
  const element = EventInfoSheet({
    actionType: "transport",
    event: baseEvent,
    onClose: () => {},
    returnFocusTo: null,
  });

  assert.equal(element.type, BottomSheet);
  assert.equal(element.props.title, "交通資訊");
  assert.equal(
    findElementsByClassName(element.props.children, "bottom-sheet-event")
      .length,
    1,
  );
});

test("CarAssignmentSheet 改用 BottomSheet 外殼並保留活動標題行", () => {
  const element = CarAssignmentSheet({
    event: baseEvent,
    onClose: () => {},
    returnFocusTo: null,
  });

  assert.equal(element.type, BottomSheet);
  assert.equal(element.props.title, "車輛分配");
  assert.equal(
    findElementsByClassName(element.props.children, "bottom-sheet-event")
      .length,
    1,
  );
});

test("BackpackItemSheet 改用 BottomSheet 外殼，且不含活動標題行", () => {
  const element = BackpackItemSheet({
    item: baseBackpackItem,
    onClose: () => {},
    returnFocusTo: null,
  });

  assert.equal(element.type, BottomSheet);
  assert.equal(element.props.title, "物品");
  assert.equal(
    findElementsByClassName(element.props.children, "bottom-sheet-event")
      .length,
    0,
  );
  assert.equal(
    findElementsByClassName(
      element.props.children,
      "backpack-item-sheet-body",
    ).length,
    1,
  );
});

test("大合照物品在 Bottom Sheet 使用寬版詳情圖片", () => {
  const element = BackpackItemSheet({
    item: groupPhotoBackpackItem,
    onClose: () => {},
    returnFocusTo: null,
  });
  const detailArtwork = findElementsByClassName(
    element.props.children,
    "backpack-item-sheet-detail-artwork",
  );

  assert.equal(detailArtwork.length, 1);
  assert.equal(detailArtwork[0].props.src, "/assets/yilan/大合照.png");
  assert.equal(detailArtwork[0].props.alt, "大合照");
});

test("女生版本的大合照物品使用 g-大合照", () => {
  const element = BackpackItemSheet({
    item: groupPhotoBackpackItem,
    onClose: () => {},
    returnFocusTo: null,
    travelerGender: "female",
  });
  const detailArtwork = findElementsByClassName(
    element.props.children,
    "backpack-item-sheet-detail-artwork",
  );

  assert.equal(detailArtwork.length, 1);
  assert.equal(detailArtwork[0].props.src, "/assets/yilan/g-大合照.png");
});

test("大合照詳情圖片維持寬版比例且不套用像素效果", () => {
  const stylesheet = readFileSync(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );
  const detailArtworkRule =
    stylesheet.match(/\.backpack-item-sheet-detail-artwork\s*\{[^}]*\}/s)?.[0] ?? "";

  assert.match(detailArtworkRule, /height:\s*auto/);
  assert.match(detailArtworkRule, /max-width:\s*329px/);
  assert.match(detailArtworkRule, /width:\s*100%/);
  assert.doesNotMatch(detailArtworkRule, /filter:/);
  assert.doesNotMatch(detailArtworkRule, /image-rendering:/);
});

test("底部彈出視窗高度隨內容縮減，改以 max-height 限制上限", () => {
  const stylesheet = readFileSync(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );
  const bottomSheetRule =
    stylesheet.match(/\.bottom-sheet\s*\{[^}]*\}/s)?.[0] ?? "";
  const fixedHeightDeclarations = bottomSheetRule
    .split(";")
    .map((declaration) => declaration.trim())
    .filter((declaration) => declaration.startsWith("height:"));

  assert.equal(fixedHeightDeclarations.length, 0);
  assert.match(
    bottomSheetRule,
    /max-height:\s*min\(496px, calc\(100dvh - 80px\)\)/,
  );
});
