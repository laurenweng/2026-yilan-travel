"use client";

import Image from "next/image";
import { createCarAssignmentRows } from "../../lib/car-assignment";
import type { TripEvent } from "../../lib/trip-types";
import { BottomSheet } from "./bottom-sheet";

type CarAssignmentSheetProps = {
  event: TripEvent;
  onClose: () => void;
  returnFocusTo: HTMLElement | null;
};

const vehicleArtwork: Record<"A" | "B" | "C", string> = {
  A: "Ａ車.webp",
  B: "Ｂ車.webp",
  C: "計程車.webp",
};

export const CarAssignmentSheet = ({
  event,
  onClose,
  returnFocusTo,
}: CarAssignmentSheetProps) => {
  const assignmentRows = createCarAssignmentRows(event);

  return (
    <BottomSheet onClose={onClose} returnFocusTo={returnFocusTo} title="車輛分配">
      <p className="bottom-sheet-event">{event.title}</p>
      <div className="car-assignment-list">
        {assignmentRows.map((assignment) => (
          <article className="car-assignment-row" key={assignment.vehicle}>
            <Image
              alt=""
              className="car-assignment-icon"
              height={43}
              src={`/assets/yilan/${vehicleArtwork[assignment.vehicle]}`}
              unoptimized
              width={89}
            />
            <div>
              <h3>{assignment.vehicle} 車</h3>
              <p>{assignment.driverLabel}</p>
              <p>{assignment.passengersLabel}</p>
            </div>
          </article>
        ))}
      </div>
    </BottomSheet>
  );
};
