/* =========================================================
   STOCK SCANNER — ALPACA NEWS ENDPOINT

   SERVER-SIDE VERCEL FUNCTION

   Returns normalized market/company news.

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


    const symbol =
        normalizeSymbol(
            req.query.symbol
        );


    const requestedLimit =
        Number(
            req.query.limit || 30
        );


    const limit =
        Math.min(
            Math.max(
                Number.isFinite(requestedLimit)
                    ? Math.floor(requestedLimit)
                    : 30,
                1
            ),
            50
        );


    const params =
        new URLSearchParams({

            sort:
                "desc",

            limit:
                String(limit),

            exclude_contentless:
                "true"

        });


    if (symbol) {

        params.set(
            "symbols",
            symbol
        );

    }


    const url =
        `https://data.alpaca.markets/v1beta1/news?${params.toString()}`;


    const headers = {

        "APCA-API-KEY-ID":
            apiKey,

        "APCA-API-SECRET-KEY":
            apiSecret,

        "Accept":
            "application/json"

    };


    try {

        const response =
            await fetch(
                url,
                { headers }
            );


        if (!response.ok) {

            const providerText =
                await response.text();


            console.error(
                "[News API] Alpaca error:",
                response.status,
                providerText
            );


            if (response.status === 429) {

                return res.status(429).json({
                    error:
                        "News rate limit reached. Try again shortly."
                });

            }


            return res
                .status(response.status)
                .json({

                    error:
                        `News provider returned ${response.status}`

                });

        }


        const data =
            await response.json();


        const stories =
            Array.isArray(
                data?.news
            )
                ? data.news
                : [];


        const items =
            stories.map(
                story => {

                    const symbols =
                        Array.isArray(
                            story.symbols
                        )
                            ? story.symbols
                            : [];


                    const ticker =
                        symbol ||
                        symbols[0] ||
                        "MARKET";


                    return {

                        id:
                            story.id ?? null,

                        ticker,

                        symbols,

                        type:
                            classifyStory(
                                ticker,
                                symbols
                            ),

                        time:
                            formatTime(
                                story.created_at ||
                                story.updated_at
                            ),

                        timestamp:
                            story.created_at ||
                            story.updated_at ||
                            null,

                        headline:
                            story.headline ||
                            "",

                        summary:
                            story.summary ||
                            "",

                        source:
                            story.source ||
                            "",

                        url:
                            safeHttpUrl(
                                story.url
                            ),

                        images:
                            Array.isArray(
                                story.images
                            )
                                ? story.images
                                : []

                    };

                }
            );


        return res.status(200).json(
            items
        );

    }
    catch (error) {

        console.error(
            "[News API]",
            error
        );


        return res.status(500).json({
            error:
                "Unable to retrieve live news."
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


function classifyStory(
    ticker,
    symbols
) {

    if (
        ticker === "MARKET" ||
        !symbols.length
    ) {

        return "market";

    }


    return "stocks";

}


function formatTime(value) {

    if (!value) {
        return "";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";

    }


    return date.toLocaleTimeString(
        "en-US",
        {

            hour:
                "2-digit",

            minute:
                "2-digit"

        }
    );

}


function safeHttpUrl(value) {

    if (!value) {
        return null;
    }


    try {

        const url =
            new URL(value);


        if (
            url.protocol !== "http:" &&
            url.protocol !== "https:"
        ) {

            return null;

        }


        return url.toString();

    }
    catch (_) {

        return null;

    }

}
