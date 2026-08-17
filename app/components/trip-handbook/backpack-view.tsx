import Image from "next/image";
import type {
  BackpackDisplay,
  BackpackDisplayItem,
} from "../../lib/backpack-state";

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
            src="/assets/yilan/鴨子.webp"
            unoptimized
            width={91}
          />
        </div>
      </div>
    </section>
  );
};
