import Image from "next/image";
import type {
  BackpackDisplay,
  BackpackDisplayItem,
} from "../../lib/backpack-state";
import {
  getTravelerArtworkName,
  type TravelerGender,
} from "../../lib/traveler-gender";

type BackpackArtworkPreloadsProps = {
  display: BackpackDisplay;
  travelerGender: TravelerGender;
};

export const BackpackArtworkPreloads = ({
  display,
  travelerGender,
}: BackpackArtworkPreloadsProps) => {
  const artworkSources = display.items.map((item) => {
    const artwork = item.isUnlocked
      ? item.artwork
      : item.isChallengeAvailable
        ? "問號.webp"
        : "鎖頭.webp";
    return `/assets/yilan/${artwork}`;
  });
  artworkSources.push("/assets/yilan/鴨子.webp");

  display.items.forEach((item) => {
    if (!item.isUnlocked || !item.detailArtwork) return;

    artworkSources.push(
      `/assets/yilan/${getTravelerArtworkName(
        item.detailArtwork,
        travelerGender,
      )}`,
    );
  });

  return (
    <>
      {[...new Set(artworkSources)].map((artworkSource) => (
        <link as="image" href={artworkSource} key={artworkSource} rel="preload" />
      ))}
    </>
  );
};

const sheetArtworkSources = [
  "/assets/yilan/Ａ車.webp",
  "/assets/yilan/Ｂ車.webp",
  "/assets/yilan/計程車.webp",
  "/assets/yilan/甜甜圈.webp",
  "/assets/yilan/起司.webp",
  "/assets/yilan/魚肉.webp",
  "/assets/yilan/香腸.webp",
  "/assets/yilan/烤雞.webp",
];

export const SheetArtworkPreloads = () => {
  return (
    <>
      {sheetArtworkSources.map((artworkSource) => (
        <link as="image" href={artworkSource} key={artworkSource} rel="preload" />
      ))}
    </>
  );
};

type BackpackViewProps = {
  display: BackpackDisplay;
  onOpenChallenge?: (
    item: BackpackDisplayItem,
    triggerElement: HTMLElement,
  ) => void;
  onOpenItem?: (
    item: BackpackDisplayItem,
    triggerElement: HTMLElement,
  ) => void;
};

export const BackpackView = ({
  display,
  onOpenChallenge,
  onOpenItem,
}: BackpackViewProps) => {
  return (
    <section className="backpack-view">
      <header className="backpack-header">
        <h1>我的背包</h1>
      </header>

      <div className="backpack-content">
        <ul aria-label="旅途收藏" className="backpack-grid">
          {display.items.map((item) => {
            const itemStateClassName = item.isUnlocked
              ? "backpack-item-unlocked"
              : item.isChallengeAvailable
                ? "backpack-item-challenge"
                : "backpack-item-locked";
            const artworkName = item.isUnlocked
              ? item.artwork
              : item.isChallengeAvailable
                ? "問號.webp"
                : "鎖頭.webp";
            const artwork = (
              <Image
                alt=""
                className="backpack-item-artwork"
                height={93}
                loading="eager"
                src={`/assets/yilan/${artworkName}`}
                unoptimized
                width={93}
              />
            );

            return (
              <li
                aria-label={
                  item.isUnlocked
                    ? `已解鎖收藏 ${item.name}`
                    : item.isChallengeAvailable
                      ? "可回答問題解鎖"
                      : "尚未解鎖"
                }
                className={`backpack-item ${itemStateClassName}${item.isNew ? " backpack-item-new" : ""}`}
                key={item.id}
              >
                {item.isNew && <span className="backpack-new-badge">New</span>}
                {item.isChallengeAvailable ? (
                  <button
                    aria-label="回答解鎖問題"
                    className="backpack-item-button backpack-challenge-button"
                    onClick={(clickEvent) =>
                      onOpenChallenge?.(item, clickEvent.currentTarget)
                    }
                    type="button"
                  >
                    {artwork}
                  </button>
                ) : item.isUnlocked && item.copy ? (
                  <button
                    aria-label={`打開${item.name}`}
                    className="backpack-item-button"
                    onClick={(clickEvent) =>
                      onOpenItem?.(item, clickEvent.currentTarget)
                    }
                    type="button"
                  >
                    {artwork}
                  </button>
                ) : (
                  artwork
                )}
              </li>
            );
          })}
        </ul>

        <div className="backpack-dialogue-row">
          <div className="character-dialogue-bubble backpack-dialogue-bubble">
            <p>{display.dialogue}</p>
          </div>
          <Image
            alt=""
            className="backpack-guide"
            height={117}
            loading="eager"
            src="/assets/yilan/鴨子.webp"
            unoptimized
            width={91}
          />
        </div>
      </div>
    </section>
  );
};
