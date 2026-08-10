"use client";

import Image from "next/image";
import {
  defaultMenuItems,
  defaultRoomAssignments,
  getMenuArtworkWidth,
  menuArtwork,
} from "../../lib/trip-supplement-data";
import type { TripActionType, TripEvent } from "../../lib/trip-types";
import { BottomSheet } from "./bottom-sheet";

type EventInfoSheetProps = {
  actionType: Exclude<TripActionType, "vehicle">;
  event: TripEvent;
  onClose: () => void;
  returnFocusTo: HTMLElement | null;
};

const sheetTitleByAction: Record<Exclude<TripActionType, "vehicle">, string> = {
  transport: "交通資訊",
  room: "住宿分配",
  menu: "菜單",
};

const emptyMessageByAction: Record<Exclude<TripActionType, "vehicle">, string> = {
  transport: "交通資訊待補",
  room: "",
  menu: "",
};

export const EventInfoSheet = ({
  actionType,
  event,
  onClose,
  returnFocusTo,
}: EventInfoSheetProps) => {
  const title = sheetTitleByAction[actionType];
  const menuItems = event.menuItems.length > 0 ? event.menuItems : defaultMenuItems;

  return (
    <BottomSheet onClose={onClose} returnFocusTo={returnFocusTo} title={title}>
      <p className="bottom-sheet-event">{event.title}</p>
      {actionType === "room" ? (
        <div className="room-assignment-list">
          {defaultRoomAssignments.map((assignment, index) => (
            <article className="room-assignment-row" key={`${assignment.name}-${index}`}>
              <Image
                alt=""
                className="room-assignment-icon"
                height={61}
                src={`/assets/yilan/${assignment.artwork}`}
                unoptimized
                width={69}
              />
              <div>
                <h3>{assignment.name}</h3>
                {assignment.details.map((detail) => <p key={detail}>{detail}</p>)}
              </div>
            </article>
          ))}
        </div>
      ) : actionType === "menu" ? (
        <>
          <div aria-hidden="true" className="menu-artwork-list">
            {menuArtwork.map((artwork) => (
              <Image
                alt=""
                className="menu-artwork-icon"
                height={45}
                key={artwork}
                src={`/assets/yilan/${artwork}`}
                unoptimized
                width={getMenuArtworkWidth(artwork)}
              />
            ))}
          </div>
          <ul className="event-info-list">
            {menuItems.map((detail) => <li key={detail}>{detail}</li>)}
          </ul>
        </>
      ) : (
        <p className="bottom-sheet-placeholder">{emptyMessageByAction[actionType]}</p>
      )}
    </BottomSheet>
  );
};
