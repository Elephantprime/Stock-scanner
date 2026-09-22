/* =========================================================
   STOCK SCANNER — LIVE MARKET SERVICE

   PURPOSE:
   Single provider-independent interface between
   the browser application and our Vercel APIs.

   IMPORTANT:
   - Production data path is LIVE ONLY.
   - No silent demo fallback.
   - If a live service is unavailable, the UI receives
     an explicit error.
   ========================================================= */

window.StockScanner =
    window.StockScanner || {};


StockScanner.marketService = {

    mode:
        "LIVE",


    endpoints: {

        quote:
            "/api/quotes",

        candles:
            "/api/candles",

        movers:
            "/api/movers",

        marketPulse:
            "/api/market",

        marketNews:
            "/api/news",

        tickerNews:
            "/api/news"

    },


    /* =====================================================
       SERVICE STATUS
    ===================================================== */

    isLive() {

        return true;

    },


    setMode(mode) {

        if (
            String(mode)
                .toUpperCase() !==
            "LIVE"
        ) {

            console.warn(
                "[MarketService] Production service is LIVE only."
            );

        }


        this.mode =
            "LIVE";


        return true;

    },


    /* =====================================================
       QUOTE
    ===================================================== */

    async getQuote(symbol) {

        symbol =
            this.normalizeSymbol(
                symbol
            );


        if (!symbol) {

            throw new Error(
                "Ticker symbol required."
            );

        }


        return this.request(

            `${this.endpoints.quote}?symbol=${encodeURIComponent(symbol)}`

        );

    },


    /* =====================================================
       MOVERS / SCANNER
    ===================================================== */

    async getMovers(
        options = {}
    ) {

        const query =
            new URLSearchParams();


        Object.entries(
            options
        ).forEach(
            ([key, value]) => {

                if (
                    value !== undefined &&
                    value !== null &&
                    value !== ""
                ) {

                    query.set(
                        key,
                        String(value)
                    );

                }

            }
        );


        const suffix =
            query.toString()
                ? `?${query.toString()}`
                : "";


        const response =
            await this.request(

                `${this.endpoints.movers}${suffix}`

            );


        /*
         API returns metadata + stocks.
         Scanner only needs the stock array.
        */

        if (
            Array.isArray(response)
        ) {

            return response;

        }


        if (
            Array.isArray(
                response?.stocks
            )
        ) {

            return response.stocks;

        }


        return [];

    },


    /* =====================================================
       CANDLES

       This route does not exist yet.

       There is intentionally NO fake fallback.
    ===================================================== */

    async getCandles(
        symbol,
        timeframe = "1m",
        limit = 200
    ) {

        symbol =
            this.normalizeSymbol(
                symbol
            );


        if (!symbol) {

            throw new Error(
                "Ticker symbol required."
            );

        }


        const query =
            new URLSearchParams({

                symbol,

                timeframe,

                limit:
                    String(limit)

            });


        return this.request(

            `${this.endpoints.candles}?${query.toString()}`

        );

    },


    /* =====================================================
       MARKET PULSE

       Will become live when /api/market is created.

       No demo fallback.
    ===================================================== */

    async getMarketPulse() {

        return this.request(
            this.endpoints.marketPulse
        );

    },


    /* =====================================================
       MARKET NEWS

       Will become live when /api/news is created.

       No demo fallback.
    ===================================================== */

    async getMarketNews(
        options = {}
    ) {

        const query =
            new URLSearchParams();


        Object.entries(
            options
        ).forEach(
            ([key, value]) => {

                if (
                    value !== undefined &&
                    value !== null &&
                    value !== ""
                ) {

                    query.set(
                        key,
                        String(value)
                    );

                }

            }
        );


        const suffix =
            query.toString()
                ? `?${query.toString()}`
                : "";


        return this.request(

            `${this.endpoints.marketNews}${suffix}`

        );

    },


    /* =====================================================
       TICKER NEWS
    ===================================================== */

    async getTickerNews(
        symbol,
        options = {}
    ) {

        symbol =
            this.normalizeSymbol(
                symbol
            );


        if (!symbol) {

            throw new Error(
                "Ticker symbol required."
            );

        }


        const query =
            new URLSearchParams({

                symbol

            });


        Object.entries(
            options
        ).forEach(
            ([key, value]) => {

                if (
                    value !== undefined &&
                    value !== null &&
                    value !== ""
                ) {

                    query.set(
                        key,
                        String(value)
                    );

                }

            }
        );


        return this.request(

            `${this.endpoints.tickerNews}?${query.toString()}`

        );

    },


    /* =====================================================
       GENERIC LIVE REQUEST
    ===================================================== */

    async request(
        url,
        options = {}
    ) {

        const controller =
            new AbortController();


        const timeout =
            setTimeout(
                () => {

                    controller.abort();

                },
                12000
            );


        try {

            const response =
                await fetch(
                    url,
                    {

                        method:
                            options.method ||
                            "GET",

                        headers: {

                            "Accept":
                                "application/json",

                            ...(
                                options.headers ||
                                {}
                            )

                        },

                        signal:
                            controller.signal

                    }
                );


            let data = null;


            try {

                data =
                    await response.json();

            }
            catch (_) {

                data =
                    null;

            }


            if (!response.ok) {

                let message =
                    `API request failed (${response.status})`;


                if (
                    data?.error
                ) {

                    message =
                        typeof data.error ===
                        "string"
                            ? data.error
                            : JSON.stringify(
                                data.error
                            );

                }


                throw new Error(
                    message
                );

            }


            if (
                data === null
            ) {

                throw new Error(
                    "API returned an invalid response."
                );

            }


            return data;

        }
        catch (error) {

            if (
                error?.name ===
                "AbortError"
            ) {

                throw new Error(
                    "Market data request timed out."
                );

            }


            throw error;

        }
        finally {

            clearTimeout(
                timeout
            );

        }

    },


    /* =====================================================
       SYMBOL NORMALIZATION
    ===================================================== */

    normalizeSymbol(symbol) {

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

};
