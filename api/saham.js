export default async function handler(req, res) {
  // Atur header CORS supaya browser boleh baca
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  try {
    const symbol = req.query.symbol + ".JK";
    const response = await fetch(
      `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=price,defaultKeyStatistics,financialData`,
      { headers: { "User-Agent": "Mozilla/5.0" } }
    );
    const json = await response.json();

    if (!json.quoteSummary || !json.quoteSummary.result) {
      res.json({ error: "Saham tidak ditemukan." });
      return;
    }
    const result = json.quoteSummary.result[0];
    const price = result.price?.regularMarketPrice?.raw;
    const eps = result.defaultKeyStatistics?.trailingEps?.raw;
    let growth = result.financialData?.earningsGrowth?.raw * 100 || 10;

    if (!price || !eps) {
      res.json({ error: "Data EPS tidak tersedia." });
      return;
    }

    const per = price / eps;
    const fairPrice = eps * growth;
    let status = "WAJAR";
    if (price > fairPrice * 1.2) status = "SANGAT MAHAL";
    else if (price > fairPrice) status = "MAHAL";
    else if (price < fairPrice * 0.8) status = "MURAH";

    res.json({
      price: price.toFixed(2),
      eps: eps.toFixed(2),
      per: per.toFixed(2),
      growth: growth.toFixed(2),
      fairPrice: fairPrice.toFixed(2),
      status,
    });

  } catch (error) {
    res.json({ error: "Server API error." });
  }
}
