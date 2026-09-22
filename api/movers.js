/* =========================================================
   STOCK SCANNER — LIVE MARKET MOVERS

   SERVER-SIDE VERCEL FUNCTION

   Stage 1:
   Alpaca market-movers screener discovers symbols.

   Stage 2:
   Alpaca snapshots enrich those symbols with:
   - latest price
   - daily change
   - volume
   - VWAP
   - day high / low
   - bid / ask
   - spread

   NO DEMO FALLBACK.
   ========================================================= */

export default async function handler(req, res) {

    if (req.method !== "GET") {

        return res.status(405).json({
            error: "Method not allowed"
        });

    }


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


    const requestedTop =
        Number(req.query.top || 20);


    const top =
        Math.min(
            Math.max(
                Number.isFinite(requestedTop)
                    ? Math.floor(requestedTop)
                    : 20,
                5
            ),
            50
        );


    const headers = {

        "APCA-API-KEY-ID":
            apiKey,

        "APCA-API-SECRET-KEY":
            apiSecret,

        "Accept":
            "application/json"

    };


    try {

        /* =================================================
           STEP 1 — DISCOVER MARKET MOVERS
        ================================================= */

        const moversUrl =
            `https://data.alpaca.markets/v1beta1/screener/stocks/movers?top=${top}`;


        const moversResponse =
            await fetch(
                moversUrl,
                { headers }
            );


        if (!moversResponse.ok) {

            const providerText =
                await moversResponse.text();


            console.error(
                "[Movers API] Alpaca screener error:",
                moversResponse.status,
                providerText
            );


            if (
                moversResponse.status === 403
            ) {

                return res.status(403).json({

                    error:
                        "Alpaca market movers requires market-data access not available to the current account."

                });

            }


            if (
                moversResponse.status === 429
            ) {

                return res.status(429).json({

                    error:
                        "Market scanner rate limit reached. Try again shortly."

                });

            }


            return res
                .status(moversResponse.status)
                .json({

                    error:
                        `Market movers provider returned ${moversResponse.status}`

                });

        }


        const moversData =
            await moversResponse.json();


        const gainers =
            Array.isArray(
                moversData.gainers
            )
                ? moversData.gainers
                : [];


        const losers =
            Array.isArray(
                moversData.losers
            )
                ? moversData.losers
                : [];


        /*
         Merge gainers and losers while preventing
         duplicate symbols.
        */

        const moverMap =
            new Map();


        [
            ...gainers,
            ...losers
        ].forEach(item => {

            const symbol =
                normalizeSymbol(
                    item.symbol
                );


            if (!symbol) {
                return;
            }


            moverMap.set(
                symbol,
                {

                    symbol,

                    moverPrice:
                        numberOrNull(
                            item.price
                        ),

                    moverChange:
                        numberOrNull(
                            item.change
                        ),

                    moverPercentChange:
                        numberOrNull(
                            item.percent_change
                        )

                }
            );

        });


        const discovered =
            Array.from(
                moverMap.values()
            );


        if (!discovered.length) {

            return res.status(200).json({
                stocks: [],
                count: 0,
                source: "alpaca",
                discovery: "market-movers",
                feed: "live"
            });

        }


        /* =================================================
           STEP 2 — ENRICH WITH SNAPSHOTS

           We explicitly request IEX because that's the
           live feed currently available to this build.
        ================================================= */

        const symbols =
            discovered
                .map(item => item.symbol)
                .join(",");


        const snapshotUrl =
            "https://data.alpaca.markets/v2/stocks/snapshots" +
            `?symbols=${encodeURIComponent(symbols)}` +
            "&feed=iex";


        const snapshotResponse =
            await fetch(
                snapshotUrl,
                { headers }
            );


        if (!snapshotResponse.ok) {

            const providerText =
                await snapshotResponse.text();


            console.error(
                "[Movers API] Snapshot error:",
                snapshotResponse.status,
                providerText
            );


            return res
                .status(snapshotResponse.status)
                .json({

                    error:
                        `Market snapshot provider returned ${snapshotResponse.status}`

                });

        }


        const snapshots =
            await snapshotResponse.json();


        /* =================================================
           NORMALIZE RESULTS
        ================================================= */

        const stocks =
            discovered
                .map(mover => {

                    const snapshot =
                        snapshots[
                            mover.symbol
                        ] || {};


                    const trade =
                        snapshot.latestTrade ||
                        null;


                    const quote =
                        snapshot.latestQuote ||
                        null;


                    const daily =
                        snapshot.dailyBar ||
                        null;


                    const previous =
                        snapshot.prevDailyBar ||
                        null;


                    const price =
                        numberOrNull(
                            trade?.p
                        ) ??
                        numberOrNull(
                            daily?.c
                        ) ??
                        mover.moverPrice;


                    if (
                        price === null
                    ) {

                        return null;

                    }


                    const previousClose =
                        numberOrNull(
                            previous?.c
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
                    else {

                        change =
                            mover.moverChange;


                        changePercent =
                            mover.moverPercentChange;

                    }


                    const bid =
                        positiveNumberOrNull(
                            quote?.bp
                        );


                    const ask =
                        positiveNumberOrNull(
                            quote?.ap
                        );


                    let spread = null;
                    let spreadPercent = null;


                    if (
                        bid !== null &&
                        ask !== null &&
                        ask >= bid
                    ) {

                        spread =
                            ask -
                            bid;


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


                    /*
                     We are NOT fabricating relative volume.

                     That requires historical average
                     volume, which we'll calculate when
                     the bars/history layer is connected.
                    */

                    return {

                        symbol:
                            mover.symbol,

                        price,

                        change,

                        changePercent,

                        previousClose,

                        open:
                            numberOrNull(
                                daily?.o
                            ),

                        high:
                            numberOrNull(
                                daily?.h
                            ),

                        low:
                            numberOrNull(
                                daily?.l
                            ),

                        volume:
                            numberOrNull(
                                daily?.v
                            ) ?? 0,

                        vwap:
                            numberOrNull(
                                daily?.vw
                            ),

                        tradeCount:
                            numberOrNull(
                                daily?.n
                            ),

                        bid,

                        ask,

                        spread,

                        spreadPercent,

                        relativeVolume:
                            null,

                        momentum:
                            deriveMomentum(
                                price,
                                numberOrNull(
                                    daily?.vw
                                ),
                                changePercent
                            ),

                        /*
                         Pattern engine is not connected yet.
                        */

                        setup:
                            "Analyzing",

                        setupStatus:
                            "LIVE",

                        catalyst:
                            "---",

                        timestamp:
                            trade?.t ||
                            daily?.t ||
                            null,

                        source:
                            "alpaca",

                        feed:
                            "iex"

                    };

                })
                .filter(Boolean)
                .sort(
                    (a, b) =>
                        Math.abs(
                            Number(
                                b.changePercent || 0
                            )
                        ) -
                        Math.abs(
                            Number(
                                a.changePercent || 0
                            )
                        )
                );


        return res.status(200).json({

            stocks,

            count:
                stocks.length,

            source:
                "alpaca",

            discovery:
                "market-movers",

            feed:
                "iex",

            generatedAt:
                new Date().toISOString()

        });

    }
    catch (error) {

        console.error(
            "[Movers API]",
            error
        );


        return res.status(500).json({

            error:
                "Unable to retrieve live scanner data."

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


function positiveNumberOrNull(value) {

    const number =
        numberOrNull(value);


    return (
        number !== null &&
        number > 0
    )
        ? number
        : null;

}


function deriveMomentum(
    price,
    vwap,
    changePercent
) {

    if (
        price === null ||
        vwap === null ||
        changePercent === null
    ) {

        return "---";

    }


    if (
        changePercent >= 2 &&
        price > vwap
    ) {

        return "STRONG UP";

    }


    if (
        changePercent <= -2 &&
        price < vwap
    ) {

        return "STRONG DOWN";

    }


    if (
        price > vwap
    ) {

        return "ABOVE VWAP";

    }


    if (
        price < vwap
    ) {

        return "BELOW VWAP";

    }


    return "NEUTRAL";

                              }
