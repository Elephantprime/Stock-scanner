/* =========================================================
   STOCK SCANNER — LIVE HISTORICAL BARS

   SERVER-SIDE VERCEL FUNCTION

   Provider: Alpaca
   Feed: IEX

   Browser requests:
   /api/candles?symbol=AAPL&timeframe=5m&limit=200
   ========================================================= */

export default async function handler(req, res) {

    if (req.method !== "GET") {

        return res.status(405).json({
            error: "Method not allowed"
        });

    }


    /* =====================================================
       CREDENTIALS
    ===================================================== */

    const apiKey =
        process.env.ALPACA_API_KEY;

    const apiSecret =
        process.env.ALPACA_API_SECRET;


    if (!apiKey || !apiSecret) {

        return res.status(500).json({
            error:
                "Market data credentials are not configured."
        });

    }


    /* =====================================================
       SYMBOL
    ===================================================== */

    const symbol =
        normalizeSymbol(
            req.query.symbol
        );


    if (!symbol) {

        return res.status(400).json({
            error: "Ticker symbol required."
        });

    }


    /* =====================================================
       TIMEFRAME
    ===================================================== */

    const requestedTimeframe =
        String(
            req.query.timeframe ||
            "5m"
        ).toLowerCase();


    const timeframeMap = {

        "1m": {
            alpaca: "1Min",
            lookbackDays: 2
        },

        "5m": {
            alpaca: "5Min",
            lookbackDays: 5
        },

        "15m": {
            alpaca: "15Min",
            lookbackDays: 10
        },

        "1h": {
            alpaca: "1Hour",
            lookbackDays: 30
        },

        "1d": {
            alpaca: "1Day",
            lookbackDays: 365
        }

    };


    const timeframeConfig =
        timeframeMap[
            requestedTimeframe
        ];


    if (!timeframeConfig) {

        return res.status(400).json({
            error:
                "Unsupported timeframe. Use 1m, 5m, 15m, 1h, or 1d."
        });

    }


    /* =====================================================
       LIMIT
    ===================================================== */

    const requestedLimit =
        Number(
            req.query.limit ||
            200
        );


    const limit =
        Math.min(
            Math.max(
                Number.isFinite(
                    requestedLimit
                )
                    ? Math.floor(
                        requestedLimit
                      )
                    : 200,
                20
            ),
            1000
        );


    /* =====================================================
       DATE RANGE

       Give Alpaca enough calendar history to return the
       requested number of trading bars.

       Alpaca still determines which bars actually exist.
    ===================================================== */

    const end =
        new Date();


    const start =
        new Date(
            end.getTime() -
            (
                timeframeConfig
                    .lookbackDays *
                24 *
                60 *
                60 *
                1000
            )
        );


    const query =
        new URLSearchParams({

            timeframe:
                timeframeConfig.alpaca,

            start:
                start.toISOString(),

            end:
                end.toISOString(),

            limit:
                String(limit),

            adjustment:
                "raw",

            feed:
                "iex",

            sort:
                "desc"

        });


    const url =
        `https://data.alpaca.markets/v2/stocks/${encodeURIComponent(symbol)}/bars?${query.toString()}`;


    try {

        const response =
            await fetch(
                url,
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

            const providerText =
                await response.text();


            console.error(
                "[Candles API] Alpaca error:",
                response.status,
                providerText
            );


            if (
                response.status === 404
            ) {

                return res.status(404).json({
                    error:
                        `No historical data found for ${symbol}.`
                });

            }


            if (
                response.status === 429
            ) {

                return res.status(429).json({
                    error:
                        "Historical market-data rate limit reached."
                });

            }


            return res
                .status(response.status)
                .json({

                    error:
                        `Historical market-data provider returned ${response.status}`

                });

        }


        const data =
            await response.json();


        const rawBars =
            Array.isArray(data.bars)
                ? data.bars
                : [];


        /*
         We requested DESC so that Alpaca gives us the
         newest bars first.

         The chart wants chronological order.
        */

        const bars =
            rawBars
                .map(bar => ({

                    time:
                        bar.t,

                    timestamp:
                        new Date(
                            bar.t
                        ).getTime(),

                    open:
                        numberOrNull(
                            bar.o
                        ),

                    high:
                        numberOrNull(
                            bar.h
                        ),

                    low:
                        numberOrNull(
                            bar.l
                        ),

                    close:
                        numberOrNull(
                            bar.c
                        ),

                    volume:
                        numberOrNull(
                            bar.v
                        ) ?? 0,

                    tradeCount:
                        numberOrNull(
                            bar.n
                        ),

                    vwap:
                        numberOrNull(
                            bar.vw
                        )

                }))
                .filter(bar =>

                    Number.isFinite(
                        bar.timestamp
                    ) &&

                    bar.open !== null &&
                    bar.high !== null &&
                    bar.low !== null &&
                    bar.close !== null

                )
                .sort(
                    (a, b) =>
                        a.timestamp -
                        b.timestamp
                );


        return res.status(200).json({

            symbol,

            timeframe:
                requestedTimeframe,

            bars,

            count:
                bars.length,

            source:
                "alpaca",

            feed:
                "iex",

            generatedAt:
                new Date()
                    .toISOString()

        });

    }
    catch (error) {

        console.error(
            "[Candles API]",
            error
        );


        return res.status(500).json({
            error:
                "Unable to retrieve historical market data."
        });

    }

}


/* =========================================================
   HELPERS
========================================================= */

function normalizeSymbol(symbol) {

    return String(
        symbol || ""
    )
        .trim()
        .toUpperCase()
        .replace(
            /[^A-Z0-9.\-]/g,
            ""
        );

}


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
