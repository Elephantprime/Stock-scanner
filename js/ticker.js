/* =========================================================
   STOCK SCANNER — SELECTED TICKER WORKSPACE

   LIVE DATA ONLY

   Market data source:
   StockScanner.marketService

   Analysis data will later come from the live
   scanner / pattern-analysis engine.

   Demo analysis is intentionally NOT used here.
   ========================================================= */

window.StockScanner = window.StockScanner || {};


StockScanner.ticker = {

    selectedSymbol: null,

    selectedQuote: null,

    requestId: 0,


    /* =====================================================
       SELECT TICKER
    ===================================================== */

    async select(symbol) {

        symbol =
            StockScanner.marketService
                .normalizeSymbol(symbol);


        if (!symbol) {
            return;
        }


        /*
         Incrementing request ID prevents an older,
         slower request from overwriting a newer ticker.
        */

        const requestId =
            ++this.requestId;


        this.selectedSymbol =
            symbol;


        this.selectedQuote =
            null;


        /*
         Clear EVERYTHING belonging to the previous stock
         before requesting the new one.

         This prevents stale NVDA data from appearing
         underneath AAPL, APPL, etc.
        */

        this.resetWorkspace(
            symbol
        );


        this.showLoading(
            symbol
        );


        try {

            const quote =
                await StockScanner.marketService
                    .getQuote(symbol);


            /*
             Ignore stale response.
            */

            if (
                requestId !==
                this.requestId
            ) {

                return;

            }


            if (
                this.selectedSymbol !==
                symbol
            ) {

                return;

            }


            this.selectedQuote =
                quote;


            this.renderQuote(
                quote
            );


            /*
             Until the live analysis engine is connected,
             explicitly show analysis as pending.

             We DO NOT pull analysis from demo-data.js.
            */

            this.showAnalysisPending();


            /*
             Watchlist buttons may depend on selectedSymbol.
            */

            if (
                StockScanner.watchlist &&
                typeof StockScanner.watchlist
                    .updateButtons === "function"
            ) {

                StockScanner.watchlist
                    .updateButtons();

            }

        }
        catch (error) {

            /*
             Ignore an error from an obsolete request.
            */

            if (
                requestId !==
                this.requestId
            ) {

                return;

            }


            console.error(
                "[Ticker]",
                error
            );


            this.selectedQuote =
                null;


            this.showError(
                symbol,
                error?.message ||
                "Unable to load market data."
            );


            if (
                StockScanner.watchlist &&
                typeof StockScanner.watchlist
                    .updateButtons === "function"
            ) {

                StockScanner.watchlist
                    .updateButtons();

            }

        }

    },


    /* =====================================================
       RENDER LIVE QUOTE
    ===================================================== */

    renderQuote(stock) {

        const symbol =
            stock.symbol ||
            this.selectedSymbol ||
            "---";


        const price =
            this.numberOrNull(
                stock.price
            );


        const changePercent =
            this.numberOrNull(
                stock.changePercent
            );


        const volume =
            this.numberOrNull(
                stock.volume
            );


        const vwap =
            this.numberOrNull(
                stock.vwap
            );


        /* -------------------------------------------------
           IDENTITY
        ------------------------------------------------- */

        this.setText(
            "tickerSymbol",
            symbol
        );


        /*
         Company-name metadata is not yet supplied by our
         quote endpoint.

         If company becomes available later, this already
         supports it.
        */

        this.setText(
            "tickerCompany",
            stock.company ||
            symbol
        );


        /* -------------------------------------------------
           PRICE
        ------------------------------------------------- */

        this.setText(
            "tickerPrice",
            price !== null
                ? this.formatPrice(price)
                : "$---"
        );


        this.setText(
            "metricPrice",
            price !== null
                ? this.formatPrice(price)
                : "---"
        );


        /* -------------------------------------------------
           DAILY CHANGE
        ------------------------------------------------- */

        const changeElement =
            document.getElementById(
                "tickerChange"
            );


        if (changeElement) {

            if (
                changePercent !== null
            ) {

                changeElement.textContent =
                    (
                        changePercent >= 0
                            ? "+"
                            : ""
                    ) +
                    changePercent.toFixed(2) +
                    "%";


                changeElement.className =
                    "ticker-change " +
                    (
                        changePercent >= 0
                            ? "positive"
                            : "negative"
                    );

            }
            else {

                changeElement.textContent =
                    "--%";


                changeElement.className =
                    "ticker-change";

            }

        }


        /* -------------------------------------------------
           VOLUME
        ------------------------------------------------- */

        this.setText(
            "metricVolume",
            volume !== null
                ? this.formatVolume(
                    volume
                  )
                : "---"
        );


        /* -------------------------------------------------
           VWAP

           Snapshot daily bar currently supplies this.
        ------------------------------------------------- */

        this.setText(
            "metricVWAP",
            vwap !== null
                ? this.formatPrice(
                    vwap
                  )
                : "---"
        );


        /* -------------------------------------------------
           RELATIVE VOLUME

           Not fabricated.

           Requires historical average-volume data.
        ------------------------------------------------- */

        this.setText(
            "metricRelVolume",
            stock.relativeVolume != null
                ? Number(
                    stock.relativeVolume
                  ).toFixed(1) + "×"
                : "---"
        );


        /* -------------------------------------------------
           MOMENTUM

           Will be calculated by analysis engine.
        ------------------------------------------------- */

        this.setText(
            "metricMomentum",
            stock.momentum ||
            "---"
        );


        /* -------------------------------------------------
           VOLATILITY

           Will require historical/intraday bars.
        ------------------------------------------------- */

        this.setText(
            "metricVolatility",
            stock.volatility ||
            "---"
        );


        /*
         Store useful live fields on the selected quote.

         These aren't all displayed yet, but they're now
         available to the upcoming analysis engine.
        */

        this.selectedQuote = {

            ...stock,

            symbol,

            price,

            changePercent,

            volume,

            vwap,

            previousClose:
                this.numberOrNull(
                    stock.previousClose
                ),

            open:
                this.numberOrNull(
                    stock.open
                ),

            high:
                this.numberOrNull(
                    stock.high
                ),

            low:
                this.numberOrNull(
                    stock.low
                ),

            bid:
                this.numberOrNull(
                    stock.bid
                ),

            ask:
                this.numberOrNull(
                    stock.ask
                ),

            spread:
                this.numberOrNull(
                    stock.spread
                ),

            spreadPercent:
                this.numberOrNull(
                    stock.spreadPercent
                ),

            tradeCount:
                this.numberOrNull(
                    stock.tradeCount
                )

        };

    },


    /* =====================================================
       RESET WORKSPACE

       Called BEFORE every new ticker request.

       This is what prevents stale data from the previous
       ticker surviving a failed lookup.
    ===================================================== */

    resetWorkspace(symbol) {

        this.setText(
            "tickerSymbol",
            symbol || "---"
        );


        this.setText(
            "tickerCompany",
            "Loading..."
        );


        this.setText(
            "tickerPrice",
            "$---"
        );


        const change =
            document.getElementById(
                "tickerChange"
            );


        if (change) {

            change.textContent =
                "--%";

            change.className =
                "ticker-change";

        }


        this.setText(
            "metricPrice",
            "---"
        );


        this.setText(
            "metricVolume",
            "---"
        );


        this.setText(
            "metricRelVolume",
            "---"
        );


        this.setText(
            "metricVWAP",
            "---"
        );


        this.setText(
            "metricMomentum",
            "---"
        );


        this.setText(
            "metricVolatility",
            "---"
        );


        this.clearAnalysis();

    },


    /* =====================================================
       LOADING STATE
    ===================================================== */

    showLoading(symbol) {

        this.setText(
            "tickerSymbol",
            symbol
        );


        this.setText(
            "tickerCompany",
            "Loading live market data..."
        );


        this.setText(
            "setupStatus",
            "Waiting for market data"
        );

    },


    /* =====================================================
       ERROR STATE

       No old quote or analysis values survive.
    ===================================================== */

    showError(
        symbol,
        message
    ) {

        this.selectedQuote =
            null;


        this.setText(
            "tickerSymbol",
            symbol
        );


        this.setText(
            "tickerCompany",
            message ||
            "Market data unavailable"
        );


        this.setText(
            "tickerPrice",
            "$---"
        );


        const change =
            document.getElementById(
                "tickerChange"
            );


        if (change) {

            change.textContent =
                "--%";

            change.className =
                "ticker-change";

        }


        this.setText(
            "metricPrice",
            "---"
        );


        this.setText(
            "metricVolume",
            "---"
        );


        this.setText(
            "metricRelVolume",
            "---"
        );


        this.setText(
            "metricVWAP",
            "---"
        );


        this.setText(
            "metricMomentum",
            "---"
        );


        this.setText(
            "metricVolatility",
            "---"
        );


        this.clearAnalysis();


        this.setText(
            "setupStatus",
            "Market data unavailable"
        );


        this.setText(
            "whyNowContent",
            "Unable to analyze this ticker because live market data was not returned."
        );

    },


    /* =====================================================
       LIVE ANALYSIS PLACEHOLDER

       This intentionally does NOT use demo data.

       The next analysis layer will populate these fields
       from real market data.
    ===================================================== */

    showAnalysisPending() {

        this.setText(
            "detectedSetup",
            "Analyzing..."
        );


        this.setText(
            "setupStatus",
            "Live analysis pending"
        );


        this.setText(
            "whyNowContent",
            "Live quote loaded. Waiting for the market-analysis engine."
        );


        this.clearTradePlan();

    },


    /* =====================================================
       CLEAR ANALYSIS
    ===================================================== */

    clearAnalysis() {

        this.setText(
            "detectedSetup",
            "None"
        );


        this.setText(
            "setupStatus",
            "Analysis pending"
        );


        this.setText(
            "whyNowContent",
            "No live setup analysis available."
        );


        this.clearTradePlan();

    },


    /* =====================================================
       CLEAR TRADE PLAN
    ===================================================== */

    clearTradePlan() {

        this.setText(
            "tradeEntry",
            "---"
        );


        this.setText(
            "tradeStop",
            "---"
        );


        this.setText(
            "tradeTarget1",
            "---"
        );


        this.setText(
            "tradeTarget2",
            "---"
        );


        this.setText(
            "riskReward",
            "---"
        );

    },


    /* =====================================================
       NUMBER HELPER
    ===================================================== */

    numberOrNull(value) {

        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {

            return null;

        }


        const number =
            Number(value);


        return Number.isFinite(
            number
        )
            ? number
            : null;

    },


    /* =====================================================
       PRICE FORMATTER
    ===================================================== */

    formatPrice(value) {

        const number =
            this.numberOrNull(
                value
            );


        if (
            number === null
        ) {

            return "---";

        }


        return (
            "$" +
            number.toFixed(2)
        );

    },


    /* =====================================================
       VOLUME FORMATTER
    ===================================================== */

    formatVolume(volume) {

        const number =
            this.numberOrNull(
                volume
            );


        if (
            number === null
        ) {

            return "---";

        }


        if (
            number >= 1e9
        ) {

            return (
                number / 1e9
            ).toFixed(2) + "B";

        }


        if (
            number >= 1e6
        ) {

            return (
                number / 1e6
            ).toFixed(2) + "M";

        }


        if (
            number >= 1e3
        ) {

            return (
                number / 1e3
            ).toFixed(1) + "K";

        }


        return Math.round(
            number
        ).toLocaleString();

    },


    /* =====================================================
       SAFE DOM HELPER
    ===================================================== */

    setText(
        id,
        value
    ) {

        const element =
            document.getElementById(
                id
            );


        if (element) {

            element.textContent =
                value;

        }

    }

};
