# 滿版響應式版面 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓員旅手冊在所有手機寬度滿版呈現，窄螢幕只等比縮小裝飾插圖、文字與操作元件保持原尺寸。

**Architecture:** 將 `.trip-app-shell` 與底部導覽改為 viewport 寬度，使頁面底色消除灰色側邊。首頁 Hero 的雲與景物維持 393px 設計舞台並在窄螢幕等比縮小；文字獨立於舞台，因此不受縮放。內容卡片保留原有最大寬度，但改採可用寬度，使小螢幕自然收窄。

**Tech Stack:** Next.js 16、React 19、TypeScript、原生 CSS、Node 測試執行器。

## Global Constraints

- 固定淺色模式，維持既有字體、顏色與行程資料行為。
- 設計基準寬度為 `393px`；大於此寬度時不得放大像素插圖。
- 小於 `393px` 時，僅 `.trip-hero-sky` 與 `.trip-hero-scene` 等裝飾舞台可縮放。
- 文字、按鈕、輸入欄、核取方塊與底部導覽不因 viewport 寬度縮放。
- 卡片維持既有最大寬度、可縮小且不可超出 viewport。
- 不在本次工作完成後自動部署。

---

### Task 1: 建立滿版與插圖縮放的回歸測試

**Files:**

- Modify: `tests/home-view.test.tsx`
- Modify: `tests/backpack-view.test.tsx`
- Modify: `app/globals.css:18-365`

**Interfaces:**

- Consumes: CSS custom property `--content-width` 與首頁既有 `.trip-hero-sky`、`.trip-hero-scene` class。
- Produces: `--content-scale` 供首頁裝飾舞台使用；應用外殼與底部導覽採 viewport 寬度。

- [x] **Step 1: 寫入會失敗的 CSS 行為測試**

```ts
test("滿版外殼消除固定 393px 上限，Hero 裝飾只會縮小不會放大", () => {
  const stylesheet = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  const appShellRule = stylesheet.match(/\.trip-app-shell\s*\{[^}]*\}/s)?.[0] ?? "";
  const skyRule = stylesheet.match(/\.trip-hero-sky\s*\{[^}]*\}/s)?.[0] ?? "";

  assert.doesNotMatch(appShellRule, /max-width:\s*var\(--content-width\)/);
  assert.match(stylesheet, /--content-scale:\s*min\(1, calc\(100vw \/ var\(--content-width\)\)\)/);
  assert.match(skyRule, /scale\(var\(--content-scale\)\)/);
});
```

- [x] **Step 2: 執行測試，確認因目前固定 393px 外殼與缺少縮放變數而失敗**

Run: `npm run test:component -- --test-name-pattern='滿版外殼消除固定'`

Expected: FAIL，因 `.trip-app-shell` 仍有 `max-width: var(--content-width)`，且 CSS 尚未定義 `--content-scale`。

- [x] **Step 3: 寫入最小 CSS 實作**

```css
:root {
  --content-scale: min(1, calc(100vw / var(--content-width)));
}

.trip-app-shell {
  max-width: none;
  width: 100%;
}

.trip-hero-sky,
.trip-hero-scene {
  left: 50%;
  right: auto;
  transform: translateX(-50%) scale(var(--content-scale));
  width: var(--content-width);
}
```

- [x] **Step 4: 執行測試，確認滿版殼層與插圖縮放規則通過**

