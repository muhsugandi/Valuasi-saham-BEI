export default async function handler(req, res) {

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
    const API_KEY = "iBpwTdvNDAgxOwCKEPJZ98zd4d7jmb5r";

    // Endpoint ambil profile (harga, eps, pe)
    const url = `https://financialmodelingprep.com/api/v3/profile/${symbol}?apikey=${API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data || data.length === 0) {
      return res.status(200).json({ error: "Saham tidak ditemukan." });
    }

    const stock = data[0];

    const price = stock.price;
    const eps = stock.eps;
    const per = stock.pe;

    if (!price || !eps || !per) {
      return res.status(200).json({ error: "Data fundamental tidak tersedia." });
    }

    // Growth default (bisa dikembangkan)
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
    return res.status(500).json({ error: "Gagal mengambil data dari FMP." });
  }
}
