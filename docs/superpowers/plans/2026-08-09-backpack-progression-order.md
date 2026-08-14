# 背包旅程順序 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 將背包九格改為依旅程取得順序，由左至右、由上至下顯示。

**Architecture:** 背包畫面依 `backpackSlots` 的陣列順序渲染。只需調整此單一資料來源的九個固定格位，解鎖判斷與畫面元件無須改變。宜蘭青蛙怪與盾牌仍在同一格中切換。

**Tech Stack:** TypeScript、React、Node.js 內建測試。

## Global Constraints

- 只調整背包格位順序與測試期望值。
- 維持九格、鎖定格、New 提示與已讀邏輯。
- 青蛙怪與盾牌必須共用同一格。

---

### Task 1: 將格位改為旅程進度順序

**Files:**
- Modify: `app/lib/backpack-catalog.ts`
- Test: `tests/backpack-progress.test.ts`
- Test: `tests/backpack-view.test.tsx`

**Interfaces:**
- Consumes: `backpackSlots: BackpackItemId[][]`
- Produces: 依陣列順序提供給 `resolveBackpackDisplay` 與 `BackpackView` 的九個格位。

- [ ] **Step 1: 寫入會失敗的測試**

```ts
assert.deepEqual(
  display.items.map((item) => item.name),
  ["藥水", "炸雞", "宜蘭青蛙怪", "眼睛", "飲料", "愛心", "閃電", "星星", "蘋果"],
);
```

- [ ] **Step 2: 執行測試確認失敗**

Run: `npm run test:unit -- --test-name-pattern="格子固定順序"`

Expected: 預期的旅程順序與現有物品種類順序不同。

- [ ] **Step 3: 最小化實作**

```ts
export const backpackSlots: BackpackItemId[][] = [
  ["potion"],
  ["fried-chicken"],
  ["bomb", "shield"],
  ["eyes"],
  ["drink"],
  ["heart"],
  ["lightning"],
  ["star"],
  ["apple"],
];
```

- [ ] **Step 4: 執行背包相關測試確認通過**

Run: `npm run test:unit && npm run test:component`

Expected: 背包進度與背包畫面測試通過。

- [ ] **Step 5: 執行完整驗證**

Run: `npm test && npm run lint`

Expected: 測試、編譯與 lint 皆通過。
