import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as backpackItemSheetModule from "../app/components/trip-handbook/backpack-item-sheet";
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

const readTextContent = (node: ReactNode): string => {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(readTextContent).join("");
  }

  if (!isValidElement<{ children?: ReactNode }>(node)) return "";

  return readTextContent(node.props.children);
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
  isChallengeAvailable: false,
  isNew: false,
  isUnlocked: true,
  name: "蘋果",
};

const groupPhotoBackpackItem = {
  artwork: "照片.svg",
  copy: "結束旅程，將所有旅行的回憶都放進心裡",
  detailArtwork: "new-大合照.webp",
  id: "apple",
  isChallengeAvailable: false,
  isNew: false,
  isUnlocked: true,
  name: "大合照",
} as BackpackDisplayItem;

const BackpackChallengeSheet = (
  backpackItemSheetModule as typeof backpackItemSheetModule & {
    BackpackChallengeSheet?: (props: {
      item: BackpackDisplayItem;
      onClose: () => void;
      onSubmitAnswer: (answer: string) => boolean;
      returnFocusTo: HTMLElement | null;
    }) => ReactNode;
  }
).BackpackChallengeSheet;

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

test("Bottom sheet 貼齊可視畫面的左右邊緣", () => {
  const stylesheet = readFileSync(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );
  const bottomSheetRule =
    stylesheet.match(/\.bottom-sheet\s*\{[^}]*\}/s)?.[0] ?? "";

  assert.match(bottomSheetRule, /left:\s*0/);
  assert.match(bottomSheetRule, /width:\s*100%/);
  assert.doesNotMatch(bottomSheetRule, /max-width:/);
  assert.doesNotMatch(bottomSheetRule, /transform:/);
});

test("Bottom Sheet 進場動畫只沿垂直方向由下往上", () => {
  const stylesheet = readFileSync(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );
  const sheetEnterKeyframes = stylesheet.match(
    /@keyframes sheet-enter\s*\{[\s\S]*?\n\}/,
  )?.[0] ?? "";

  assert.match(sheetEnterKeyframes, /from\s*\{[^}]*translateY\(100%\)/s);
  assert.match(sheetEnterKeyframes, /to\s*\{[^}]*translateY\(0\)/s);
  assert.doesNotMatch(sheetEnterKeyframes, /translateX|translate\(/);
});

test("Bottom Sheet 的所有資訊內容與底部保持 32px 留白", () => {
  const stylesheet = readFileSync(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );
  const carAssignmentRule =
    stylesheet.match(/\.car-assignment-list\s*\{[^}]*\}/s)?.[0] ?? "";
  const roomAssignmentRule =
    stylesheet.match(/\.room-assignment-list\s*\{[^}]*\}/s)?.[0] ?? "";
  const informationRule =
    stylesheet.match(
      /\.bottom-sheet-placeholder,\s*\.event-info-list\s*\{[^}]*\}/s,
    )?.[0] ?? "";
  const backpackRule =
    stylesheet.match(/\.backpack-item-sheet-body\s*\{[^}]*\}/s)?.[0] ?? "";
  const bottomSheetRule =
    stylesheet.match(/\.bottom-sheet\s*\{[^}]*\}/s)?.[0] ?? "";

  assert.match(carAssignmentRule, /margin:\s*0 32px 32px/);
  assert.match(roomAssignmentRule, /margin:\s*0 32px 32px/);
  assert.match(informationRule, /margin:\s*0 32px 32px/);
  assert.match(backpackRule, /margin:\s*8px 32px 32px/);
  assert.match(
    bottomSheetRule,
    /padding:\s*0 0 env\(safe-area-inset-bottom\)/,
  );
});

test("Bottom sheet 的所有說明文字統一為 16px", () => {
  const stylesheet = readFileSync(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );
  const carDescriptionRule =
    stylesheet.match(/(?:^|})\s*\.car-assignment-row p\s*\{[^}]*\}/s)?.[0] ?? "";
  const roomDescriptionRule =
    stylesheet.match(/(?:^|})\s*\.room-assignment-row p\s*\{[^}]*\}/s)?.[0] ?? "";

  assert.match(carDescriptionRule, /font-size:\s*16px/);
  assert.match(roomDescriptionRule, /font-size:\s*16px/);
  assert.match(
    stylesheet,
    /\.bottom-sheet-placeholder,\s*\.event-info-list\s*\{[^}]*font-size:\s*16px/s,
  );
  assert.match(
    stylesheet,
    /\.backpack-item-sheet-copy\s*\{[^}]*font-size:\s*16px/s,
  );
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

