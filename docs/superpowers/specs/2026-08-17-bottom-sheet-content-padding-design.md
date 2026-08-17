# Bottom Sheet 內容底部留白設計

## 目標

讓所有 Bottom Sheet 的資訊內容與視窗底部保持一致且舒適的距離，避免一般裝置在沒有安全區域時，文字或清單緊貼底部。

## 現況

- `.bottom-sheet` 只有 `env(safe-area-inset-bottom)` 的底部 padding。
- 沒有安全區域的裝置等同沒有固定底部留白。
- 分車、房間、交通說明與菜單內容目前沒有固定底部留白。
- 背包物品內容已有 `32px` 底部 margin。

## 設計

採用各資訊容器分別保留底部空間的方式：

- `.car-assignment-list`：底部 margin 調整為 `32px`。
- `.room-assignment-list`：底部 margin 調整為 `32px`。
- `.bottom-sheet-placeholder`：底部 margin 調整為 `32px`。
- `.event-info-list`：底部 margin 調整為 `32px`。
- `.backpack-item-sheet-body`：維持既有 `32px` 底部 margin。

`.bottom-sheet` 繼續只負責 `env(safe-area-inset-bottom)`，因此固定內容留白與裝置安全區域會自然相加。這也避免背包內容重複增加成 `64px`。

## 不變範圍

- 不修改 Bottom Sheet 的最大高度。
- 不修改標題區、關閉按鈕或捲動方式。
- 不新增內容包裝元件或 DOM 結構。
- 不改變各資訊內容的水平間距。

## 測試

在既有 Bottom Sheet 元件測試中檢查 CSS：

- 分車、房間、交通說明與菜單內容皆有 `32px` 底部 margin。
- 背包內容仍維持 `32px` 底部 margin。
- `.bottom-sheet` 仍保留 `env(safe-area-inset-bottom)`。

完成後執行 Bottom Sheet 聚焦測試、完整測試、lint 與差異空白檢查。
