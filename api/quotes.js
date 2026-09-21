/* =========================================================
   STOCK SCANNER — ALPACA STOCK SNAPSHOT ENDPOINT

   SERVER-SIDE ONLY (Vercel)

   Returns normalized live stock data while keeping
   Alpaca credentials hidden from the browser.

   Current feed:
   IEX

   Data returned:
   - latest trade price
   - daily change %
   - current day OHLC
   - current day volume
   - previous close
   - latest bid / ask
   - spread
   - timestamps
   ========================================================= */

export default async function handler(req, res) {

    /* =====================================================
       METHOD
    ===================================================== */

    if (req.method !== "GET") {

        return res.status(405).json({
            error: "Method not allowed"
        });

    }


    /* =====================================================
       SYMBOL
    ===================================================== */

    const symbol = String(
        req.query.symbol || ""
    )
        .trim()
        .toUpperCase()
        .replace(
            /[^A-Z0-9.\-]/g,
            ""
        );


    if (!symbol) {

        return res.status(400).json({
            error: "Ticker symbol required"
        });

    }


    /* =====================================================
       SERVER-SIDE CREDENTIALS
    ===================================================== */

    const apiKey =
        process.env.ALPACA_API_KEY;

    const apiSecret =
        process.env.ALPACA_API_SECRET;


    if (
        !apiKey ||
        !apiSecret
    ) {

        console.error(
            "[Quotes API] Alpaca credentials missing."
        );


        return res.status(500).json({
            error:
                "Market data credentials are not configured."
        });

    }


    /* =====================================================
       ALPACA SNAPSHOT

       Snapshot gives us considerably more information
       than /trades/latest.

       We explicitly use IEX for the current build.
    ===================================================== */

    const snapshotUrl =
        `https://data.alpaca.markets/v2/stocks/${encodeURIComponent(symbol)}/snapshot?feed=iex`;


    try {

        const response =
            await fetch(
                snapshotUrl,
                {

                    headers: {

                        "APCA-API-KEY-ID":
                            apiKey,

                        "APCA-API-SECRET-KEY":
                            apiSecret,

                        "Accept":
                            "application/json"

                    }

                }
            );


        /* =================================================
           PROVIDER ERROR
        ================================================= */

        if (!response.ok) {

            const providerMessage =
                await response.text();


            console.error(
                "[Quotes API] Alpaca error:",
                response.status,
                providerMessage
            );


            /*
             Don't expose provider internals or credentials
             to the browser.
            */

            if (
                response.status === 404
            ) {

                return res.status(404).json({
                    error:
                        `Ticker ${symbol} was not found.`
                });

            }


            return res
                .status(response.status)
                .json({

                    error:
                        `Market data provider returned ${response.status}`

                });

        }


        const data =
            await response.json();


        /* =================================================
           ALPACA SNAPSHOT COMPONENTS
        ================================================= */

        const latestTrade =
            data.latestTrade || null;

        const latestQuote =
            data.latestQuote || null;

        const minuteBar =
            data.minuteBar || null;

        const dailyBar =
            data.dailyBar || null;

        const previousDailyBar =
            data.prevDailyBar || null;


        /* =================================================
           PRICE

           Prefer latest trade.

           Fall back to minute/daily close if necessary.
        ================================================= */

        const price =
            numberOrNull(
                latestTrade?.p
            ) ??
            numberOrNull(
                minuteBar?.c
            ) ??
            numberOrNull(
                dailyBar?.c
            );


        if (
            price === null
        ) {

            return res.status(404).json({
                error:
                    `No market data found for ${symbol}.`
            });

        }


        /* =================================================
           PREVIOUS CLOSE / DAILY CHANGE
        ================================================= */

        const previousClose =
            numberOrNull(
                previousDailyBar?.c
            );


        let change = null;
        let changePercent = null;


        if (
            previousClose !== null &&
            previousClose !== 0
        ) {

            change =
                price -
                previousClose;


            changePercent =
                (
                    change /
                    previousClose
                ) * 100;

        }


        /* =================================================
           DAILY DATA
        ================================================= */

        const open =
            numberOrNull(
                dailyBar?.o
            );


        const high =
            numberOrNull(
                dailyBar?.h
            );


        const low =
            numberOrNull(
                dailyBar?.l
            );


        const dailyClose =
            numberOrNull(
                dailyBar?.c
            );


        const volume =
            numberOrNull(
                dailyBar?.v
            ) ?? 0;


        const tradeCount =
            numberOrNull(
                dailyBar?.n
            );


        const dailyVWAP =
            numberOrNull(
                dailyBar?.vw
            );


        /* =================================================
           QUOTE / SPREAD
        ================================================= */

        const bid =
            numberOrNull(
                latestQuote?.bp
            );


        const ask =
            numberOrNull(
                latestQuote?.ap
            );


        const bidSize =
            numberOrNull(
                latestQuote?.bs
            );


        const askSize =
            numberOrNull(
                latestQuote?.as
            );


        let spread = null;
        let spreadPercent = null;


        if (
            bid !== null &&
            ask !== null &&
            ask >= bid
        ) {

            spread =
                ask - bid;


            const midpoint =
                (
                    ask +
                    bid
                ) / 2;


            if (
                midpoint > 0
            ) {

                spreadPercent =
                    (
                        spread /
                        midpoint
                    ) * 100;

            }

        }


        /* =================================================
           NORMALIZED RESPONSE

           Everything beyond this point uses OUR schema,
           not Alpaca's schema.
        ================================================= */

        return res.status(200).json({

            symbol,

            price,

            change,

            changePercent,

            previousClose,

            open,

            high,

            low,

            close:
                dailyClose,

            volume,

            vwap:
                dailyVWAP,

            tradeCount,

            bid,

            ask,

            bidSize,

            askSize,

            spread,

            spreadPercent,

            timestamp:
                latestTrade?.t ||
                minuteBar?.t ||
                dailyBar?.t ||
                null,

            sessionTimestamp:
                dailyBar?.t ||
                null,

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


/* =========================================================
   NUMBER HELPER

   Prevent undefined, NaN and strings from contaminating
   the normalized market-data response.
========================================================= */

function numberOrNull(value) {

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {

        return null;

    }


    const number =
        Number(value);


    return Number.isFinite(number)
        ? number
        : null;

}
