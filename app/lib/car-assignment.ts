import type { TripEvent, VehicleAssignment, VehicleCode } from "./trip-types";

export type CarAssignmentRow = {
  driverLabel: string;
  passengersLabel: string;
  vehicle: VehicleCode;
};

const defaultVehicleAssignments: VehicleAssignment[] = [
  { vehicle: "A", driver: "小王", passengers: ["阿明", "小陳", "小林"] },
  { vehicle: "B", driver: "小王", passengers: ["阿明", "小陳", "小林"] },
  { vehicle: "C", driver: "小王", passengers: ["阿明", "小陳", "小林"] },
];

/** 將一段行程的可用分車資料整理成 Bottom Sheet 可直接顯示的列。 */
export const createCarAssignmentRows = (event: TripEvent): CarAssignmentRow[] =>
  (event.vehicles.length > 0 ? event.vehicles : defaultVehicleAssignments)
    .filter((assignment) => assignment.driver || assignment.passengers.length > 0)
    .map((assignment) => ({
      driverLabel: `駕駛：${assignment.driver || "尚未設定"}`,
      passengersLabel: `乘客：${
        assignment.passengers.length > 0
          ? assignment.passengers.join("、")
          : "尚未設定"
      }`,
      vehicle: assignment.vehicle,
    }));
