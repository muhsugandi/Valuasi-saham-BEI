export default async function handler(req, res) {

  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    const input = req.query.symbol;
    if (!input) {
      return res.status(200).json({ error: "Kode saham kosong." });
    }

    const symbol = input.toUpperCase() + ".JK";
    const url = `https://finance.yahoo.com/quote/${symbol}`;

    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const html = await response.text();

    // ===== Ambil JSON besar Yahoo =====
    const jsonMatch = html.match(/root\.App\.main\s*=\s*(\{.*?\});/s);

    if (!jsonMatch) {
      return res.status(200).json({ error: "Struktur Yahoo berubah." });
    }

    const data = JSON.parse(jsonMatch[1]);

    const store = data.context.dispatcher.stores.QuoteSummaryStore;

    const price = store.price?.regularMarketPrice?.raw;
    const eps = store.defaultKeyStatistics?.trailingEps?.raw;
    const per = store.summaryDetail?.trailingPE?.raw;

    if (!price || !eps || !per) {
      return res.status(200).json({ error: "Data fundamental tidak tersedia." });
    }

    const growth = 10;
    const fairPrice = eps * growth;
    const peg = per / growth;

    let status = "WAJAR";
    if (price > fairPrice * 1.2) status = "SANGAT MAHAL";
    else if (price > fairPrice) status = "MAHAL";
    else if (price < fairPrice * 0.8) status = "MURAH";

    return res.status(200).json({
      symbol,
      price: price.toFixed(2),
      eps: eps.toFixed(2),
      per: per.toFixed(2),
      growth: growth.toFixed(2),
      peg: peg.toFixed(2),
      fairPrice: fairPrice.toFixed(2),
      status
    });

  } catch (error) {
    return res.status(500).json({ error: "Gagal mengambil data." });
  }
}
