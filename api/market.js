/* =========================================================
   STOCK SCANNER — LIVE MARKET PULSE

   SERVER-SIDE VERCEL FUNCTION

   Current live pulse:
   - SPY
   - QQQ
   - IWM

   Current feed:
   IEX

   VIX / breadth / sector leadership are returned as
   unavailable rather than fabricated.
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


    const symbols =
        [
            "SPY",
            "QQQ",
            "IWM"
        ];


    const params =
        new URLSearchParams({

            symbols:
                symbols.join(","),

            feed:
                "iex"

        });


    const url =
        `https://data.alpaca.markets/v2/stocks/snapshots?${params.toString()}`;


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
                "[Market API] Alpaca error:",
                response.status,
                providerText
            );


            return res
                .status(response.status)
                .json({

                    error:
                        `Market pulse provider returned ${response.status}`

                });

        }


        const snapshots =
            await response.json();


        const result = {

            advanceDecline:
                null,

            leadingSector:
                null,

            VIX:
                null,

            source:
                "alpaca",

            feed:
                "iex",

            generatedAt:
                new Date().toISOString()

        };


        symbols.forEach(
            symbol => {

                const snapshot =
                    snapshots?.[
                        symbol
                    ] || {};


                const trade =
                    snapshot.latestTrade ||
                    null;


                const minute =
                    snapshot.minuteBar ||
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
                        minute?.c
                    ) ??
                    numberOrNull(
                        daily?.c
                    );


                const previousClose =
                    numberOrNull(
                        previous?.c
                    );


                let change =
                    null;


                if (
                    price !== null &&
                    previousClose !== null &&
                    previousClose !== 0
                ) {

                    change =
                        (
                            (
                                price -
                                previousClose
                            ) /
                            previousClose
                        ) * 100;

                }


                result[
                    symbol
                ] = {

                    price,

                    change,

                    timestamp:
                        trade?.t ||
                        minute?.t ||
                        daily?.t ||
                        null

                };

            }
        );


        return res.status(200).json(
            result
        );

    }
    catch (error) {

        console.error(
            "[Market API]",
            error
        );


        return res.status(500).json({
            error:
                "Unable to retrieve market pulse."
        });

    }

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
