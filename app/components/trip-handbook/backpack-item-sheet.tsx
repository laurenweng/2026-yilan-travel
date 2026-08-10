"use client";

import Image from "next/image";
import type { BackpackDisplayItem } from "../../lib/backpack-state";
import { BottomSheet } from "./bottom-sheet";

type BackpackItemSheetProps = {
  item: BackpackDisplayItem;
  onClose: () => void;
  returnFocusTo: HTMLElement | null;
};

export const BackpackItemSheet = ({
  item,
  onClose,
  returnFocusTo,
}: BackpackItemSheetProps) => {
  return (
    <BottomSheet onClose={onClose} returnFocusTo={returnFocusTo} title="物品">
      <div className="backpack-item-sheet-body">
        <Image
          alt=""
          className="backpack-item-sheet-artwork"
          height={93}
          src={`/assets/yilan/${item.artwork}`}
          unoptimized
          width={93}
        />
        <strong className="backpack-item-sheet-name">{item.name}</strong>
        {item.copy && <p className="backpack-item-sheet-copy">{item.copy}</p>}
      </div>
    </BottomSheet>
  );
};
