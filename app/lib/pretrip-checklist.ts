export type PretripChecklistItem = {
  id: string;
  isCompleted: boolean;
  label: string;
};

export const pretripChecklistStorageKey = "yilan-trip-pretrip-checklist-v1";

const defaultPretripChecklistItems: PretripChecklistItem[] = [
  {
    id: "default-tableware",
    isCompleted: false,
    label: "帶環保餐具",
  },
  {
    id: "default-toiletries",
    isCompleted: false,
    label: "攜帶盥洗用品",
  },
  {
    id: "default-clothes",
    isCompleted: false,
    label: "換洗衣物",
  },
];

export const createInitialPretripChecklist = () =>
  defaultPretripChecklistItems.map((item) => ({ ...item }));

export const addPretripChecklistItem = (
  items: PretripChecklistItem[],
  label: string,
  id: string,
) => {
  const trimmedLabel = label.trim();
  if (!trimmedLabel) return items;

  return [
    ...items,
    {
      id,
      isCompleted: false,
      label: trimmedLabel,
    },
  ];
};

export const togglePretripChecklistItem = (
  items: PretripChecklistItem[],
  targetId: string,
) =>
  items.map((item) =>
    item.id === targetId
      ? { ...item, isCompleted: !item.isCompleted }
      : item,
  );

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

    return parsedValue;
  } catch {
    return createInitialPretripChecklist();
  }
};

export const serializePretripChecklist = (items: PretripChecklistItem[]) =>
  JSON.stringify(items);
