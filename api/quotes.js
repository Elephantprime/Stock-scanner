/* =========================================================
   STOCK SCANNER — ALPACA QUOTE ENDPOINT

   Runs SERVER-SIDE on Vercel.
   Alpaca credentials never reach the browser.
   ========================================================= */

export default async function handler(req, res) {

    /* -----------------------------------------------------
       CORS / METHOD
    ----------------------------------------------------- */

    if (req.method !== "GET") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }


    /* -----------------------------------------------------
       READ + CLEAN SYMBOL
    ----------------------------------------------------- */

    const rawSymbol = req.query.symbol;

    const symbol = String(rawSymbol || "")
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9.\-]/g, "");


    if (!symbol) {
        return res.status(400).json({
            error: "Ticker symbol required"
        });
    }


    /* -----------------------------------------------------
       READ SERVER-SIDE SECRETS
    ----------------------------------------------------- */

    const apiKey =
        process.env.ALPACA_API_KEY;

    const apiSecret =
        process.env.ALPACA_API_SECRET;


    if (!apiKey || !apiSecret) {

        console.error(
            "[Quotes API] Alpaca credentials missing."
        );

        return res.status(500).json({
            error:
                "Market data credentials are not configured."
        });

    }


    /* -----------------------------------------------------
       ALPACA LATEST TRADE
    ----------------------------------------------------- */

    const url =
        `https://data.alpaca.markets/v2/stocks/${encodeURIComponent(symbol)}/trades/latest?feed=iex`;


    try {

        const response =
            await fetch(url, {

                headers: {

                    "APCA-API-KEY-ID":
                        apiKey,

                    "APCA-API-SECRET-KEY":
                        apiSecret,

                    "Accept":
                        "application/json"

                }

            });


        if (!response.ok) {

            const errorText =
                await response.text();

            console.error(
                "[Quotes API] Alpaca error:",
                response.status,
                errorText
            );


            return res.status(response.status).json({

                error:
                    `Market data provider returned ${response.status}`

            });

        }


        const data =
            await response.json();


        if (!data.trade) {

            return res.status(404).json({
                error:
                    `No quote data found for ${symbol}`
            });

        }


        /* -------------------------------------------------
           NORMALIZED RESPONSE

           Our browser receives OUR format, not Alpaca's.
        ------------------------------------------------- */

        return res.status(200).json({

            symbol,

            price:
                data.trade.p,

            timestamp:
                data.trade.t,

            source:
                "alpaca",

            feed:
                "iex"

        });

    }
    catch (error) {

        console.error(
            "[Quotes API]",
            error
        );


        return res.status(500).json({

            error:
                "Unable to retrieve market data"

        });

    }

}
