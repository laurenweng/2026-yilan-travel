import assert from "node:assert/strict";
import test from "node:test";
import { createTripCsvProxyResponse } from "../app/lib/trip-data-source.ts";

test("雲端行程 CSV 轉接後維持 CSV 內容且不快取", async () => {
  const csvText = "ID,日期\nevent-1,2026-08-29";
  const fetcher = async () =>
    new Response(csvText, {
      headers: { "content-type": "text/csv; charset=utf-8" },
      status: 200,
    });

  const response = await createTripCsvProxyResponse(fetcher as typeof fetch);

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/csv\b/i);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(await response.text(), csvText);
});

test("雲端行程 CSV 無法讀取時轉接回傳 502", async () => {
  const fetcher = async () => new Response("無法讀取", { status: 503 });

  const response = await createTripCsvProxyResponse(fetcher as typeof fetch);

  assert.equal(response.status, 502);
});
