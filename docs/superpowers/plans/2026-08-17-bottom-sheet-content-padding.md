# Bottom Sheet 內容底部留白 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓分車、房間、交通說明、菜單與背包資訊在 Bottom Sheet 底部皆保留固定 `32px` 內容留白，並繼續疊加裝置安全區域。

**Architecture:** 保留共用 `.bottom-sheet` 的安全區域責任，不新增元件或 DOM。直接在各資訊內容容器補齊底部 margin，背包既有 `32px` 不變，避免重複留白。

**Tech Stack:** React 19、TypeScript、CSS、Node test runner、tsx、Vinext

## Global Constraints

- 分車、房間、交通說明與菜單內容的固定底部留白為 `32px`。
- 背包資訊維持既有 `32px` 底部留白，不得增加成 `64px`。
- `.bottom-sheet` 繼續保留 `env(safe-area-inset-bottom)`。
- 不修改 Bottom Sheet 高度、標題、關閉按鈕、捲動方式、水平間距或 DOM 結構。
- 不新增套件。

---

## File Structure

- Modify: `tests/bottom-sheets.test.tsx` — 驗證每種 Bottom Sheet 資訊內容具有一致的底部留白，且安全區域規則不變。
- Modify: `app/globals.css` — 為分車、房間、交通說明與菜單內容補上 `32px` 底部 margin。

### Task 1: 統一 Bottom Sheet 資訊內容的底部留白

**Files:**
- Test: `tests/bottom-sheets.test.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: 既有 `.bottom-sheet`、`.car-assignment-list`、`.room-assignment-list`、`.bottom-sheet-placeholder`、`.event-info-list`、`.backpack-item-sheet-body` CSS selectors。
- Produces: 各資訊內容容器固定 `32px` 底部留白；`.bottom-sheet` 繼續疊加 `env(safe-area-inset-bottom)`。

- [ ] **Step 1: 寫入會失敗的底部留白測試**

在 `tests/bottom-sheets.test.tsx` 新增：

```tsx
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
```

這個測試會在任何資訊容器遺失固定留白、背包留白被重複調整，或安全區域規則被移除時失敗。

- [ ] **Step 2: 執行聚焦測試並確認失敗**

Run:

```bash
PATH=/Users/laurenweng/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/tsx --test --test-name-pattern="所有資訊內容與底部" tests/bottom-sheets.test.tsx
```

Expected: FAIL；分車、房間及資訊內容規則仍是 `margin: 0 32px`，尚未包含底部 `32px`。

- [ ] **Step 3: 補齊各資訊容器的底部 margin**

在 `app/globals.css` 修改三個既有規則：

```css
.car-assignment-list {
  display: grid;
  margin: 0 32px 32px;
  width: 329px;
}

.bottom-sheet-placeholder,
.event-info-list {
  font-size: 16px;
  line-height: 1.7;
  margin: 0 32px 32px;
}

.room-assignment-list {
  display: grid;
  margin: 0 32px 32px;
  width: 329px;
}
```

不要修改 `.backpack-item-sheet-body` 或 `.bottom-sheet`，兩者已分別提供 `32px` 固定留白與裝置安全區域。

- [ ] **Step 4: 執行聚焦測試並確認通過**

Run:

```bash
PATH=/Users/laurenweng/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/tsx --test --test-name-pattern="所有資訊內容與底部" tests/bottom-sheets.test.tsx
```

Expected: 1 個聚焦測試 PASS，0 FAIL。

- [ ] **Step 5: 執行完整驗證**

Run:

```bash
PATH=/Users/laurenweng/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH npm test
npm run lint
git diff --check
```

Expected: 單元、元件、正式建置與 rendered HTML 測試全部 PASS；ESLint 與 diff whitespace 檢查皆無錯誤。

- [ ] **Step 6: 提交功能變更**

先依專案 commit 流程向使用者確認確切訊息，再執行：

```bash
git add app/globals.css tests/bottom-sheets.test.tsx docs/superpowers/plans/2026-08-17-bottom-sheet-content-padding.md
git commit -m "💄 style: 增加 Bottom Sheet 內容底部留白"
```

Expected: commit 僅包含 Bottom Sheet 留白樣式、對應測試與本實作計畫；推送與部署需另行取得使用者確認。
