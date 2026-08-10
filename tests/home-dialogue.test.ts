import assert from "node:assert/strict";
import test from "node:test";
import {
  defaultHomeDialogueCopy,
  resolveHomeDialogue,
} from "../app/lib/home-dialogue.ts";
import type { TripEvent, TripSnapshot } from "../app/lib/trip-types.ts";

const makeDialogueEvent = (
  id: string,
  title: string,
  dialogue: Partial<
    Pick<
      TripEvent,
      | "activeDialogueCopy"
      | "dialogueCharacter"
      | "enRouteDialogueCopy"
      | "preTripDialogueCopy"
      | "restingDialogueCopy"
      | "tripCompleteDialogueCopy"
    >
  > = {},
): TripEvent => ({
  date: "2026-08-29",
  displayTime: "10:00 - 11:00",
  endTime: "11:00",
  id,
  location: title,
  menuItems: [],
  roomAssignments: [],
  startTime: "10:00",
  title,
  vehicles: [],
  ...dialogue,
});

const makeDialogueSnapshot = (
  values: Partial<TripSnapshot> & Pick<TripSnapshot, "phase">,
): TripSnapshot => ({
  currentEvent: null,
  currentEvents: [],
  justEndedEvent: null,
  justEndedEvents: [],
  nextEvent: null,
  nextEvents: [],
  ...values,
});

test("行前取第一筆行程的行前角色與台詞", () => {
  const firstEvent = makeDialogueEvent("first", "第一站", {
    dialogueCharacter: "travelerWaving",
    preTripDialogueCopy: "行前台詞",
  });

  assert.deepEqual(
    resolveHomeDialogue(
      [firstEvent],
      makeDialogueSnapshot({ phase: "pre_trip" }),
    ),
    { character: "travelerWaving", copy: "行前台詞" },
  );
});

test("進行中取目前時段第一筆有進行中台詞的行程", () => {
  const currentEvent = makeDialogueEvent("current", "目前行程", {
    activeDialogueCopy: "進行中台詞",
    dialogueCharacter: "duck",
  });

  assert.deepEqual(
    resolveHomeDialogue(
      [currentEvent],
      makeDialogueSnapshot({
        currentEvents: [currentEvent],
        phase: "active",
      }),
    ),
    { character: "duck", copy: "進行中台詞" },
  );
});

test("前往下一站的台詞與角色取下一時段，不沿用剛結束行程", () => {
  const justEndedEvent = makeDialogueEvent("lunch", "享用中餐", {
    activeDialogueCopy: "午餐進行中",
    dialogueCharacter: "travelerWaving",
  });
  const nextEvent = makeDialogueEvent("laser", "雷射對決賽", {
    dialogueCharacter: "travelerWarning",
    enRouteDialogueCopy: "青蛙怪發出戰鬥邀請",
  });

  assert.deepEqual(
    resolveHomeDialogue(
      [justEndedEvent, nextEvent],
      makeDialogueSnapshot({
        justEndedEvents: [justEndedEvent],
        nextEvents: [nextEvent],
        phase: "en_route",
      }),
    ),
    { character: "travelerWarning", copy: "青蛙怪發出戰鬥邀請" },
  );
});

test("休息中取剛結束行程的休息台詞", () => {
  const justEndedEvent = makeDialogueEvent("night-market", "羅東夜市", {
    dialogueCharacter: "duck",
    restingDialogueCopy: "今晚先好好休息",
  });

  assert.deepEqual(
    resolveHomeDialogue(
      [justEndedEvent],
      makeDialogueSnapshot({
        justEndedEvents: [justEndedEvent],
        phase: "resting",
      }),
    ),
    { character: "duck", copy: "今晚先好好休息" },
  );
});

test("旅程完成取最後一筆行程的完成角色與台詞", () => {
  const lastEvent = makeDialogueEvent("last", "回家", {
    dialogueCharacter: "travelerWithMap",
    tripCompleteDialogueCopy: "旅程完成台詞",
  });

  assert.deepEqual(
    resolveHomeDialogue(
      [lastEvent],
      makeDialogueSnapshot({ phase: "trip_complete" }),
    ),
    { character: "travelerWithMap", copy: "旅程完成台詞" },
  );
});

test("同時段第一筆沒有台詞時，角色與台詞一起取第二筆", () => {
  const firstEvent = makeDialogueEvent("first", "第一個行程", {
    dialogueCharacter: "travelerWarning",
  });
  const secondEvent = makeDialogueEvent("second", "第二個行程", {
    activeDialogueCopy: "第二筆台詞",
    dialogueCharacter: "travelerWaving",
  });

  assert.deepEqual(
    resolveHomeDialogue(
      [firstEvent, secondEvent],
      makeDialogueSnapshot({
        currentEvents: [firstEvent, secondEvent],
        phase: "active",
      }),
    ),
    { character: "travelerWaving", copy: "第二筆台詞" },
  );
});

test("各狀態沒有專屬台詞時回退到該狀態的預設角色與台詞", () => {
  const event = makeDialogueEvent("event", "沒有台詞的行程");
  const cases: Array<{
    expectedCharacter: "duck" | "travelerWaving" | "travelerWithMap";
    phase: TripSnapshot["phase"];
    snapshot: TripSnapshot;
  }> = [
    {
      expectedCharacter: "travelerWaving",
      phase: "pre_trip",
      snapshot: makeDialogueSnapshot({ phase: "pre_trip" }),
    },
    {
      expectedCharacter: "duck",
      phase: "active",
      snapshot: makeDialogueSnapshot({
        currentEvents: [event],
        phase: "active",
      }),
    },
    {
      expectedCharacter: "duck",
      phase: "en_route",
      snapshot: makeDialogueSnapshot({
        nextEvents: [event],
        phase: "en_route",
      }),
    },
    {
      expectedCharacter: "duck",
      phase: "resting",
      snapshot: makeDialogueSnapshot({
        justEndedEvents: [event],
        phase: "resting",
      }),
    },
    {
      expectedCharacter: "travelerWithMap",
      phase: "trip_complete",
      snapshot: makeDialogueSnapshot({ phase: "trip_complete" }),
    },
  ];

  cases.forEach(({ expectedCharacter, phase, snapshot }) => {
    assert.deepEqual(resolveHomeDialogue([event], snapshot), {
      character: expectedCharacter,
      copy: defaultHomeDialogueCopy[phase],
    });
  });
});
