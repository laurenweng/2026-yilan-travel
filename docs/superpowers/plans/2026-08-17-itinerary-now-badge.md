# 行程頁 NOW 標籤 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在「行程」頁的目前進行中行程 title 前顯示紅底白字 NOW 標籤，並與首頁共用同一份時間快照。

**Architecture:** `TripHandbook` 繼續作為唯一的時間狀態來源，將既有 `snapshot.currentEvents` 傳入 `ItineraryView`。`ItineraryView` 依事件 ID 判斷是否渲染標籤，不重新計算時間，也不使用 title 或時間文字比對。

**Tech Stack:** React 19、TypeScript、Next Image、CSS、Node test runner、tsx、Vinext

## Global Constraints

- 非進行中的行程完全不渲染 NOW，也不保留空白位置。
- 標籤文字固定為大寫 `NOW`，使用紅底白字，視覺接近背包的 `New` 標籤。
- 同一時段的所有 `currentEvents` 都顯示 NOW。
- 開始時間包含、結束時間不包含的規則必須沿用 `resolveTripSnapshot`。
- 行程頁不得另建時間計算或時區邏輯。
- 不新增套件，不刪除既有素材，不在本計畫內部署。

---

## File Structure

- Modify: `app/components/trip-handbook/trip-handbook.tsx` — 將共用快照中的 `currentEvents` 傳給行程頁。
- Modify: `app/components/trip-handbook/itinerary-view.tsx` — 依目前事件 ID 條件渲染 title 與 NOW 標籤。
- Modify: `app/globals.css` — 定義 title 橫向排版與紅底白字像素標籤。
- Modify: `tests/itinerary-view.test.tsx` — 驗證單筆、多筆、非進行中、不同日期及樣式規則。

### Task 1: 共用首頁狀態並渲染行程 NOW 標籤

**Files:**
- Modify: `tests/itinerary-view.test.tsx`
- Modify: `app/components/trip-handbook/trip-handbook.tsx`
- Modify: `app/components/trip-handbook/itinerary-view.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `TripSnapshot.currentEvents: TripEvent[]`，由 `resolveTripSnapshot(events, effectiveTime)` 產生。
- Produces: `ItineraryViewProps.currentEvents: TripEvent[]`、`.itinerary-card-title`、`.itinerary-now-badge`。

- [ ] **Step 1: 寫入會失敗的 NOW 顯示測試**

在 `tests/itinerary-view.test.tsx` 新增同日第二筆行程，並為既有 `ItineraryView` 呼叫補上 `currentEvents: []`。新增以下測試：

```tsx
const concurrentItineraryEvent: TripEvent = {
  ...itineraryEvent,
  id: "farm-shop",
  title: "農場採買",
};

test("只有目前進行中的行程 title 前顯示 NOW", () => {
  const view = ItineraryView({
    currentEvents: [itineraryEvent],
    events: [itineraryEvent, concurrentItineraryEvent],
    onDateChange: () => {},
    onOpenEvent: () => {},
    selectedDate: "2026-08-29",
  });
  const badges = findElementsByClassName(view, "itinerary-now-badge");

  assert.equal(badges.length, 1);
  assert.equal(getTextContent(badges[0]), "NOW");
});

test("同時段的所有目前行程都顯示 NOW", () => {
  const view = ItineraryView({
    currentEvents: [itineraryEvent, concurrentItineraryEvent],
    events: [itineraryEvent, concurrentItineraryEvent],
    onDateChange: () => {},
    onOpenEvent: () => {},
    selectedDate: "2026-08-29",
  });

  assert.equal(
    findElementsByClassName(view, "itinerary-now-badge").length,
    2,
  );
});

test("查看非目前日期時不顯示 NOW", () => {
  const view = ItineraryView({
    currentEvents: [itineraryEvent],
    events: [itineraryEvent, secondDayEvent],
    onDateChange: () => {},
    onOpenEvent: () => {},
    selectedDate: "2026-08-30",
  });

  assert.equal(findElementsByClassName(view, "itinerary-now-badge").length, 0);
});