test("車輛與菜單 Bottom Sheet 的圖片在開啟時立即載入", () => {
  const vehicleSheet = CarAssignmentSheet({
    event: baseEvent,
    onClose: () => {},
    returnFocusTo: null,
  });
  const menuSheet = EventInfoSheet({
    actionType: "menu",
    event: baseEvent,
    onClose: () => {},
    returnFocusTo: null,
  });
  const vehicleImages = findElementsByClassName(
    vehicleSheet.props.children,
    "car-assignment-icon",
  );
  const menuImages = findElementsByClassName(
    menuSheet.props.children,
    "menu-artwork-icon",
  );

  assert.equal(vehicleImages.length, 3);
  assert.equal(menuImages.length, 5);
  assert.equal(
    [...vehicleImages, ...menuImages].every(
      (imageElement) => imageElement.props.loading === "eager",
    ),
    true,
  );
});

test("交通資訊 Sheet 顯示行程備註內容", () => {
  const element = EventInfoSheet({
    actionType: "transport",
    event: {
      ...baseEvent,
      note: "09:30 公司集合，搭乘遊覽車前往冬山火車站。",
    },
    onClose: () => {},
    returnFocusTo: null,
  });

  assert.match(
    readTextContent(element.props.children),
    /09:30 公司集合，搭乘遊覽車前往冬山火車站。/,
  );
});

test("交通資訊 Sheet 保留備註換行，並加粗每行冒號前的標籤", () => {
  const html = renderToStaticMarkup(
    <EventInfoSheet
      actionType="transport"
      event={{
        ...baseEvent,
        note: "集合時間：09:30\n集合地點: 公司一樓\n請準時抵達",
      }}
      onClose={() => {}}
      returnFocusTo={null}
    />,
  );

  assert.match(html, /<strong>集合時間：<\/strong>09:30<br\/>/);
  assert.match(html, /<strong>集合地點:<\/strong> 公司一樓<br\/>/);
  assert.match(html, /<br\/>請準時抵達/);
});

test("住宿分配顯示行程資料中的動態房間與多張床", () => {
  const element = EventInfoSheet({
    actionType: "room",
    event: {
      ...baseEvent,
      roomAssignments: [
        {
          artwork: "主建築.webp",
          details: [
            "雙人床：Linda、Lauren",
            "雙人床：Jeff、Jeff 女兒",
          ],
          name: "主棟 - 2F A房",
        },
        {
          artwork: "貨櫃屋.webp",
          details: ["雙人床：國倫、世彥"],
          name: "貨櫃屋 - A room",
        },
      ],
    },
    onClose: () => {},
    returnFocusTo: null,
  });
  const roomAssignmentRows = findElementsByClassName(
    element.props.children,
    "room-assignment-row",
  );
  const roomAssignmentText = roomAssignmentRows.map(readTextContent).join("\n");

  assert.equal(roomAssignmentRows.length, 2);
  assert.match(roomAssignmentText, /主棟 - 2F A房/);
  assert.match(roomAssignmentText, /雙人床：Linda、Lauren/);
  assert.match(roomAssignmentText, /雙人床：Jeff、Jeff 女兒/);
  assert.match(roomAssignmentText, /貨櫃屋 - A room/);
  assert.doesNotMatch(roomAssignmentText, /小王/);
});

test("房間分配尚未填寫時顯示待補提示", () => {
  const element = EventInfoSheet({
    actionType: "room",
    event: baseEvent,
    onClose: () => {},
    returnFocusTo: null,
  });
  const placeholders = findElementsByClassName(
    element.props.children,
    "bottom-sheet-placeholder",
  );

  assert.equal(placeholders.length, 1);
  assert.equal(readTextContent(placeholders[0]), "房間分配待補");
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

test("解鎖問題 Sheet 顯示 Excel 題目、答案欄位與確認按鈕", () => {
  assert.equal(typeof BackpackChallengeSheet, "function");
  if (!BackpackChallengeSheet) return;

  const challengeItem: BackpackDisplayItem = {
    ...baseBackpackItem,
    challenge: {
      acceptableAnswers: ["冬山車站"],
      question: "集合地點旁的車站名稱是什麼？",
    },
    isChallengeAvailable: true,
    isUnlocked: false,
  };
  const html = renderToStaticMarkup(
    <BackpackChallengeSheet
      item={challengeItem}
      onClose={() => {}}
      onSubmitAnswer={() => false}
      returnFocusTo={null}
    />,
  );

  assert.match(html, />解鎖問題<\/h2>/);
  assert.match(html, /集合地點旁的車站名稱是什麼？/);
  assert.match(html, /aria-label="輸入答案"/);
  assert.match(html, /type="text"/);
  assert.match(html, /type="submit"/);
  assert.match(html, />確認答案<\/button>/);
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
  assert.equal(detailArtwork[0].props.src, "/assets/yilan/new-大合照.webp");
  assert.equal(detailArtwork[0].props.alt, "大合照");
  assert.equal(detailArtwork[0].props.width, 658);
  assert.equal(detailArtwork[0].props.height, 456);
});

test("女生版本的大合照物品使用新版女生合照", () => {
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
  assert.equal(detailArtwork[0].props.src, "/assets/yilan/new-g-大合照.webp");
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
