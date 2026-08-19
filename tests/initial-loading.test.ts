import assert from "node:assert/strict";
import test from "node:test";

const loadInitialLoadingModule = async () =>
  import("../app/lib/initial-loading").catch(() => null);

test("行程資料完成後，Loading 畫面保留一秒才進入網站", async () => {
  const initialLoadingModule = await loadInitialLoadingModule();
  assert.ok(initialLoadingModule);

  const originalSetTimeout = globalThis.setTimeout;
  const scheduledDelays: number[] = [];
  globalThis.setTimeout = ((callback: TimerHandler, delay?: number) => {
    scheduledDelays.push(Number(delay));
    if (typeof callback === "function") callback();

    return {} as ReturnType<typeof setTimeout>;
  }) as typeof setTimeout;

  try {
    await initialLoadingModule.waitForInitialLoading();
    assert.deepEqual(scheduledDelays, [1000]);
  } finally {
    globalThis.setTimeout = originalSetTimeout;
  }
});
