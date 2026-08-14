import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
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

const readBuiltStylesheets = async () => {
  const assetsDirectory = new URL("../dist/client/assets/", import.meta.url);
  const assetNames = await readdir(assetsDirectory);
  const stylesheetNames = assetNames.filter((assetName) =>
    assetName.endsWith(".css"),
  );
  const stylesheets = await Promise.all(
    stylesheetNames.map((stylesheetName) =>
      readFile(new URL(stylesheetName, assetsDirectory), "utf8"),
    ),
  );

  return stylesheets.join("\n");
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

test("初始文件宣告網站只支援淺色模式", async () => {
  const response = await render();
  const html = await response.text();

  assert.match(
    html,
    /<meta name="color-scheme" content="only light"\s*\/?>/,
  );
});

test("初始文件將瀏覽器介面設為品牌綠色", async () => {
  const response = await render();
  const html = await response.text();

  assert.match(html, /<meta name="theme-color" content="#80bb82"\s*\/?>/);
});

test("部署樣式拒絕瀏覽器自動套用深色模式", async () => {
  const stylesheets = await readBuiltStylesheets();

  assert.match(
    stylesheets,
    /:root\{[^}]*color-scheme:(?:only light|light only)[;}]/,
  );
});
