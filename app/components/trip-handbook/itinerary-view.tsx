import Image from "next/image";
import {
  formatItineraryDateLabel,
  itineraryDates,
  type ItineraryDate,
} from "../../lib/itinerary-date";
import type { TripEvent } from "../../lib/trip-types";
import { PixelFrame } from "./pixel-frame";

type ItineraryViewProps = {
  events: TripEvent[];
  onDateChange: (date: ItineraryDate) => void;
  onOpenEvent: (event: TripEvent, triggerElement: HTMLElement) => void;
  selectedDate: ItineraryDate;
};

export const ItineraryView = ({
  events,
  onDateChange,
  onOpenEvent,
  selectedDate,
}: ItineraryViewProps) => {
  const selectedDayEvents = events.filter((event) => event.date === selectedDate);

  return (
    <section className="itinerary-view">
      <header className="itinerary-header">
        <h1>行程</h1>
        <div aria-label="日期切換" className="date-switcher">
          {itineraryDates.map((date) => {
            const isSelected = selectedDate === date;

            return (
              <button
                aria-pressed={isSelected}
                className={isSelected ? "is-selected" : ""}
                key={date}
                onClick={() => onDateChange(date)}
                type="button"
              >
                {formatItineraryDateLabel(date)}
              </button>
            );
          })}
        </div>
      </header>

      <div className="itinerary-route">
        <div aria-hidden="true" className="itinerary-scenery">
          <Image alt="" className="itinerary-tree" height={133} src="/assets/yilan/樹木.svg" unoptimized width={109} />
          <span className="itinerary-person itinerary-person-one">
            <Image alt="" className="itinerary-person-base itinerary-person-frame" height={74} src="/assets/yilan/路人1.svg" unoptimized width={25} />
            <Image alt="" className="itinerary-person-action itinerary-person-frame" height={74} src="/assets/yilan/路人1動作.svg" unoptimized width={25} />
          </span>
          <span className="itinerary-person itinerary-person-two">
            <Image alt="" className="itinerary-person-base itinerary-person-frame" height={83} src="/assets/yilan/路人2.svg" unoptimized width={40} />
            <Image alt="" className="itinerary-person-action itinerary-person-frame" height={83} src="/assets/yilan/路人2動作.svg" unoptimized width={35} />
          </span>
          <span className="itinerary-person itinerary-person-three">
            <Image alt="" className="itinerary-person-base itinerary-person-frame" height={89} src="/assets/yilan/路人3.svg" unoptimized width={39} />
            <Image alt="" className="itinerary-person-action itinerary-person-frame" height={89} src="/assets/yilan/路人3動作.svg" unoptimized width={44} />
          </span>
          <Image alt="" className="itinerary-leaf" height={48} src="/assets/yilan/葉子.svg" unoptimized width={40} />
          <Image alt="" className="itinerary-tree itinerary-tree-right" height={133} src="/assets/yilan/樹木.svg" unoptimized width={109} />
        </div>
        <div className="itinerary-card-list itinerary-scroll-region">
          {selectedDayEvents.map((event) => (
            <article className="itinerary-event" key={event.id}>
              <PixelFrame className="itinerary-card">
                <div className="itinerary-card-content">
                  <strong>{event.title}</strong>
                  <span>時間｜{event.displayTime}</span>
                  {event.place && <span>地點｜{event.place}</span>}
                  {(event.address || (!event.place && event.location)) && (
                    <span>地址｜{event.address || event.location}</span>
                  )}
                  {event.transportSuggestion && (
                    <span>交通建議｜{event.transportSuggestion}</span>
                  )}
                  {event.mapUrl && (
                    <span>
                      Map｜
                      <a
                        className="itinerary-card-map-link"
                        href={event.mapUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {event.mapUrl}
                      </a>
                    </span>
                  )}
                  {event.merchantPhone && (
                    <span>商家電話｜{event.merchantPhone}</span>
                  )}
                  {event.action && (
                    <button
                      className="itinerary-card-action"
                      onClick={(clickEvent) =>
                        onOpenEvent(event, clickEvent.currentTarget)
                      }
                      type="button"
                    >
                      {event.action.label}
                    </button>
                  )}
                </div>
              </PixelFrame>
            </article>
          ))}

          {selectedDayEvents.length === 0 && (
            <PixelFrame className="itinerary-empty-card">
              <p>目前沒有 {formatItineraryDateLabel(selectedDate)} 的有效行程。</p>
            </PixelFrame>
          )}
        </div>
      </div>
    </section>
  );
};
