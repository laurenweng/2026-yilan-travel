"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import {
  getBackpackPreviewState,
  type BackpackDisplayItem,
  type BackpackDisplayState,
} from "../../lib/backpack-state";
import {
  readSeenRewardItemIds,
  writeSeenRewardItemIds,
} from "../../lib/backpack-progress";
import {
  closeBackpackItem,
  createBackpackSession,
  openBackpackItem,
  resolveSessionBackpackDisplay,
} from "../../lib/backpack-session";
import {
  getLiveScheduleTestTime,
  getPreviewTime,
} from "../../lib/preview-time";
import {
  getInitialItineraryDate,
  type ItineraryDate,
} from "../../lib/itinerary-date";
import { waitForInitialLoading } from "../../lib/initial-loading";
import { loadTripEventsWithFallback } from "../../lib/trip-csv";
import { resolveTripSnapshot } from "../../lib/trip-time";
import {
  getTravelerGenderFromSearch,
  type TravelerGender,
} from "../../lib/traveler-gender";
import type { TripDataWarning, TripEvent } from "../../lib/trip-types";
import { BackpackItemSheet } from "./backpack-item-sheet";
import {
  BackpackArtworkPreloads,
  BackpackView,
  SheetArtworkPreloads,
} from "./backpack-view";
import { BottomNavigation, type NavigationTab } from "./bottom-navigation";
import { CarAssignmentSheet } from "./car-assignment-sheet";
import { EventInfoSheet } from "./event-info-sheet";
import { HomeView } from "./home-view";
import { ItineraryView } from "./itinerary-view";

type LoadState = "loading" | "ready" | "error";

const primaryTripDataSourceUrl =
  process.env.NEXT_PUBLIC_TRIP_CSV_URL || "/api/trip-data";
const fallbackTripDataSourceUrl = "/data/trip-demo.csv";

const readPreviewMode = () => {
  if (typeof window === "undefined") return null;
  if (process.env.NODE_ENV !== "development") return null;

  return new URLSearchParams(window.location.search).get("preview");
};

const readLiveScheduleTestMode = () => {
  if (typeof window === "undefined") return null;

  return new URLSearchParams(window.location.search).get("test");
};

const readTravelerGender = (): TravelerGender => {
  if (typeof window === "undefined") return "male";

  return getTravelerGenderFromSearch(window.location.search);
};

const isBackpackVisualPreviewMode = (previewMode: string | null) =>
  previewMode?.startsWith("backpack-") ?? false;

const readDevelopmentBackpackPreviewState = () => {
  if (typeof window === "undefined") return "locked" as const;

  const previewMode = new URLSearchParams(window.location.search).get("preview");
  return getBackpackPreviewState(
    previewMode,
    process.env.NODE_ENV === "development",
  );
};

const subscribeToBackpackPreview = () => () => {};

const readServerBackpackPreviewState = (): BackpackDisplayState => "locked";

