# 背包大合照 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 將旅程完成後的蘋果收藏改為大合照，並在物品 Bottom Sheet 呈現寬版合照。

**Architecture:** `apple` 保持內部 ID，背包目錄改管理大合照的名稱、小圖、詳情大圖與舊 Excel 值別名。背包進度將詳情圖帶進顯示資料；Bottom Sheet 僅在該欄位存在時渲染大圖，其他物品維持 93px 像素插圖。

**Tech Stack:** TypeScript、React 19、Next Image、Node 內建測試、CSS。

## Global Constraints

- `apple` ID、最後一格位置、localStorage 已讀資料與 New 提示不變。
- Excel「解鎖對應」維持 `蘋果`；顯示名稱為 `大合照`，小圖為 `照片.svg`，詳情圖為 `大合照.png`。
- Bottom Sheet 標題維持「物品」；詳情圖下方顯示名稱與 Excel 的物品文案。
- 沒有詳情圖的物品維持原本 93px、像素化與陰影樣式。
- 不更動解鎖時間、共用 Bottom Sheet 外殼或其他 Sheet。

---

### Task 1: 將 Excel 舊值解析為大合照收藏

**Files:**
- Modify: `app/lib/backpack-catalog.ts`
- Modify: `app/lib/backpack-state.ts`
- Modify: `app/lib/backpack-progress.ts`
- Test: `tests/trip-csv.test.ts`
- Test: `tests/backpack-progress.test.ts`
- Test: `tests/backpack-view.test.tsx`

**Interfaces:**
- Produces: `BackpackCatalogItem.aliases?: readonly string[]`、`detailArtwork?: "大合照.png"` 與 `BackpackDisplayItem.detailArtwork?: "大合照.png"`。

- [ ] **Step 1: 寫入失敗的 CSV 測試**

在 `tests/trip-csv.test.ts` 新增測試，讀取正式 CSV 的 `d2-home`，並斷言其 reward 為：

```ts
{
  artwork: "照片.svg",
  itemId: "apple",
  name: "大合照",
}
```

- [ ] **Step 2: 執行測試確認失敗**

Run: `npm run test:unit -- --test-name-pattern="蘋果解鎖對應會顯示為大合照"`

Expected: FAIL，現有資料仍為 `蘋果.svg` 與「蘋果」。

- [ ] **Step 3: 最小化目錄與資料傳遞實作**

在 `backpack-catalog.ts` 定義：

```ts
export type BackpackDetailArtwork = "大合照.png";

export type BackpackCatalogItem = {
  aliases?: readonly string[];
  artwork: BackpackArtwork;
  detailArtwork?: BackpackDetailArtwork;
  id: BackpackItemId;
  name: string;
};
```

將 `BackpackArtwork` 的 `"蘋果.svg"` 改為 `"照片.svg"`，並把 `apple` 設為：

```ts
{
  aliases: ["蘋果"],
  artwork: "照片.svg",
  detailArtwork: "大合照.png",
  id: "apple",
  name: "大合照",
}
```

讓 `findBackpackItemByArtwork` 比對 `item.aliases?.includes(normalizedValue)`；在 `BackpackDisplayItem` 新增 `detailArtwork`，並由 `resolveBackpackDisplay` 回傳 `catalogItem.detailArtwork`。

- [ ] **Step 4: 更新視圖期望並驗證**

將 `tests/backpack-view.test.tsx` 第九格期望改為 `照片.svg`，將 `tests/backpack-progress.test.ts` 最後一項名稱改為「大合照」。

Run: `npm run test:unit && npm run test:component`

Expected: PASS，舊 Excel 值 `蘋果` 仍解鎖 `apple`，但畫面資料變為大合照與照片小圖。

- [ ] **Step 5: Commit**

```text
✨ feat(背包): 將蘋果收藏改為大合照
```

### Task 2: 在 Bottom Sheet 顯示大尺寸合照

**Files:**
- Modify: `app/components/trip-handbook/backpack-item-sheet.tsx`
- Modify: `app/globals.css`
- Test: `tests/bottom-sheets.test.tsx`

**Interfaces:**
- Consumes: `BackpackDisplayItem.detailArtwork?: "大合照.png"`。
- Produces: 有詳情圖的物品顯示寬版合照；沒有詳情圖的物品維持既有插圖。

- [ ] **Step 1: 寫入失敗的 Bottom Sheet 測試**

在 `tests/bottom-sheets.test.tsx` 建立：

```ts
const groupPhotoBackpackItem: BackpackDisplayItem = {
  artwork: "照片.svg",
  copy: "結束旅程，將所有旅行的回憶都放進心裡",
  detailArtwork: "大合照.png",
  id: "apple",
  isNew: false,
  isUnlocked: true,
  name: "大合照",
};
```

斷言 `BackpackItemSheet` 輸出 `src="/assets/yilan/大合照.png"`、`alt="大合照"` 與 `backpack-item-sheet-detail-artwork` class；CSS 規則必須有 `width: 100%`、`height: auto`、`max-width: 329px`，且不包含 `filter` 或 `image-rendering`。

- [ ] **Step 2: 執行測試確認失敗**

Run: `npm run test:component -- --test-name-pattern="大合照物品在 Bottom Sheet 使用寬版詳情圖片"`

Expected: FAIL，元件仍使用 `照片.svg` 與 `backpack-item-sheet-artwork`。

- [ ] **Step 3: 最小化元件與樣式實作**

在 `BackpackItemSheet` 以 `item.detailArtwork` 條件渲染下列圖片，否則保留既有 93px `item.artwork` 圖片：

```tsx
<Image
  alt={item.name}
  className="backpack-item-sheet-detail-artwork"
  height={1044}
  src={`/assets/yilan/${item.detailArtwork}`}
  unoptimized
  width={1507}
/>
```

在 `globals.css` 新增：

```css
.backpack-item-sheet-detail-artwork {
  height: auto;
  max-width: 329px;
  width: 100%;
}
```

- [ ] **Step 4: 驗證大合照與完整專案**

Run: `npm run test:component -- --test-name-pattern="BottomSheet|大合照"`

Expected: PASS，原有共用 Sheet 與新大合照測試均通過。

Run: `npm test && npm run lint`

Expected: PASS，完整建置、單元、元件、渲染測試與 lint 均無錯誤。

- [ ] **Step 5: Commit**

```text
✨ feat(背包): 在物品詳情顯示大合照
```
