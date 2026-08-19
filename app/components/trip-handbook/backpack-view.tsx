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
  const artworkSources = display.items.map(
    (item) =>
      `/assets/yilan/${item.isUnlocked ? item.artwork : "鎖頭.webp"}`,
  );
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

type BackpackViewProps = {
  display: BackpackDisplay;
  onOpenItem?: (
    item: BackpackDisplayItem,
    triggerElement: HTMLElement,
  ) => void;
};

export const BackpackView = ({ display, onOpenItem }: BackpackViewProps) => {
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
              : "backpack-item-locked";
            const artwork = (
              <Image
                alt=""
                className="backpack-item-artwork"
                height={93}
                loading="eager"
                src={`/assets/yilan/${item.isUnlocked ? item.artwork : "鎖頭.webp"}`}
                unoptimized
                width={93}
              />
            );

            return (
              <li
                aria-label={item.isUnlocked ? `已解鎖收藏 ${item.name}` : "尚未解鎖"}
                className={`backpack-item ${itemStateClassName}${item.isNew ? " backpack-item-new" : ""}`}
                key={item.id}
              >
                {item.isNew && <span className="backpack-new-badge">New</span>}
                {item.copy ? (
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
