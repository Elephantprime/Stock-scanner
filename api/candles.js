/* =========================================================
   STOCK SCANNER — ALPACA HISTORICAL CANDLES

   SERVER-SIDE VERCEL FUNCTION

   Current feed:
   IEX

   Supported application timeframes:
   - 1m
   - 5m
   - 15m
   - 1h
   - 1d

   NO DEMO FALLBACK.
   ========================================================= */

export default async function handler(req, res) {

    if (req.method !== "GET") {

        return res.status(405).json({
            error: "Method not allowed"
        });

    }


    const symbol =
        normalizeSymbol(
            req.query.symbol
        );


    if (!symbol) {

        return res.status(400).json({
            error: "Ticker symbol required"
        });

    }


    const timeframe =
        normalizeTimeframe(
            req.query.timeframe
        );


    if (!timeframe) {

        return res.status(400).json({
            error: "Unsupported candle timeframe"
        });

    }


    const requestedLimit =
        Number(
            req.query.limit || 200
        );


    const limit =
        Math.min(
            Math.max(
                Number.isFinite(requestedLimit)
                    ? Math.floor(requestedLimit)
                    : 200,
                20
            ),
            1000
        );


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


    const alpacaTimeframe =
        toAlpacaTimeframe(
            timeframe
        );


    /*
     Use a sufficiently large calendar lookback so
     weekends and market holidays don't leave an
     intraday chart empty.

     sort=desc gets the newest bars first. We reverse
     them before returning so the browser receives
     chronological candles.
    */

    const start =
        new Date(
            Date.now() -
            lookbackMilliseconds(
                timeframe
            )
        ).toISOString();


    const params =
        new URLSearchParams({

            timeframe:
                alpacaTimeframe,

            start,

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
        `https://data.alpaca.markets/v2/stocks/${encodeURIComponent(symbol)}/bars?${params.toString()}`;


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


        if (!response.ok) {

            const providerText =
                await response.text();


            console.error(
                "[Candles API] Alpaca error:",
                response.status,
                providerText
            );


            if (response.status === 404) {

                return res.status(404).json({
                    error:
                        `No candle data found for ${symbol}.`
                });

            }


            if (response.status === 429) {

                return res.status(429).json({
                    error:
                        "Market data rate limit reached. Try again shortly."
                });

            }


            return res
                .status(response.status)
                .json({

                    error:
                        `Candle provider returned ${response.status}`

                });

        }


        const data =
            await response.json();


        const rawBars =
            Array.isArray(data?.bars)
                ? data.bars
                : [];


        const bars =
            rawBars
                .map(bar => ({

                    timestamp:
                        bar.t || null,

                    open:
                        numberOrNull(bar.o),

                    high:
                        numberOrNull(bar.h),

                    low:
                        numberOrNull(bar.l),

                    close:
                        numberOrNull(bar.c),

                    volume:
                        numberOrNull(bar.v) ?? 0,

                    vwap:
                        numberOrNull(bar.vw),

                    tradeCount:
                        numberOrNull(bar.n)

                }))
                .filter(bar => {

                    return (
                        bar.timestamp &&
                        bar.open !== null &&
                        bar.high !== null &&
                        bar.low !== null &&
                        bar.close !== null
                    );

                })
                .reverse();


        return res.status(200).json({

            symbol,

            timeframe,

            bars,

            count:
                bars.length,

            source:
                "alpaca",

            feed:
                "iex",

            generatedAt:
                new Date().toISOString()

        });

    }
    catch (error) {

        console.error(
            "[Candles API]",
            error
        );


        return res.status(500).json({
            error:
                "Unable to retrieve candle data."
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


function normalizeTimeframe(value) {

    const timeframe =
        String(
            value || "1m"
        )
            .trim()
            .toLowerCase();


    const supported =
        [
            "1m",
            "5m",
            "15m",
            "1h",
            "1d"
        ];


    return supported.includes(
        timeframe
    )
        ? timeframe
        : null;

}


function toAlpacaTimeframe(timeframe) {

    const map = {

        "1m": "1Min",

        "5m": "5Min",

        "15m": "15Min",

        "1h": "1Hour",

        "1d": "1Day"

    };


    return map[
        timeframe
    ];

}


function lookbackMilliseconds(timeframe) {

    const day =
        24 * 60 * 60 * 1000;


    const map = {

        "1m":
            7 * day,

        "5m":
            14 * day,

        "15m":
            30 * day,

        "1h":
            90 * day,

        "1d":
            500 * day

    };


    return map[
        timeframe
    ] || 14 * day;

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
