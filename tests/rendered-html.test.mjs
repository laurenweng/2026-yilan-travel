import assert from "node:assert/strict";
import test from "node:test";

const render = async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
};

test("伺服器渲染宜蘭員旅首頁殼與三個入口", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html lang="zh-Hant"/);
  assert.match(html, /<title>2026 宜蘭員旅<\/title>/);
  assert.match(html, /2026 宜蘭員旅/);
  assert.match(html, /首頁/);
  assert.match(html, /行程/);
  assert.match(html, /我的背包/);
  assert.match(html, /讀取行程中/);
});

test("初始頁面不再呈現 Sites 範本骨架", async () => {
  const response = await render();
  const html = await response.text();

  assert.doesNotMatch(html, /Your site is taking shape/);
  assert.doesNotMatch(html, /Building your site/);
  assert.doesNotMatch(html, /react-loading-skeleton/);
});
