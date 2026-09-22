/* =========================================================
   STOCK SCANNER — LIVE MARKET MOVERS

   SERVER-SIDE VERCEL FUNCTION

   Stage 1:
   Alpaca market-movers screener discovers symbols.

   Stage 2:
   Alpaca IEX snapshots enrich those symbols.

   This layer performs DATA-QUALITY filtering only.

   User trading preferences such as:
   - minimum price
   - minimum volume
   - minimum move
   - maximum spread

   belong in js/scanner.js.

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
        Number(req.query.top || 30);


    const top =
        Math.min(
            Math.max(
                Number.isFinite(requestedTop)
                    ? Math.floor(requestedTop)
                    : 30,
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
           STEP 1 — DISCOVER MOVERS
        ================================================= */

        const moversUrl =
            "https://data.alpaca.markets/" +
            "v1beta1/screener/stocks/movers" +
            `?top=${top}`;


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
                        "Alpaca market movers is not available to the current market-data account."

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
         Merge both sides and remove duplicate symbols.
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


            /*
             Alpaca's mover feed can contain warrants.

             Five-character symbols ending in W are very
             commonly warrant symbols.

             We deliberately keep this rule narrow so that
             ordinary equities are not broadly excluded.
            */

            if (
                isLikelyWarrantSymbol(
                    symbol
                )
            ) {

                return;
            }


            moverMap.set(
                symbol,
                {

                    symbol,

                    moverPrice:
                        positiveNumberOrNull(
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


        /* =================================================
           STEP 2 — LIVE IEX SNAPSHOTS
        ================================================= */

        const symbols =
            discovered
                .map(
                    item =>
                        item.symbol
                )
                .join(",");


        const snapshotUrl =
            "https://data.alpaca.markets/" +
            "v2/stocks/snapshots" +
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


            if (
                snapshotResponse.status === 429
            ) {

                return res.status(429).json({

                    error:
                        "Market snapshot rate limit reached. Try again shortly."

                });

            }


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
           STEP 3 — NORMALIZE + VALIDATE
        ================================================= */

        const stocks =
            discovered
                .map(mover => {

                    const snapshot =
                        snapshots[
                            mover.symbol
                        ] || null;


                    /*
                     If Alpaca did not return a snapshot,
                     don't send the symbol downstream.
                    */

                    if (!snapshot) {
                        return null;
                    }


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


                    const tradePrice =
                        positiveNumberOrNull(
                            trade?.p
                        );


                    const dailyClose =
                        positiveNumberOrNull(
                            daily?.c
                        );


                    const price =
                        tradePrice ??
                        dailyClose ??
                        mover.moverPrice;


                    /*
                     Zero, negative, missing or otherwise
                     invalid prices are unusable.
                    */

                    if (
                        price === null ||
                        price <= 0
                    ) {

                        return null;

                    }


                    const previousClose =
                        positiveNumberOrNull(
                            previous?.c
                        );


                    let change =
                        null;


                    let changePercent =
                        null;


                    /*
                     Prefer snapshot-derived change.

                     Only use the screener's percentage when
                     a valid previous daily close is absent.
                    */

                    if (
                        previousClose !== null
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


                    /*
                     Reject non-finite calculations.
                    */

                    if (
                        changePercent !== null &&
                        !Number.isFinite(
                            changePercent
                        )
                    ) {

                        changePercent =
                            null;

                    }


                    if (
                        change !== null &&
                        !Number.isFinite(
                            change
                        )
                    ) {

                        change =
                            null;

                    }


                    const bid =
                        positiveNumberOrNull(
                            quote?.bp
                        );


                    const ask =
                        positiveNumberOrNull(
                            quote?.ap
                        );


                    let spread =
                        null;


                    let spreadPercent =
                        null;


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


                    const volume =
                        positiveNumberOrZero(
                            daily?.v
                        );


                    const vwap =
                        positiveNumberOrNull(
                            daily?.vw
                        );


                    const timestamp =
                        trade?.t ||
                        quote?.t ||
                        daily?.t ||
                        null;


                    const freshness =
                        classifyFreshness(
                            timestamp
                        );


                    /*
                     Completely stale securities are not
                     useful to a live opportunity scanner.

                     LAST_SESSION is intentionally retained
                     because the scanner must still work
                     outside regular market hours.
                    */

                    if (
                        freshness ===
                        "STALE"
                    ) {

                        return null;

                    }


                    /*
                     Huge percentages are not automatically
                     deleted.

                     A legitimate split/repricing can create
                     unusual values. Instead we mark them as
                     suspicious so the browser can avoid
                     treating them as ordinary momentum.

                     This is important: we do NOT silently
                     rewrite market data.
                    */

                    const dataQuality =
                        classifyDataQuality({

                            price,

                            previousClose,

                            changePercent,

                            volume,

                            bid,

                            ask,

                            spreadPercent

                        });


                    return {

                        symbol:
                            mover.symbol,

                        price,

                        change,

                        changePercent,

                        previousClose,

                        open:
                            positiveNumberOrNull(
                                daily?.o
                            ),

                        high:
                            positiveNumberOrNull(
                                daily?.h
                            ),

                        low:
                            positiveNumberOrNull(
                                daily?.l
                            ),

                        volume,

                        vwap,

                        tradeCount:
                            positiveNumberOrZero(
                                daily?.n
                            ),

                        bid,

                        ask,

                        spread,

                        spreadPercent,


                        /*
                         Do not fabricate RVOL.

                         Historical average volume is needed
                         before this metric is legitimate.
                        */

                        relativeVolume:
                            null,


                        momentum:
                            deriveMomentum(
                                price,
                                vwap,
                                changePercent
                            ),


                        /*
                         Pattern engine is intentionally
                         separate from the market-data API.
                        */

                        setup:
                            "Analyzing",


                        setupStatus:
                            freshness,


                        catalyst:
                            "---",


                        timestamp,

                        freshness,

                        dataQuality,

                        source:
                            "alpaca",

                        feed:
                            "iex"

                    };

                })
                .filter(Boolean)


                /*
                 Put clean data ahead of questionable data.

                 Within each group, rank by absolute move.
                */

                .sort(
                    (a, b) => {

                        const qualityDifference =
                            qualityRank(
                                a.dataQuality
                            ) -
                            qualityRank(
                                b.dataQuality
                            );


                        if (
                            qualityDifference !== 0
                        ) {

                            return qualityDifference;

                        }


                        return (
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

                    }
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
   SYMBOL HELPERS
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


/*
 Five-character-plus symbols ending in W are
 commonly warrants in the Alpaca mover feed.

 Examples observed in the scanner:
 MSAIW
 GLNDW
 SDAWW

 Keep the heuristic intentionally narrow.
*/

function isLikelyWarrantSymbol(
    symbol
) {

    return (
        symbol.length >= 5 &&
        symbol.endsWith("W")
    );

}


/* =========================================================
   NUMBER HELPERS
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


function positiveNumberOrNull(value) {

    const number =
        numberOrNull(
            value
        );


    return (
        number !== null &&
        number > 0
    )
        ? number
        : null;

}


function positiveNumberOrZero(value) {

    const number =
        numberOrNull(
            value
        );


    return (
        number !== null &&
        number > 0
    )
        ? number
        : 0;

}


/* =========================================================
   FRESHNESS
========================================================= */

function classifyFreshness(
    timestamp
) {

    if (!timestamp) {

        /*
         No timestamp means we cannot establish
         real-time freshness.
        */

        return "UNKNOWN";

    }


    const time =
        new Date(
            timestamp
        ).getTime();


    if (
        !Number.isFinite(time)
    ) {

        return "UNKNOWN";

    }


    const age =
        Date.now() -
        time;


    /*
     15 minutes:
     genuinely recent data.

     7 days:
     permits prior-session data across weekends
     and holidays.

     Older:
     unsuitable for live scanning.
    */

    if (
        age <=
        15 * 60 * 1000
    ) {

        return "LIVE";

    }


    if (
        age <=
        7 * 24 * 60 * 60 * 1000
    ) {

        return "LAST SESSION";

    }


    return "STALE";

}


/* =========================================================
   DATA QUALITY
========================================================= */

function classifyDataQuality({

    price,
    previousClose,
    changePercent,
    volume,
    bid,
    ask,
    spreadPercent

}) {

    /*
     Missing previous close makes the percentage
     less independently verifiable.
    */

    if (
        previousClose === null
    ) {

        return "CHECK";

    }


    /*
     Extremely large daily moves are retained but
     flagged instead of blindly trusted.
    */

    if (
        changePercent !== null &&
        Math.abs(
            changePercent
        ) >= 500
    ) {

        return "CHECK";

    }


    /*
     No reported session volume is poor scanner
     data regardless of user liquidity settings.
    */

    if (
        volume <= 0
    ) {

        return "CHECK";

    }


    /*
     Broken quote.
    */

    if (
        bid !== null &&
        ask !== null &&
        ask < bid
    ) {

        return "CHECK";

    }


    /*
     A gigantic quoted spread is not necessarily
     invalid, especially in illiquid securities,
     so retain and flag it.
    */

    if (
        spreadPercent !== null &&
        spreadPercent >= 50
    ) {

        return "CHECK";

    }


    /*
     Penny-priced securities are not removed here.
     Price preference belongs in Scan Settings.
    */

    if (
        price <= 0
    ) {

        return "CHECK";

    }


    return "OK";

}


function qualityRank(
    quality
) {

    if (
        quality === "OK"
    ) {

        return 0;

    }


    if (
        quality === "CHECK"
    ) {

        return 1;

    }


    return 2;

}


/* =========================================================
   MOMENTUM
========================================================= */

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
