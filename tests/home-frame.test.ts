import assert from "node:assert/strict";
import test from "node:test";
import { getHomeFrameAsset } from "../app/lib/home-frame.ts";

test("進行中的行程使用 338×188 淺色提醒框", () => {
  assert.equal(getHomeFrameAsset("active"), "/assets/yilan/淺色提醒框.svg");
});

test("旅程完成使用 338×127 深色提醒框", () => {
  assert.equal(getHomeFrameAsset("trip_complete"), "/assets/yilan/深色提醒框.svg");
});
