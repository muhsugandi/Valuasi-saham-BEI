export default async function handler(req, res) {

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {

    const input = req.query.symbol;
    if (!input) {
      return res.status(200).json({ error: "Kode saham kosong." });
    }

    const symbol = input.toUpperCase() + ".JK";
    const url = `https://finance.yahoo.com/quote/${symbol}`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    const html = await response.text();

    // ===== Ambil Harga =====
    const priceMatch = html.match(/"regularMarketPrice":\{"raw":([\d.]+)/);
    const price = priceMatch ? parseFloat(priceMatch[1]) : null;

    // ===== Ambil EPS (TTM) =====
    const epsMatch = html.match(/EPS \(TTM\).*?>([\d.,-]+)<\/td>/);
    const eps = epsMatch ? parseFloat(epsMatch[1].replace(/,/g, "")) : null;

    // ===== Ambil PER (TTM) =====
    const perMatch = html.match(/PE Ratio \(TTM\).*?>([\d.,-]+)<\/td>/);
    const per = perMatch ? parseFloat(perMatch[1].replace(/,/g, "")) : null;

    if (!price || !eps || !per) {
      return res.status(200).json({ error: "Data fundamental tidak tersedia." });
    }

    // ===== Hitung Growth Default (bisa dikembangkan) =====
    const growth = 10; // default 10%
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
    return res.status(500).json({ error: "Gagal mengambil data dari Yahoo." });
  }
}
