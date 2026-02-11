export default async function handler(req, res) {
  // CORS supaya bisa dipanggil dari browser
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const symbol = req.query.symbol.toUpperCase() + ".JK";

    const response = await fetch(
      `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=price,defaultKeyStatistics,financialData`,
      { headers: { "User-Agent": "Mozilla/5.0" } }
    );

    const json = await response.json();

    if (!json?.quoteSummary?.result) {
      return res.json({ error: "Saham tidak ditemukan." });
    }

    const result = json.quoteSummary.result[0];
    const price = result.price?.regularMarketPrice?.raw;
    const eps = result.defaultKeyStatistics?.trailingEps?.raw;

    if (!price || !eps) {
      return res.json({ error: "Data EPS tidak tersedia." });
    }

    let growth = 10;
    if (result.financialData?.earningsGrowth?.raw) {
      growth = result.financialData.earningsGrowth.raw * 100;
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
      status
    });

  } catch (err) {
    res.json({ error: "Error mengambil data." });
  }
}
