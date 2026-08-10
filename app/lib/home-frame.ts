import type { TripPhase } from "./trip-types";

const lightFrameAsset = "/assets/yilan/淺色提醒框.svg";
const darkFrameAsset = "/assets/yilan/深色提醒框.svg";

type HomeFramePhase = Extract<TripPhase, "active" | "trip_complete">;

export const getHomeFrameAsset = (phase: HomeFramePhase) =>
  phase === "trip_complete" ? darkFrameAsset : lightFrameAsset;
