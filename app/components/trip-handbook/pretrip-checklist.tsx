"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  addPretripChecklistItem,
  createInitialPretripChecklist,
  parsePretripChecklistStorage,
  pretripChecklistStorageKey,
  serializePretripChecklist,
  togglePretripChecklistItem,
} from "../../lib/pretrip-checklist";
import { PixelFrame } from "./pixel-frame";

const createCustomChecklistItemId = () =>
  globalThis.crypto?.randomUUID?.() ?? `custom-${Date.now()}`;

export const PretripChecklist = () => {
  const [draftItem, setDraftItem] = useState("");
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);
  const [items, setItems] = useState(createInitialPretripChecklist);

  useEffect(() => {
    const loadStorageTimerId = window.setTimeout(() => {
      try {
        setItems(
          parsePretripChecklistStorage(
            window.localStorage.getItem(pretripChecklistStorageKey),
          ),
        );
      } catch {
        setItems(createInitialPretripChecklist());
      } finally {
        setHasLoadedStorage(true);
      }
    }, 0);

    return () => window.clearTimeout(loadStorageTimerId);
  }, []);

  useEffect(() => {
    if (!hasLoadedStorage) return;

    try {
      window.localStorage.setItem(
        pretripChecklistStorageKey,
        serializePretripChecklist(items),
      );
    } catch {
      // 瀏覽器禁止儲存時仍保留本次頁面中的操作結果。
    }
  }, [hasLoadedStorage, items]);

  const handleSubmit = (submitEvent: FormEvent<HTMLFormElement>) => {
    submitEvent.preventDefault();

    const updatedItems = addPretripChecklistItem(
      items,
      draftItem,
      createCustomChecklistItemId(),
    );
    if (updatedItems === items) return;

    setItems(updatedItems);
    setDraftItem("");
  };

  const handleToggleItem = (itemId: string) => {
    setItems((currentItems) =>
      togglePretripChecklistItem(currentItems, itemId),
    );
  };

  return (
    <PixelFrame className="pretrip-checklist">
      <strong className="pretrip-checklist-title">行前 Checklist</strong>
      <ul className="pretrip-checklist-items">
        {items.map((item) => (
          <li key={item.id}>
            <label className="pretrip-checklist-item">
              <input
                checked={item.isCompleted}
                onChange={() => handleToggleItem(item.id)}
                type="checkbox"
              />
              <span className={item.isCompleted ? "is-completed" : ""}>
                {item.label}
              </span>
            </label>
          </li>
        ))}
      </ul>
      <form className="pretrip-checklist-form" onSubmit={handleSubmit}>
        <textarea
          aria-label="新增行前物品"
          onChange={(changeEvent) => setDraftItem(changeEvent.target.value)}
          placeholder="請填寫待辦項目"
          rows={2}
          value={draftItem}
        />
        <button disabled={!draftItem.trim()} type="submit">
          加入
        </button>
      </form>
    </PixelFrame>
  );
};
