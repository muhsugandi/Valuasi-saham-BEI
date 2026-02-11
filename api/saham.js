export default async function handler(req, res) {

    const symbol = req.query.symbol + ".JK";

    try {

        const response = await fetch(
        `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=price,defaultKeyStatistics,financialData`
        );

        const json = await response.json();

        if(!json.quoteSummary || !json.quoteSummary.result){
            return res.status(200).json({ error: "Saham tidak ditemukan." });
        }

        const result = json.quoteSummary.result[0];

        const price = result?.price?.regularMarketPrice?.raw;
        const eps = result?.defaultKeyStatistics?.trailingEps?.raw;

        // Kalau EPS tidak ada
        if(!price || !eps){
            return res.status(200).json({ 
                error: "EPS tidak tersedia untuk saham ini." 
            });
        }

        let growth = 10; // default asumsi 10%

        if(result?.financialData?.earningsGrowth?.raw){
            growth = result.financialData.earningsGrowth.raw * 100;
        }

        const per = price / eps;
        const fairPrice = eps * growth;

        let status = "WAJAR";

        if(price > fairPrice*1.2){
            status = "SANGAT MAHAL";
        } else if(price > fairPrice){
            status = "MAHAL";
        } else if(price < fairPrice*0.8){
            status = "MURAH";
        }

        res.status(200).json({
            price: price.toFixed(2),
            eps: eps.toFixed(2),
            per: per.toFixed(2),
            growth: growth.toFixed(2),
            fairPrice: fairPrice.toFixed(2),
            status
        });

    } catch (error) {
        res.status(200).json({ error: "Terjadi error mengambil data Yahoo." });
    }
}
