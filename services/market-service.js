/* =========================================================
   STOCK SCANNER — MARKET SERVICE

   PURPOSE:
   Single interface between the application and market data.

   The UI NEVER needs to know which market-data provider
   is being used.

   HYBRID MODE:
   Each service can independently use LIVE or DEMO data.

   Current configuration:
   - Quotes       = LIVE
   - Candles      = DEMO
   - Movers       = DEMO
   - Market Pulse = DEMO
   - News         = DEMO
   ========================================================= */

window.StockScanner = window.StockScanner || {};


StockScanner.marketService = {

    /* -----------------------------------------------------
       CONFIGURATION
    ----------------------------------------------------- */

    mode: "HYBRID",

    liveServices: {
        quotes: true,
        candles: false,
        movers: false,
        marketPulse: false,
        news: false
    },


    endpoints: {

        quote: "/api/quotes",

        candles: "/api/candles",

        movers: "/api/movers",

        marketPulse: "/api/market",

        marketNews: "/api/news",

        tickerNews: "/api/news"

    },


    /* =====================================================
       MODE CONTROL
    ===================================================== */

    setMode(mode) {

        const normalized =
            String(mode).toUpperCase();


        if (
            normalized !== "DEMO" &&
            normalized !== "LIVE" &&
            normalized !== "HYBRID"
        ) {

            console.error(
                "Invalid market service mode:",
                mode
            );

            return false;
        }


        this.mode = normalized;


        /*
         DEMO turns every live service off.
         LIVE turns every live service on.
         HYBRID preserves individual service settings.
        */

        if (normalized === "DEMO") {

            Object.keys(
                this.liveServices
            ).forEach(key => {

                this.liveServices[key] =
                    false;

            });

        }


        if (normalized === "LIVE") {

            Object.keys(
                this.liveServices
            ).forEach(key => {

                this.liveServices[key] =
                    true;

            });

        }


        console.log(
            `[MarketService] Mode: ${this.mode}`
        );


        return true;

    },


    /* -----------------------------------------------------
       Determine whether a specific service is live.

       Examples:

       isLive("quotes")
       isLive("news")

       Calling isLive() with no service returns true if
       ANY service is currently live.
    ----------------------------------------------------- */

    isLive(service = null) {

        if (this.mode === "DEMO") {
            return false;
        }


        if (this.mode === "LIVE") {
            return true;
        }


        if (service) {

            return Boolean(
                this.liveServices?.[service]
            );

        }


        return Object.values(
            this.liveServices || {}
        ).some(Boolean);

    },


    /* =====================================================
       QUOTE
    ===================================================== */

    async getQuote(symbol) {

        symbol =
            this.normalizeSymbol(symbol);


        if (!symbol) {

            throw new Error(
                "Ticker symbol required."
            );

        }


        /*
         Quotes are currently LIVE.
        */

        if (!this.isLive("quotes")) {

            return this.getDemoQuote(
                symbol
            );

        }


        return this.request(
            `${this.endpoints.quote}?symbol=${encodeURIComponent(symbol)}`
        );

    },


    /* =====================================================
       CANDLES
    ===================================================== */

    async getCandles(
        symbol,
        timeframe = "1m",
        limit = 200
    ) {

        symbol =
            this.normalizeSymbol(symbol);


        if (!symbol) {

            throw new Error(
                "Ticker symbol required."
            );

        }


        /*
         Candles remain DEMO until /api/candles exists.
        */

        if (!this.isLive("candles")) {

            return this.getDemoCandles(
                symbol,
                timeframe,
                limit
            );

        }


        const query =
            new URLSearchParams({

                symbol,

                timeframe,

                limit: String(limit)

            });


        return this.request(
            `${this.endpoints.candles}?${query}`
        );

    },


    /* =====================================================
       MARKET MOVERS / SCANNER INPUT
    ===================================================== */

    async getMovers(options = {}) {

        /*
         Scanner universe remains DEMO until
         /api/movers exists.
        */

        if (!this.isLive("movers")) {

            return this.getDemoMovers(
                options
            );

        }


        const query =
            new URLSearchParams();


        Object.entries(options)
            .forEach(
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
                ? `?${query}`
                : "";


        return this.request(
            `${this.endpoints.movers}${suffix}`
        );

    },


    /* =====================================================
       MARKET PULSE
    ===================================================== */

    async getMarketPulse() {

        /*
         Market Pulse remains DEMO until
         /api/market exists.
        */

        if (!this.isLive("marketPulse")) {

            return this.getDemoMarketPulse();

        }


        return this.request(
            this.endpoints.marketPulse
        );

    },


    /* =====================================================
       MARKET NEWS
    ===================================================== */

    async getMarketNews(
        options = {}
    ) {

        /*
         News remains DEMO until /api/news exists.
        */

        if (!this.isLive("news")) {

            return this.getDemoMarketNews(
                options
            );

        }


        const query =
            new URLSearchParams();


        Object.entries(options)
            .forEach(
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
                ? `?${query}`
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
            this.normalizeSymbol(symbol);


        if (!symbol) {

            throw new Error(
                "Ticker symbol required."
            );

        }


        if (!this.isLive("news")) {

            return this.getDemoTickerNews(
                symbol,
                options
            );

        }


        const query =
            new URLSearchParams({

                symbol,

                ...options

            });


        return this.request(
            `${this.endpoints.tickerNews}?${query}`
        );

    },


    /* =====================================================
       GENERIC API REQUEST

       Every live request passes through here.

       Gives us one place for:
       - HTTP errors
       - JSON errors
       - timeouts
       - logging
       - retry logic later
    ===================================================== */

    async request(
        url,
        options = {}
    ) {

        const controller =
            new AbortController();


        const timeout =
            setTimeout(
                () =>
                    controller.abort(),
                10000
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

                            ...options.headers

                        },

                        signal:
                            controller.signal

                    }
                );


            if (!response.ok) {

                let message =
                    `API request failed (${response.status})`;


                try {

                    const errorData =
                        await response.json();


                    if (
                        errorData &&
                        errorData.error
                    ) {

                        /*
                         Ensure we never throw [object Object].
                        */

                        message =
                            typeof errorData.error ===
                            "string"
                                ? errorData.error
                                : JSON.stringify(
                                    errorData.error
                                  );

                    }

                }
                catch (_) {

                    /*
                     Ignore malformed error response.
                    */

                }


                throw new Error(
                    message
                );

            }


            const data =
                await response.json();


            return data;

        }
        catch (error) {

            if (
                error.name ===
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

        if (!symbol) {
            return "";
        }


        return String(symbol)
            .trim()
            .toUpperCase()
            .replace(
                /[^A-Z0-9.\-]/g,
                ""
            );

    },


    /* =====================================================
       DEMO PROVIDER

       These functions make demo-data.js behave like a
       market-data provider.

       Live endpoints will eventually return these same
       normalized data structures.
    ===================================================== */


    getDemoQuote(symbol) {

        const stock =
            StockScanner.data.stocks.find(
                item =>
                    item.symbol === symbol
            );


        if (!stock) {

            throw new Error(
                `Demo ticker ${symbol} not found.`
            );

        }


        return Promise.resolve({

            symbol:
                stock.symbol,

            company:
                stock.company,

            price:
                stock.price,

            changePercent:
                stock.change,

            volume:
                stock.volume,

            relativeVolume:
                stock.relativeVolume,

            vwap:
                stock.vwap,

            momentum:
                stock.momentum,

            volatility:
                stock.volatility,

            timestamp:
                Date.now(),

            source:
                "demo",

            feed:
                "demo"

        });

    },


    /* =====================================================
       DEMO MOVERS
    ===================================================== */

    getDemoMovers() {

        const movers =
            StockScanner.data.stocks.map(
                stock => ({

                    symbol:
                        stock.symbol,

                    company:
                        stock.company,

                    price:
                        stock.price,

                    changePercent:
                        stock.change,

                    volume:
                        stock.volume,

                    relativeVolume:
                        stock.relativeVolume,

                    vwap:
                        stock.vwap,

                    setup:
                        stock.setup,

                    setupStatus:
                        stock.setupStatus,

                    catalyst:
                        stock.catalyst

                })
            );


        return Promise.resolve(
            movers
        );

    },


    /* =====================================================
       DEMO MARKET PULSE
    ===================================================== */

    getDemoMarketPulse() {

        return Promise.resolve(
            StockScanner.data.marketPulse
        );

    },


    /* =====================================================
       DEMO MARKET NEWS
    ===================================================== */

    getDemoMarketNews(
        options = {}
    ) {

        let news = [
            ...StockScanner.data.news
        ];


        if (
            options.type &&
            options.type !== "all"
        ) {

            news =
                news.filter(
                    item =>
                        item.type ===
                        options.type
                );

        }


        return Promise.resolve(
            news
        );

    },


    /* =====================================================
       DEMO TICKER NEWS
    ===================================================== */

    getDemoTickerNews(
        symbol
    ) {

        const news =
            StockScanner.data.news.filter(
                item =>
                    item.ticker === symbol
            );


        return Promise.resolve(
            news
        );

    },


    /* =====================================================
       DEMO CANDLES

       Temporary generated candles solely for exercising
       the chart interface.

       These are NOT historical market prices.
    ===================================================== */

    getDemoCandles(
        symbol,
        timeframe,
        limit
    ) {

        const stock =
            StockScanner.data.stocks.find(
                item =>
                    item.symbol === symbol
            );


        if (!stock) {

            return Promise.resolve(
                []
            );

        }


        const candles = [];


        const count =
            Math.min(
                Math.max(
                    Number(limit) || 100,
                    10
                ),
                500
            );


        let price =
            stock.price * 0.97;


        const now =
            Date.now();


        const interval =
            this.timeframeToMilliseconds(
                timeframe
            );


        for (
            let i = count - 1;
            i >= 0;
            i--
        ) {

            /*
             Deterministic demo movement.

             This exists ONLY for chart-development
             purposes and is not used as real analysis.
            */

            const wave =
                Math.sin(
                    (count - i) / 5
                ) * 0.003;


            const trend =
                stock.change >= 0
                    ? 0.0005
                    : -0.0005;


            const open =
                price;


            const close =
                open *
                (
                    1 +
                    wave +
                    trend
                );


            const high =
                Math.max(
                    open,
                    close
                ) * 1.002;


            const low =
                Math.min(
                    open,
                    close
                ) * 0.998;


            candles.push({

                time:
                    now -
                    (
                        i *
                        interval
                    ),

                open,

                high,

                low,

                close,

                volume:
                    Math.round(
                        stock.volume /
                        count
                    )

            });


            price =
                close;

        }


        return Promise.resolve(
            candles
        );

    },


    /* =====================================================
       TIMEFRAME CONVERSION
    ===================================================== */

    timeframeToMilliseconds(
        timeframe
    ) {

        const map = {

            "1m":
                60 * 1000,

            "5m":
                5 * 60 * 1000,

            "15m":
                15 * 60 * 1000,

            "30m":
                30 * 60 * 1000,

            "1h":
                60 * 60 * 1000,

            "4h":
                4 * 60 * 60 * 1000,

            "1d":
                24 * 60 * 60 * 1000

        };


        return (
            map[timeframe] ||
            map["1m"]
        );

    }

};
