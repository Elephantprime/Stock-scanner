/* =========================================================
   STOCK SCANNER — SELECTED TICKER WORKSPACE

   LIVE DATA ONLY

   Quote:
   StockScanner.marketService

   Chart:
   StockScanner.chart

   Pattern/trade analysis will be connected to the
   candle-analysis engine later.
   ========================================================= */

window.StockScanner =
    window.StockScanner || {};


StockScanner.ticker = {

    selectedSymbol:
        null,

    selectedQuote:
        null,

    requestId:
        0,


    async select(symbol) {

        symbol =
            StockScanner
                .marketService
                .normalizeSymbol(
                    symbol
                );


        if (!symbol) {
            return;
        }


        const requestId =
            ++this.requestId;


        this.selectedSymbol =
            symbol;

        this.selectedQuote =
            null;


        this.resetWorkspace(
            symbol
        );


        this.showLoading(
            symbol
        );


        /*
         Chart and quote are independent live requests.

         The chart can begin loading immediately instead
         of waiting for the quote request to finish.
        */

        if (
            StockScanner.chart &&
            typeof StockScanner.chart.load ===
                "function"
        ) {

            StockScanner.chart.load(
                symbol
            );

        }


        try {

            const quote =
                await StockScanner
                    .marketService
                    .getQuote(
                        symbol
                    );


            if (
                requestId !==
                    this.requestId ||
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


            this.showAnalysisPending();


            if (
                StockScanner.watchlist &&
                typeof StockScanner
                    .watchlist
                    .updateQuote ===
                    "function"
            ) {

                StockScanner.watchlist
                    .updateQuote(
                        quote
                    );

            }

        }
        catch (error) {

            if (
                requestId !==
                    this.requestId ||
                this.selectedSymbol !==
                    symbol
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

        }
        finally {

            if (
                StockScanner.watchlist &&
                typeof StockScanner
                    .watchlist
                    .updateButtons ===
                    "function"
            ) {

                StockScanner.watchlist
                    .updateButtons();

            }

        }

    },


    renderQuote(stock) {

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


        this.setText(
            "tickerSymbol",
            stock.symbol ||
            this.selectedSymbol ||
            "---"
        );


        /*
         Alpaca snapshot does not provide company name.
         We therefore display the symbol rather than
         pretending we have company metadata.
        */

        this.setText(
            "tickerCompany",
            stock.company ||
            "Live market data"
        );


        this.setText(
            "tickerPrice",
            this.formatPrice(
                price
            )
        );


        this.setText(
            "metricPrice",
            this.formatPrice(
                price
            )
        );


        const changeElement =
            document.getElementById(
                "tickerChange"
            );


        if (changeElement) {

            if (
                changePercent === null
            ) {

                changeElement.textContent =
                    "---";

                changeElement.className =
                    "ticker-change";

            }
            else {

                changeElement.textContent =
                    `${
                        changePercent >= 0
                            ? "+"
                            : ""
                    }${changePercent.toFixed(2)}%`;


                changeElement.className =
                    `ticker-change ${
                        changePercent >= 0
                            ? "positive"
                            : "negative"
                    }`;

            }

        }


        this.setText(
            "metricVolume",
            this.formatVolume(
                volume
            )
        );


        this.setText(
            "metricVWAP",
            this.formatPrice(
                vwap
            )
        );


        const rvol =
            this.numberOrNull(
                stock.relativeVolume
            );


        this.setText(
            "metricRelVolume",
            rvol !== null
                ? `${rvol.toFixed(2)}×`
                : "---"
        );


        this.setText(
            "metricMomentum",
            stock.momentum ||
            "---"
        );


        this.setText(
            "metricVolatility",
            stock.volatility ||
            "---"
        );


        this.selectedQuote = {

            ...stock,

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


    resetWorkspace(symbol) {

        this.setText(
            "tickerSymbol",
            symbol
        );


        this.setText(
            "tickerCompany",
            "Loading..."
        );


        this.setText(
            "tickerPrice",
            "---"
        );


        const change =
            document.getElementById(
                "tickerChange"
            );


        if (change) {

            change.textContent =
                "---";

            change.className =
                "ticker-change";

        }


        [
            "metricPrice",
            "metricVolume",
            "metricRelVolume",
            "metricVWAP",
            "metricMomentum",
            "metricVolatility"
        ].forEach(
            id => {

                this.setText(
                    id,
                    "---"
                );

            }
        );


        this.clearAnalysis();

    },


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


    showError(
        symbol,
        message
    ) {

        this.setText(
            "tickerSymbol",
            symbol
        );


        this.setText(
            "tickerCompany",
            message
        );


        this.setText(
            "tickerPrice",
            "---"
        );


        this.setText(
            "tickerChange",
            "---"
        );


        [
            "metricPrice",
            "metricVolume",
            "metricRelVolume",
            "metricVWAP",
            "metricMomentum",
            "metricVolatility"
        ].forEach(
            id => {

                this.setText(
                    id,
                    "---"
                );

            }
        );


        this.setText(
            "detectedSetup",
            "None"
        );


        this.setText(
            "setupStatus",
            "Market data unavailable"
        );


        const why =
            document.getElementById(
                "whyNowContent"
            );


        if (why) {

            why.innerHTML = `

                <p>
                    Unable to analyze this ticker because
                    live quote data was not returned.
                </p>
            `;

        }


        this.clearTradePlan();

    },


    showAnalysisPending() {

        this.setText(
            "detectedSetup",
            "Analyzing..."
        );


        this.setText(
            "setupStatus",
            "Live candle analysis pending"
        );


        const why =
            document.getElementById(
                "whyNowContent"
            );


        if (why) {

            why.innerHTML = `

                <p>
                    Live quote and chart data are loading.
                    Pattern confirmation and trade-plan
                    logic will use these candles when the
                    analysis engine is connected.
                </p>
            `;

        }


        this.clearTradePlan();

    },


    clearAnalysis() {

        this.setText(
            "detectedSetup",
            "None"
        );


        this.setText(
            "setupStatus",
            "Analysis pending"
        );


        const why =
            document.getElementById(
                "whyNowContent"
            );


        if (why) {

            why.innerHTML = `

                <p>
                    No live setup analysis available.
                </p>
            `;

        }


        this.clearTradePlan();

    },


    clearTradePlan() {

        [
            "tradeEntry",
            "tradeStop",
            "tradeTarget1",
            "tradeTarget2",
            "riskReward"
        ].forEach(
            id => {

                this.setText(
                    id,
                    "---"
                );

            }
        );

    },


    numberOrNull(value) {

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

    },


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


        if (
            number >= 1
        ) {

            return `$${number.toFixed(2)}`;

        }


        if (
            number >= 0.01
        ) {

            return `$${number.toFixed(3)}`;

        }


        return `$${number.toFixed(4)}`;

    },


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
