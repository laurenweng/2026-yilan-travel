const googleSheetsTripDataSourceUrl =
  "https://docs.google.com/spreadsheets/d/18fq8BdaFe7Nq6tWfB76szs_LfTPkz3z4kj7NrlYdKnU/gviz/tq?tqx=out:csv&gid=0";

/** 由伺服器取得 Google Sheet，避免瀏覽器跨網域讀取限制。 */
export const createTripCsvProxyResponse = async (
  fetcher: typeof fetch = fetch,
) => {
  try {
    const response = await fetcher(googleSheetsTripDataSourceUrl, {
      cache: "no-store",
      headers: { accept: "text/csv" },
    });
    if (!response.ok) throw new Error(`Google Sheet 回傳 ${response.status}`);

    return new Response(await response.text(), {
      headers: {
        "cache-control": "no-store",
        "content-type": "text/csv; charset=utf-8",
      },
    });
  } catch {
    return new Response("目前無法取得雲端行程資料", { status: 502 });
  }
};