export const TripHandbook = () => {
  const [activeTab, setActiveTab] = useState<NavigationTab>("home");
  const [events, setEvents] = useState<TripEvent[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [warnings, setWarnings] = useState<TripDataWarning[]>([]);
  const [previewMode] = useState(readPreviewMode);
  const [liveScheduleTestMode] = useState(readLiveScheduleTestMode);
  const [travelerGender] = useState(readTravelerGender);
  const [initialTripTime] = useState(() => new Date());
  const backpackState = useSyncExternalStore(
    subscribeToBackpackPreview,
    readDevelopmentBackpackPreviewState,
    readServerBackpackPreviewState,
  );
  const [backpackSession, setBackpackSession] = useState(() =>
    createBackpackSession(readSeenRewardItemIds()),
  );
  const [currentTime, setCurrentTime] = useState(initialTripTime);
  const [selectedItineraryDate, setSelectedItineraryDate] =
    useState<ItineraryDate>(() =>
      getInitialItineraryDate(
        getLiveScheduleTestTime(liveScheduleTestMode, initialTripTime) ??
          initialTripTime,
      ),
    );
  const [selectedEvent, setSelectedEvent] = useState<TripEvent | null>(null);
  const [sheetTrigger, setSheetTrigger] = useState<HTMLElement | null>(null);

  const refreshTripData = useCallback(async () => {
    setLoadState("loading");

    try {
      const result = await loadTripEventsWithFallback(
        primaryTripDataSourceUrl,
        fallbackTripDataSourceUrl,
      );
      setEvents(result.events);
      setWarnings(result.warnings);
      await waitForInitialLoading();
      setLoadState("ready");
    } catch {
      setLoadState("error");
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const loadInitialTripData = async () => {
      try {
        const result = await loadTripEventsWithFallback(
          primaryTripDataSourceUrl,
          fallbackTripDataSourceUrl,
        );
        if (isCancelled) return;

        setEvents(result.events);
        setWarnings(result.warnings);
        await waitForInitialLoading();
        if (isCancelled) return;
        setLoadState("ready");
      } catch {
        if (!isCancelled) setLoadState("error");
      }
    };

    void loadInitialTripData();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (previewMode) return;

    const timerId = window.setInterval(() => setCurrentTime(new Date()), 60_000);
    return () => window.clearInterval(timerId);
  }, [previewMode]);

  const previewTripTime = useMemo(() => {
    if (!previewMode || events.length === 0) return null;

    return getPreviewTime(
      previewMode,
      process.env.NODE_ENV === "development",
      events,
    );
  }, [previewMode, events]);
  const liveScheduleTestTime = useMemo(
    () => getLiveScheduleTestTime(liveScheduleTestMode, currentTime),
    [currentTime, liveScheduleTestMode],
  );
  const effectiveTime = previewTripTime ?? liveScheduleTestTime ?? currentTime;

  const snapshot = useMemo(
    () => (events.length > 0 ? resolveTripSnapshot(events, effectiveTime) : null),
    [effectiveTime, events],
  );

  const isBackpackVisualPreview = isBackpackVisualPreviewMode(previewMode);
  const isTripTimePreview = previewTripTime !== null;
  const backpackDisplay = useMemo(
    () =>
      resolveSessionBackpackDisplay({
        backpackState,
        effectiveTime,
        events,
        isBackpackVisualPreview,
        isTripTimePreview,
        session: backpackSession,
      }),
    [
      backpackState,
      effectiveTime,
      events,
      isBackpackVisualPreview,
      isTripTimePreview,
      backpackSession,
    ],
  );
  const handleOpenEvent = useCallback(
    (event: TripEvent, triggerElement: HTMLElement) => {
      if (!event.action) return;
      setSheetTrigger(triggerElement);
      setSelectedEvent(event);
    },
    [],
  );

  const handleOpenBackpackItem = useCallback(
    (item: BackpackDisplayItem, triggerElement: HTMLElement) => {
      setSheetTrigger(triggerElement);

      // 先算出新 session 再決定是否寫入；setState 的 updater 必須保持純函式。
      const { session, shouldPersist } = openBackpackItem(
        backpackSession,
        item,
        { isTripTimePreview },
      );

      setBackpackSession(session);
      if (shouldPersist) writeSeenRewardItemIds(session.seenItemIds);
    },
    [backpackSession, isTripTimePreview],
  );

  const handleCloseBackpackItemSheet = useCallback(
    () => setBackpackSession(closeBackpackItem),
    [],
  );

  const handleCloseSheet = useCallback(() => setSelectedEvent(null), []);

  if (loadState === "loading") {
    return (
      <main className="initial-loading-screen">
        <section aria-label="網站載入中" className="initial-loading-content">
          <Image
            alt=""
            className="initial-loading-artwork"
            height={60}
            priority
            src="/assets/yilan/背包_active.webp"
            unoptimized
            width={60}
          />
          <p aria-live="polite" className="initial-loading-label">
            Loading
            <span aria-hidden="true" className="initial-loading-dots">
              ...
            </span>
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="trip-app-shell">
      <BackpackArtworkPreloads
        display={backpackDisplay}
        travelerGender={travelerGender}
      />
      <SheetArtworkPreloads />
      <div className="trip-app-content">
        {activeTab === "home" && (
          <HomeView
            currentTime={effectiveTime}
            events={events}
            loadState={loadState}
            onOpenVehicle={handleOpenEvent}
            onRefresh={refreshTripData}
            snapshot={snapshot}
            travelerGender={travelerGender}
            warningCount={warnings.length}
          />
        )}
        {activeTab === "itinerary" && (
          <ItineraryView
            currentEvents={snapshot?.currentEvents ?? []}
            events={events}
            onDateChange={setSelectedItineraryDate}
            onOpenEvent={handleOpenEvent}
            selectedDate={selectedItineraryDate}
          />
        )}
        {activeTab === "backpack" && (
          <BackpackView
            display={backpackDisplay}
            onOpenItem={handleOpenBackpackItem}
          />
        )}
      </div>

      <BottomNavigation
        activeTab={activeTab}
        hasNewBackpackItem={backpackDisplay.hasNotification}
        onChange={setActiveTab}
      />

      {selectedEvent?.action && (
        selectedEvent.action.type === "vehicle" ? (
          <CarAssignmentSheet
            event={selectedEvent}
            onClose={handleCloseSheet}
            returnFocusTo={sheetTrigger}
          />
        ) : (
          <EventInfoSheet
            actionType={selectedEvent.action.type}
            event={selectedEvent}
            onClose={handleCloseSheet}
            returnFocusTo={sheetTrigger}
          />
        )
      )}

      {backpackSession.selectedItem && (
        <BackpackItemSheet
          item={backpackSession.selectedItem}
          onClose={handleCloseBackpackItemSheet}
          returnFocusTo={sheetTrigger}
          travelerGender={travelerGender}
        />
      )}
    </main>
  );
};
