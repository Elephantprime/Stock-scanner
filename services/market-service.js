/* =========================================================
   STOCK SCANNER — LIVE MARKET SERVICE

   Single interface between browser modules and
   server-side Vercel APIs.

   LIVE ONLY.
   NO SILENT DEMO FALLBACK.
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


    async getMovers(
        options = {}
    ) {

        const suffix =
            this.buildQuery(
                options
            );


        const response =
            await this.request(

                `${this.endpoints.movers}${suffix}`

            );


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


    async getCandles(
        symbol,
        timeframe = "5m",
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


    async getMarketPulse() {

        return this.request(
            this.endpoints.marketPulse
        );

    },


    async getMarketNews(
        options = {}
    ) {

        const suffix =
            this.buildQuery(
                options
            );


        return this.request(

            `${this.endpoints.marketNews}${suffix}`

        );

    },


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


        return this.request(

            `${this.endpoints.tickerNews}${this.buildQuery({
                symbol,
                ...options
            })}`

        );

    },


    buildQuery(
        values = {}
    ) {

        const query =
            new URLSearchParams();


        Object.entries(
            values
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


        const text =
            query.toString();


        return text
            ? `?${text}`
            : "";

    },


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


            let data =
                null;


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
                else if (
                    data?.message
                ) {

                    message =
                        String(
                            data.message
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
