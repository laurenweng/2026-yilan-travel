"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";
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

type BackpackChallengeSheetProps = {
  item: BackpackDisplayItem;
  onClose: () => void;
  onSubmitAnswer: (answer: string) => boolean;
  returnFocusTo: HTMLElement | null;
};

export const BackpackChallengeSheet = ({
  item,
  onClose,
  onSubmitAnswer,
  returnFocusTo,
}: BackpackChallengeSheetProps) => {
  const [answer, setAnswer] = useState("");
  const [hasError, setHasError] = useState(false);

  const handleSubmit = (submitEvent: FormEvent<HTMLFormElement>) => {
    submitEvent.preventDefault();
    setHasError(!onSubmitAnswer(answer));
  };

  return (
    <BottomSheet
      onClose={onClose}
      returnFocusTo={returnFocusTo}
      title="解鎖問題"
    >
      <form className="backpack-challenge-form" onSubmit={handleSubmit}>
        <p className="backpack-challenge-question">
          {item.challenge?.question}
        </p>
        <label className="backpack-challenge-label">
          <span>輸入答案</span>
          <input
            aria-label="輸入答案"
            autoComplete="off"
            className="backpack-challenge-input"
            onChange={(changeEvent) => {
              setAnswer(changeEvent.currentTarget.value);
              setHasError(false);
            }}
            type="text"
            value={answer}
          />
        </label>
        {hasError && (
          <p aria-live="polite" className="backpack-challenge-error">
            答案不對，再想想看！
          </p>
        )}
        <button className="backpack-challenge-submit" type="submit">
          確認答案
        </button>
      </form>
    </BottomSheet>
  );
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
