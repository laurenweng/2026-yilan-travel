"use client";

import Image from "next/image";
import type { BackpackDisplayItem } from "../../lib/backpack-state";
import {
  getTravelerArtworkName,
  type TravelerGender,
} from "../../lib/traveler-gender";
import { BottomSheet } from "./bottom-sheet";

type BackpackItemSheetProps = {
  item: BackpackDisplayItem;
  onClose: () => void;
  returnFocusTo: HTMLElement | null;
  travelerGender?: TravelerGender;
};

export const BackpackItemSheet = ({
  item,
  onClose,
  returnFocusTo,
  travelerGender = "male",
}: BackpackItemSheetProps) => {
  const detailArtworkName = item.detailArtwork
    ? getTravelerArtworkName(item.detailArtwork, travelerGender)
    : undefined;

  return (
    <BottomSheet onClose={onClose} returnFocusTo={returnFocusTo} title="物品">
      <div className="backpack-item-sheet-body">
        {detailArtworkName ? (
          <Image
            alt={item.name}
            className="backpack-item-sheet-detail-artwork"
            height={456}
            src={`/assets/yilan/${detailArtworkName}`}
            unoptimized
            width={658}
          />
        ) : (
          <Image
            alt=""
            className="backpack-item-sheet-artwork"
            height={93}
            src={`/assets/yilan/${item.artwork}`}
            unoptimized
            width={93}
          />
        )}
        <strong className="backpack-item-sheet-name">{item.name}</strong>
        {item.copy && <p className="backpack-item-sheet-copy">{item.copy}</p>}
      </div>
    </BottomSheet>
  );
};