Run: `npm run test:component -- --test-name-pattern='滿版外殼消除固定'`

Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add app/globals.css tests/home-view.test.tsx tests/backpack-view.test.tsx && git commit -m "fix: make trip handbook layout full bleed"
```

### Task 2: 讓卡片收窄、導覽滿版且不縮放文字

**Files:**

- Modify: `tests/home-view.test.tsx`
- Modify: `tests/itinerary-view.test.tsx`
- Modify: `tests/backpack-view.test.tsx`
- Modify: `app/globals.css:340-1789`

**Interfaces:**

- Consumes: Task 1 提供的滿版外殼與 `--content-scale`。
- Produces: 可在窄螢幕收窄的首頁、行程與 Bottom Sheet 卡片；滿版底部導覽列。

- [x] **Step 1: 寫入會失敗的 CSS 行為測試**

```ts
test("主要卡片保留最大寬度且可在窄螢幕收窄，導覽列維持滿版", () => {
  const stylesheet = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  const checklistRule = stylesheet.match(/\.pretrip-checklist\s*\{[^}]*\}/s)?.[0] ?? "";
  const navigationRule = stylesheet.match(/\.bottom-navigation\s*\{[^}]*\}/s)?.[0] ?? "";

  assert.match(checklistRule, /max-width:\s*330px/);
  assert.match(checklistRule, /width:\s*100%/);
  assert.doesNotMatch(navigationRule, /max-width:\s*var\(--content-width\)/);
  assert.doesNotMatch(navigationRule, /font-size:\s*calc/);
});
```

- [x] **Step 2: 執行測試，確認目前固定卡片寬度與受限導覽列導致失敗**

Run: `npm run test:component -- --test-name-pattern='主要卡片保留最大寬度'`

Expected: FAIL，因卡片目前只有固定 `width`，底部導覽仍使用 `max-width: var(--content-width)`。

- [x] **Step 3: 寫入最小 CSS 實作**

```css
.home-content {
  align-items: center;
  padding-inline: clamp(16px, 8vw, 32px);
}

.pretrip-checklist {
  max-width: 330px;
  width: 100%;
}

.home-event-card,
.home-status-card {
  max-width: 338px;
  width: 100%;
}

.itinerary-card {
  max-width: 282px;
  width: 100%;
}

.bottom-navigation {
  left: 0;
  max-width: none;
  transform: none;
}
```

- [x] **Step 4: 執行元件測試，確認卡片與導覽行為通過**

Run: `npm run test:component`

Expected: PASS，所有首頁、行程、背包、Bottom Sheet 與能量條元件測試通過。

- [ ] **Step 5: Commit**

```bash
git add app/globals.css tests/home-view.test.tsx tests/itinerary-view.test.tsx tests/backpack-view.test.tsx && git commit -m "fix: keep handbook controls readable on narrow screens"
```

### Task 3: 完整驗證與文件狀態更新

**Files:**

- Modify: `docs/superpowers/plans/2026-08-14-full-bleed-responsive-layout.md`

**Interfaces:**

- Consumes: Task 1 與 Task 2 的 CSS 行為與測試覆蓋。
- Produces: 已勾選的執行紀錄與可交付的建置結果。

- [x] **Step 1: 執行完整自動化測試**

Run: `npm test`

Expected: PASS，unit、component 與 rendered HTML 測試全部通過。

- [x] **Step 2: 執行 lint**

Run: `npm run lint`

Expected: PASS，沒有 lint error。

- [x] **Step 3: 執行正式建置**

Run: `npm run build`

Expected: PASS，產生可部署的網站輸出。

- [x] **Step 4: 更新每個已完成步驟的核取方塊，並檢查工作區差異**

```bash
git diff --check && git status --short
```

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/plans/2026-08-14-full-bleed-responsive-layout.md && git commit -m "docs: record responsive layout verification"
```

## Self-review

- Spec coverage: Task 1 覆蓋滿版背景與小螢幕插圖縮放；Task 2 覆蓋卡片收窄、字體不縮放、底部導覽與 Bottom Sheet；Task 3 覆蓋完整測試、lint 與建置。沒有未涵蓋的規格。
- Placeholder scan: 本文件未使用 TBD、TODO、similar 或未具體化的測試步驟。
- Interface consistency: Hero 舞台沿用既有 class，以比例座標處理縮放；Task 2 沿用既有 class，不增加 TypeScript API 或資料結構。

## 部署後相容性修正

- Android 瀏覽器不支援原本的 CSS 除法，導致包含 scale(var(--content-scale)) 的 transform 宣告無效，而 left: 50% 仍生效，使 Hero 景物偏到右側。
- Hero 舞台改為 width: min(100%, var(--content-width)) 與 aspect-ratio: 393 / 161；雲、樹、車與松樹改用相對百分比位置與寬度，因此窄螢幕仍等比縮小，不依賴 CSS 除法。
- 已新增回歸測試，確保未來不會重新引入 CSS 除法縮放。
