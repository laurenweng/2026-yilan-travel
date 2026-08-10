import assert from "node:assert/strict";
import test from "node:test";
import * as checklistModule from "../app/lib/pretrip-checklist.ts";

type ChecklistItem = {
  id: string;
  isCompleted: boolean;
  label: string;
};

const getChecklistFunction = <FunctionType>(name: string) => {
  const candidate = (checklistModule as Record<string, unknown>)[name];
  assert.equal(typeof candidate, "function", `${name} 尚未實作`);
  return candidate as FunctionType;
};

test("行前 Checklist 顯示三個固定準備項目", () => {
  const createInitialPretripChecklist = getChecklistFunction<
    () => ChecklistItem[]
  >("createInitialPretripChecklist");

  assert.deepEqual(createInitialPretripChecklist(), [
    { id: "default-tableware", isCompleted: false, label: "帶環保餐具" },
    { id: "default-toiletries", isCompleted: false, label: "攜帶盥洗用品" },
    { id: "default-clothes", isCompleted: false, label: "換洗衣物" },
  ]);
});

test("送出非空白文字會新增一個未完成項目", () => {
  const addPretripChecklistItem = getChecklistFunction<
    (items: ChecklistItem[], label: string, id: string) => ChecklistItem[]
  >("addPretripChecklistItem");

  assert.deepEqual(
    addPretripChecklistItem([], "  行動電源  ", "custom-power-bank"),
    [
      {
        id: "custom-power-bank",
        isCompleted: false,
        label: "行動電源",
      },
    ],
  );
});

test("空白文字不會新增項目", () => {
  const addPretripChecklistItem = getChecklistFunction<
    (items: ChecklistItem[], label: string, id: string) => ChecklistItem[]
  >("addPretripChecklistItem");
  const originalItems = [
    { id: "existing", isCompleted: false, label: "既有項目" },
  ];

  assert.deepEqual(
    addPretripChecklistItem(originalItems, "   ", "custom-empty"),
    originalItems,
  );
});

test("勾選項目只會切換指定項目的完成狀態", () => {
  const togglePretripChecklistItem = getChecklistFunction<
    (items: ChecklistItem[], id: string) => ChecklistItem[]
  >("togglePretripChecklistItem");
  const originalItems = [
    { id: "first", isCompleted: false, label: "第一項" },
    { id: "second", isCompleted: false, label: "第二項" },
  ];

  assert.deepEqual(togglePretripChecklistItem(originalItems, "second"), [
    { id: "first", isCompleted: false, label: "第一項" },
    { id: "second", isCompleted: true, label: "第二項" },
  ]);
});

test("儲存內容可重新載入，損壞內容則回到預設清單", () => {
  const createInitialPretripChecklist = getChecklistFunction<
    () => ChecklistItem[]
  >("createInitialPretripChecklist");
  const parsePretripChecklistStorage = getChecklistFunction<
    (storedValue: string | null) => ChecklistItem[]
  >("parsePretripChecklistStorage");
  const serializePretripChecklist = getChecklistFunction<
    (items: ChecklistItem[]) => string
  >("serializePretripChecklist");
  const savedItems = [
    { id: "saved", isCompleted: true, label: "已保存項目" },
  ];

  assert.deepEqual(
    parsePretripChecklistStorage(serializePretripChecklist(savedItems)),
    savedItems,
  );
  assert.deepEqual(
    parsePretripChecklistStorage("不是 JSON"),
    createInitialPretripChecklist(),
  );
});
