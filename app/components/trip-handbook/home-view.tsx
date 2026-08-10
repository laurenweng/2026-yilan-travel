import Image from "next/image";
import { getHomeEventArtwork } from "../../lib/home-event-artwork";
import { groupHomeEventsByTimeAndTitle } from "../../lib/home-event-groups";
import type { TripEvent, TripPhase, TripSnapshot } from "../../lib/trip-types";
import { resolveHomeDialogue } from "../../lib/home-dialogue";
import { CharacterDialogue } from "./character-dialogue";
import { EnergyBar } from "./energy-bar";
import { PixelFrame } from "./pixel-frame";
import { PretripChecklist } from "./pretrip-checklist";

type LoadState = "loading" | "ready" | "error";

type HomeViewProps = {
  events: TripEvent[];
  loadState: LoadState;
  onRefresh: () => void;
  snapshot: TripSnapshot | null;
  warningCount: number;
};

const HomeEventCard = ({
  events,
  label,
  phase,
}: {
  events: TripEvent[];
  label: string;
  phase: Extract<TripPhase, "active" | "en_route">;
}) => {
  const timeGroups = groupHomeEventsByTimeAndTitle(events);

  return (
    <div className={`home-event-card phase-${phase}`}>
      <span className="home-event-card-content">
        <span className="event-status-label">{label}</span>
        <span className="home-event-rows">
          {timeGroups.map((timeGroup) => (
            <span className="home-event-row" key={timeGroup.timeLabel}>
              <span className="home-event-time">{timeGroup.timeLabel}</span>
              {timeGroup.titleGroups.map((titleGroup) => {
                const artwork =
                  phase === "active"
                    ? getHomeEventArtwork(titleGroup.title)
                    : undefined;

                return (
                  <span
                    className="home-event-title-group"
                    key={titleGroup.title}
                  >
                    {artwork && (
                      <Image
                        alt=""
                        className="home-event-artwork"
                        height={64}
                        src={artwork}
                        unoptimized
                        width={76}
                      />
                    )}
                    <strong className="home-event-title">
                      {titleGroup.title}
                    </strong>
                    {titleGroup.events.map(
                      (event) =>
                        event.place && (
                          <span className="home-event-place" key={event.id}>
                            {event.place}
                          </span>
                        ),
                    )}
                  </span>
                );
              })}
            </span>
          ))}
        </span>
      </span>
    </div>
  );
};

export const HomeView = ({
  events,
  loadState,
  onRefresh,
  snapshot,
  warningCount,
}: HomeViewProps) => {
  const displayEvents =
    snapshot?.phase === "active"
      ? snapshot.currentEvents
      : snapshot?.phase === "en_route"
        ? snapshot.nextEvents
        : undefined;
  const energyEvents =
    snapshot?.phase === "active"
      ? snapshot.currentEvents
      : snapshot?.phase === "en_route"
        ? snapshot.justEndedEvents
        : undefined;
  const dialogue = snapshot
    ? resolveHomeDialogue(events, snapshot)
    : undefined;

  return (
    <section className="home-view">
      <header className="trip-hero">
        <div aria-hidden="true" className="trip-hero-sky">
          <Image alt="" className="trip-hero-cloud-left" height={23} src="/assets/yilan/雲1.svg" unoptimized width={48} />
          <Image alt="" className="trip-hero-cloud-right" height={28} src="/assets/yilan/雲2.svg" unoptimized width={49} />
        </div>
        <div aria-hidden="true" className="trip-hero-scene">
          <Image alt="" className="trip-hero-tree" height={133} src="/assets/yilan/樹木.svg" unoptimized width={109} />
          <Image alt="" className="trip-hero-pines" height={105} src="/assets/yilan/松樹們.svg" unoptimized width={113} />
          <Image alt="" className="trip-hero-bus" height={83} src="/assets/yilan/鴨子車.svg" unoptimized width={129} />
        </div>
        <div className="trip-hero-copy">
          <h1>2026 宜蘭員旅</h1>
          <p>08.29 - 08.30</p>
        </div>
      </header>

      <div className={`home-content phase-${snapshot?.phase ?? loadState}`}>
        {loadState === "loading" && (
          <PixelFrame className="home-loading-card">
            <p aria-live="polite">讀取行程中…</p>
          </PixelFrame>
        )}

        {loadState === "error" && (
          <PixelFrame className="home-error-card">
            <p>目前無法取得行程</p>
            <button onClick={onRefresh} type="button">
              重新載入
            </button>
          </PixelFrame>
        )}

        {loadState === "ready" && snapshot?.phase === "pre_trip" && (
          <>
            {dialogue && (
              <CharacterDialogue
                character={dialogue.character}
                className="pretrip-dialogue"
              >
                {dialogue.copy}
              </CharacterDialogue>
            )}
            <PretripChecklist />
          </>
        )}

        {loadState === "ready" && displayEvents && displayEvents.length > 0 && snapshot && (
          <>
            <div className="home-progress">
              <Image alt="" className="home-progress-traveler" height={54} src="/assets/yilan/head.svg" unoptimized width={48} />
              <div className="home-progress-status">
                {energyEvents?.[0]?.energy !== undefined && (
                  <EnergyBar percent={energyEvents[0].energy} />
                )}
                {energyEvents?.[0]?.energyCopy && (
                  <span>{energyEvents[0].energyCopy}</span>
                )}
              </div>
            </div>

            <HomeEventCard
              events={displayEvents}
              label={snapshot.phase === "active" ? "現在進行中" : "前往下一站"}
              phase={snapshot.phase === "active" ? "active" : "en_route"}
            />

            {dialogue && (
              <CharacterDialogue
                character={dialogue.character}
                className="duck-dialogue"
              >
                {dialogue.copy}
              </CharacterDialogue>
            )}
          </>
        )}

        {loadState === "ready" && snapshot?.phase === "resting" && (
          <>
            <div className="home-status-card phase-resting pixel-frame">
              <div className="home-status-card-content">
                <span className="event-status-label">休息中</span>
                <strong>今晚好好休息</strong>
                {snapshot.nextEvent && (
                  <span>
                    明日 {snapshot.nextEvent.startTime}　{snapshot.nextEvent.title}
                  </span>
                )}
              </div>
            </div>
            {dialogue && (
              <CharacterDialogue
                character={dialogue.character}
                className="duck-dialogue resting-dialogue"
              >
                {dialogue.copy}
              </CharacterDialogue>
            )}
          </>
        )}

        {loadState === "ready" && snapshot?.phase === "trip_complete" && (
          <>
            <div className="home-status-card phase-trip_complete">
              <div className="home-status-card-content">
                <span className="event-status-label">旅程完成</span>
                <strong>回到甜蜜的家</strong>
                <span>別忘記星期一要工作唷！</span>
              </div>
            </div>
            {dialogue && (
              <CharacterDialogue
                character={dialogue.character}
                className="complete-dialogue"
              >
                {dialogue.copy}
              </CharacterDialogue>
            )}
          </>
        )}

        {loadState === "ready" && !snapshot && (
          <PixelFrame className="home-error-card">
            <p>目前沒有有效行程</p>
            <button onClick={onRefresh} type="button">
              重新載入
            </button>
          </PixelFrame>
        )}

        {warningCount > 0 && (
          <p className="data-warning" role="status">
            有 {warningCount} 筆資料格式未使用。
          </p>
        )}
      </div>
    </section>
  );
};