test("NOW 使用通知紅底白字且不壓縮 title", () => {
  const stylesheet = readFileSync(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );
  const badgeRule =
    stylesheet.match(/\.itinerary-now-badge\s*\{[^}]*\}/s)?.[0] ?? "";
  const titleRule =
    stylesheet.match(/\.itinerary-card-title\s*\{[^}]*\}/s)?.[0] ?? "";

  assert.match(badgeRule, /background:\s*var\(--color-notification\)/);
  assert.match(badgeRule, /color:\s*var\(--color-panel\)/);
  assert.match(badgeRule, /flex:\s*0 0 auto/);
  assert.match(titleRule, /display:\s*flex/);
});
```

- [ ] **Step 2: 執行聚焦測試並確認失敗**

Run:

```bash
./node_modules/.bin/tsx --test --test-name-pattern="NOW|目前進行中的行程" tests/itinerary-view.test.tsx
```

Expected: FAIL，原因為 `ItineraryViewProps` 尚無 `currentEvents`，或找不到 `.itinerary-now-badge` 與對應 CSS。

- [ ] **Step 3: 將共用 currentEvents 傳入行程頁**

在 `app/components/trip-handbook/trip-handbook.tsx` 更新 `ItineraryView` 呼叫：

```tsx
<ItineraryView
  currentEvents={snapshot?.currentEvents ?? []}
  events={events}
  onDateChange={setSelectedItineraryDate}
  onOpenEvent={handleOpenEvent}
  selectedDate={selectedItineraryDate}
/>
```

- [ ] **Step 4: 依事件 ID 條件渲染 NOW**

在 `app/components/trip-handbook/itinerary-view.tsx` 擴充 props，並建立目前事件 ID 集合：

```tsx
type ItineraryViewProps = {
  currentEvents: TripEvent[];
  events: TripEvent[];
  onDateChange: (date: ItineraryDate) => void;
  onOpenEvent: (event: TripEvent, triggerElement: HTMLElement) => void;
  selectedDate: ItineraryDate;
};

export const ItineraryView = ({
  currentEvents,
  events,
  onDateChange,
  onOpenEvent,
  selectedDate,
}: ItineraryViewProps) => {
  const currentEventIds = new Set(currentEvents.map((event) => event.id));
  const selectedDayEvents = events.filter((event) => event.date === selectedDate);
```

用 title 容器取代原本單獨的 `<strong>`：

```tsx
<div className="itinerary-card-title">
  {currentEventIds.has(event.id) && (
    <span className="itinerary-now-badge">NOW</span>
  )}
  <strong>{event.title}</strong>
</div>
```

- [ ] **Step 5: 加入不壓縮 title 的紅底白字樣式**

在 `app/globals.css` 的行程卡內容樣式旁新增：

```css
.itinerary-card-title {
  align-items: flex-start;
  display: flex;
  gap: 6px;
}

.itinerary-now-badge {
  align-items: center;
  background: var(--color-notification);
  color: var(--color-panel);
  display: inline-flex;
  flex: 0 0 auto;
  font-family: ui-monospace, "SFMono-Regular", Menlo, monospace;
  font-size: 13px;
  font-weight: 700;
  height: 15px;
  justify-content: center;
  line-height: 1;
  min-width: 36px;
  padding: 2px 4px;
  position: relative;
  top: 5px;
}
```

- [ ] **Step 6: 執行聚焦測試並確認通過**

Run:

```bash
./node_modules/.bin/tsx --test --test-name-pattern="NOW|目前進行中的行程" tests/itinerary-view.test.tsx
```

Expected: 4 個 NOW 相關測試 PASS，0 FAIL。

- [ ] **Step 7: 執行完整驗證**

Run:

```bash
npm test
npm run lint
git diff --check
```

Expected: 單元、元件、正式建置與 rendered HTML 測試全部 PASS；ESLint 與 diff whitespace 檢查皆為 0 errors。

- [ ] **Step 8: 提交功能變更**

```bash
git add app/components/trip-handbook/trip-handbook.tsx app/components/trip-handbook/itinerary-view.tsx app/globals.css tests/itinerary-view.test.tsx
git commit -m "✨ feat: 標示目前進行中的行程"
```

Expected: commit 只包含 NOW 標籤功能、樣式與測試；部署需另行取得使用者確認。
