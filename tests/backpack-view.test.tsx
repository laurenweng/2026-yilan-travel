import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { isValidElement, type ReactElement, type ReactNode } from "react";
import { BackpackView } from "../app/components/trip-handbook/backpack-view";
import { BottomNavigation } from "../app/components/trip-handbook/bottom-navigation";
import { getBackpackDisplay } from "../app/lib/backpack-state";

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

test("未解鎖背包顯示九個鎖頭", () => {
  const view = BackpackView({ display: getBackpackDisplay("locked") });
  const lockedItems = findElementsByClassName(view, "backpack-item-locked");
  const artworks = findElementsByClassName(view, "backpack-item-artwork");

  assert.equal(lockedItems.length, 9);
  assert.equal(artworks.length, 9);
  assert.equal(
    artworks.every((artwork) => artwork.props.src.endsWith("/鎖頭.svg")),
    true,
  );
});

test("新物品背包顯示兩個收藏與一個 New", () => {
  const view = BackpackView({ display: getBackpackDisplay("new") });

  assert.equal(
    findElementsByClassName(view, "backpack-item-unlocked").length,
    2,
  );
  assert.equal(findElementsByClassName(view, "backpack-item-new").length, 1);
  assert.equal(findElementsByClassName(view, "backpack-new-badge").length, 1);
  assert.match(getTextContent(view), /背包裡好像有什麼新東西？/);
});

test("全解鎖背包依旅程取得順序顯示九格，第三格為宜蘭青蛙怪盾牌共用格的最終狀態盾牌", () => {
  const view = BackpackView({ display: getBackpackDisplay("all") });
  const artworkSources = findElementsByClassName(view, "backpack-item-artwork")
    .map((artwork) => artwork.props.src.split("/").at(-1));

  assert.deepEqual(artworkSources, [
    "藥水.svg",
    "炸雞.svg",
    "盾牌.svg",
    "眼睛.svg",
    "飲料.svg",
    "愛心.svg",
    "閃電.svg",
    "星星.svg",
    "照片.svg",
  ]);
});

test("已解鎖且有物品文案的格子渲染成可點擊按鈕", () => {
  const display = getBackpackDisplay("all");
  const displayWithCopy = {
    ...display,
    items: display.items.map((item, index) => ({
      ...item,
      copy: index === 0 ? "測試物品文案" : undefined,
    })),
  };

  const view = BackpackView({
    display: displayWithCopy,
    onOpenItem: () => {},
  });
  const buttons = findElementsByClassName(view, "backpack-item-button");

  assert.equal(buttons.length, 1);
  assert.equal(buttons[0].type, "button");
  assert.match(buttons[0].props["aria-label"] ?? "", /藥水/);
});

test("鎖定格與沒有物品文案的已解鎖格都不是可點擊按鈕", () => {
  const lockedView = BackpackView({ display: getBackpackDisplay("locked") });
  const unlockedWithoutCopyView = BackpackView({
    display: getBackpackDisplay("all"),
  });

  assert.equal(
    findElementsByClassName(lockedView, "backpack-item-button").length,
    0,
  );
  assert.equal(
    findElementsByClassName(unlockedWithoutCopyView, "backpack-item-button")
      .length,
    0,
  );
});

test("底部導覽只在有新收藏時顯示背包通知", () => {
  const navigationWithNotification = BottomNavigation({
    activeTab: "backpack",
    hasNewBackpackItem: true,
    onChange: () => {},
  });
  const navigationWithoutNotification = BottomNavigation({
    activeTab: "backpack",
    hasNewBackpackItem: false,
    onChange: () => {},
  });

  assert.equal(
    findElementsByClassName(
      navigationWithNotification,
      "bottom-navigation-notification",
    ).length,
    1,
  );
  assert.equal(
    findElementsByClassName(
      navigationWithoutNotification,
      "bottom-navigation-notification",
    ).length,
    0,
  );
});

test("N 標籤與導覽文字同層，才能跟著文字置中對齊", () => {
  const navigation = BottomNavigation({
    activeTab: "backpack",
    hasNewBackpackItem: true,
    onChange: () => {},
  });
  const label = findElementsByClassName(navigation, "bottom-navigation-label");

  assert.equal(label.length, 3);

  const badgesInsideLabel = label.flatMap((labelElement) =>
    findElementsByClassName(
      labelElement.props.children,
      "bottom-navigation-notification",
    ),
  );

  assert.equal(badgesInsideLabel.length, 1);
});

test("導覽文字與 N 標籤以 inline-flex 置中並保留 2px 間距", () => {
  const stylesheet = readFileSync(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );
  const labelRule =
    stylesheet.match(/\.bottom-navigation-label\s*\{[^}]*\}/s)?.[0] ?? "";
  const badgeRule =
    stylesheet.match(/\.bottom-navigation-notification\s*\{[^}]*\}/s)?.[0] ?? "";

  assert.match(labelRule, /align-items:\s*center/);
  assert.match(labelRule, /display:\s*inline-flex/);
  assert.match(labelRule, /gap:\s*2px/);
  assert.doesNotMatch(badgeRule, /position:\s*absolute/);
});

test("背包標題與行程標題共用相同標題區尺寸", () => {
  const stylesheet = readFileSync(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );
  const backpackHeaderRule = stylesheet.match(
    /\.backpack-header\s*\{[^}]*\}/s,
  )?.[0] ?? "";
  const backpackTitleRule = stylesheet.match(
    /\.backpack-header h1\s*\{[^}]*\}/s,
  )?.[0] ?? "";

  assert.match(backpackHeaderRule, /height:\s*73px/);
  assert.match(backpackHeaderRule, /padding:\s*10px 32px/);
  assert.match(backpackTitleRule, /font-size:\s*36px/);
});

test("背包九格維持 93px 三欄與 24px 間距", () => {
  const stylesheet = readFileSync(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );
  const backpackGridRule = stylesheet.match(
    /\.backpack-grid\s*\{[^}]*\}/s,
  )?.[0] ?? "";

  assert.match(backpackGridRule, /grid-template-columns:\s*repeat\(3, 93px\)/);
  assert.match(backpackGridRule, /gap:\s*24px/);
});

test("背包物品格使用 93px 深色像素框與右下陰影", () => {
  const stylesheet = readFileSync(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );
  const backpackItemRule = stylesheet.match(
    /\.backpack-item\s*\{[^}]*\}/s,
  )?.[0] ?? "";

  assert.match(backpackItemRule, /border:\s*4px solid var\(--color-ink\)/);
  assert.match(backpackItemRule, /height:\s*93px/);
  assert.match(backpackItemRule, /width:\s*93px/);
  assert.match(backpackItemRule, /box-shadow:\s*4px 4px 0/);
});
