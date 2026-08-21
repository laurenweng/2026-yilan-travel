export type PretripChecklistItem = {
  id: string;
  isCompleted: boolean;
  label: string;
};

export const pretripChecklistStorageKey = "yilan-trip-pretrip-checklist-v1";

const legacyDefaultToiletriesLabel = "攜帶盥洗用品";
const defaultToiletriesLabel = "攜帶盥洗用品（牙刷牙膏）";

const defaultPretripChecklistItems: PretripChecklistItem[] = [
  {
    id: "default-tableware",
    isCompleted: false,
    label: "帶環保餐具",
  },
  {
    id: "default-toiletries",
    isCompleted: false,
    label: defaultToiletriesLabel,
  },
  {
    id: "default-clothes",
    isCompleted: false,
    label: "換洗衣物",
  },
];

export const createInitialPretripChecklist = () =>
  defaultPretripChecklistItems.map((item) => ({ ...item }));

const sortIncompleteItemsFirst = (items: PretripChecklistItem[]) => [
  ...items.filter((item) => !item.isCompleted),
  ...items.filter((item) => item.isCompleted),
];

const insertAtEndOfIncompleteItems = (
  items: PretripChecklistItem[],
  incompleteItem: PretripChecklistItem,
) => {
  const firstCompletedItemIndex = items.findIndex((item) => item.isCompleted);
  if (firstCompletedItemIndex === -1) return [...items, incompleteItem];

  return [
    ...items.slice(0, firstCompletedItemIndex),
    incompleteItem,
    ...items.slice(firstCompletedItemIndex),
  ];
};

export const addPretripChecklistItem = (
  items: PretripChecklistItem[],
  label: string,
  id: string,
) => {
  const trimmedLabel = label.trim();
  if (!trimmedLabel) return items;

  const newItem = {
    id,
    isCompleted: false,
    label: trimmedLabel,
  };
  return insertAtEndOfIncompleteItems(items, newItem);
};

export const togglePretripChecklistItem = (
  items: PretripChecklistItem[],
  targetId: string,
) => {
  const targetItem = items.find((item) => item.id === targetId);
  if (!targetItem) return items;

  const toggledItem = {
    ...targetItem,
    isCompleted: !targetItem.isCompleted,
  };
  const remainingItems = items.filter((item) => item.id !== targetId);
  if (!targetItem.isCompleted) {
    return [...remainingItems, toggledItem];
  }

  return insertAtEndOfIncompleteItems(remainingItems, toggledItem);
};

const isPretripChecklistItem = (
  candidate: unknown,
): candidate is PretripChecklistItem => {
  if (!candidate || typeof candidate !== "object") return false;

  const item = candidate as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.isCompleted === "boolean" &&
    typeof item.label === "string" &&
    item.label.trim().length > 0
  );
};

export const parsePretripChecklistStorage = (storedValue: string | null) => {
  if (!storedValue) return createInitialPretripChecklist();

  try {
    const parsedValue: unknown = JSON.parse(storedValue);
    if (!Array.isArray(parsedValue) || !parsedValue.every(isPretripChecklistItem)) {
      return createInitialPretripChecklist();
    }

    const normalizedItems = parsedValue.map((item) =>
      item.id === "default-toiletries" && item.label === legacyDefaultToiletriesLabel
        ? { ...item, label: defaultToiletriesLabel }
        : item,
    );
    return sortIncompleteItemsFirst(normalizedItems);
  } catch {
    return createInitialPretripChecklist();
  }
};

export const serializePretripChecklist = (items: PretripChecklistItem[]) =>
  JSON.stringify(items);
