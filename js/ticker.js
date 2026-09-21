/* =========================================================
   SELECTED TICKER WORKSPACE
   Data source: StockScanner.marketService
   ========================================================= */

StockScanner.ticker = {

    selectedSymbol: null,

    selectedQuote: null,


    async select(symbol) {

        symbol =
            StockScanner.marketService
                .normalizeSymbol(symbol);

        if (!symbol) {
            return;
        }


        this.selectedSymbol =
            symbol;


        this.showLoading(symbol);


        try {

            const quote =
                await StockScanner.marketService
                    .getQuote(symbol);

            /*
             Protect against an older request finishing
             after the user already selected another stock.
            */

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


            this.renderDemoAnalysis(
                symbol
            );


            if (
                StockScanner.watchlist
            ) {

                StockScanner.watchlist
                    .updateButtons();

            }

        }
        catch (error) {

            console.error(
                "[Ticker]",
                error
            );

            this.showError(
                symbol,
                error.message
            );

        }

    },


    renderQuote(stock) {

        document.getElementById(
            "tickerSymbol"
        ).textContent =
            stock.symbol;


        document.getElementById(
            "tickerCompany"
        ).textContent =
            stock.company ||
            stock.symbol;


        document.getElementById(
            "tickerPrice"
        ).textContent =
            "$" +
            Number(
                stock.price
            ).toFixed(2);


        const change =
            document.getElementById(
                "tickerChange"
            );


        const changePercent =
            Number(
                stock.changePercent || 0
            );


        change.textContent =
            (
                changePercent >= 0
                    ? "+"
                    : ""
            ) +
            changePercent.toFixed(2) +
            "%";


        change.className =
            "ticker-change " +
            (
                changePercent >= 0
                    ? "positive"
                    : "negative"
            );


        document.getElementById(
            "metricPrice"
        ).textContent =
            "$" +
            Number(
                stock.price
            ).toFixed(2);


        document.getElementById(
            "metricVolume"
        ).textContent =
            this.formatVolume(
                stock.volume
            );


        document.getElementById(
            "metricRelVolume"
        ).textContent =
            stock.relativeVolume != null
                ? Number(
                    stock.relativeVolume
                  ).toFixed(1) + "×"
                : "---";


        document.getElementById(
            "metricVWAP"
        ).textContent =
            stock.vwap != null
                ? "$" +
                  Number(
                      stock.vwap
                  ).toFixed(2)
                : "---";


        document.getElementById(
            "metricMomentum"
        ).textContent =
            stock.momentum ||
            "---";


        document.getElementById(
            "metricVolatility"
        ).textContent =
            stock.volatility ||
            "---";

    },


    /*
     Setup/WHY NOW/trade plan still come from our
     demo analysis engine for now.

     Later these will come from the actual scanner
     analysis layer — NOT the quote provider.
    */

    renderDemoAnalysis(symbol) {

        const analysis =
            StockScanner.data.stocks.find(
                stock =>
                    stock.symbol === symbol
            );


        if (!analysis) {

            this.clearAnalysis();

            return;

        }


        document.getElementById(
            "detectedSetup"
        ).textContent =
            analysis.setup ||
            "None";


        document.getElementById(
            "setupStatus"
        ).textContent =
            analysis.setupStatus ||
            "Waiting";


        this.renderWhyNow(
            analysis
        );


        this.renderTradePlan(
            analysis
        );

    },


    renderWhyNow(stock) {

        const container =
            document.getElementById(
                "whyNowContent"
            );

        container.innerHTML = "";


        const reasons =
            Array.isArray(
                stock.whyNow
            )
                ? stock.whyNow
                : [];


        if (!reasons.length) {

            container.textContent =
                "No setup analysis available.";

            return;

        }


        reasons.forEach(reason => {

            const row =
                document.createElement(
                    "div"
                );

            row.textContent =
                "• " + reason;

            row.style.marginBottom =
                "5px";

            container.appendChild(
                row
            );

        });

    },


    renderTradePlan(stock) {

        const trade =
            stock.trade || {};


        document.getElementById(
            "tradeEntry"
        ).textContent =
            trade.entry ||
            "---";


        document.getElementById(
            "tradeStop"
        ).textContent =
            trade.stop ||
            "---";


        document.getElementById(
            "tradeTarget1"
        ).textContent =
            trade.target1 ||
            "---";


        document.getElementById(
            "tradeTarget2"
        ).textContent =
            trade.target2 ||
            "---";


        document.getElementById(
            "riskReward"
        ).textContent =
            trade.riskReward ||
            "---";

    },


    clearAnalysis() {

        document.getElementById(
            "detectedSetup"
        ).textContent =
            "None";

        document.getElementById(
            "setupStatus"
        ).textContent =
            "Analysis pending";

        document.getElementById(
            "whyNowContent"
        ).textContent =
            "No setup analysis available.";

        document.getElementById(
            "tradeEntry"
        ).textContent = "---";

        document.getElementById(
            "tradeStop"
        ).textContent = "---";

        document.getElementById(
            "tradeTarget1"
        ).textContent = "---";

        document.getElementById(
            "tradeTarget2"
        ).textContent = "---";

        document.getElementById(
            "riskReward"
        ).textContent = "---";

    },


    showLoading(symbol) {

        document.getElementById(
            "tickerSymbol"
        ).textContent =
            symbol;

        document.getElementById(
            "tickerCompany"
        ).textContent =
            "Loading...";

    },


    showError(
        symbol,
        message
    ) {

        document.getElementById(
            "tickerSymbol"
        ).textContent =
            symbol;

        document.getElementById(
            "tickerCompany"
        ).textContent =
            message;

    },


    formatVolume(volume) {

        volume =
            Number(volume || 0);

        if (volume >= 1e9) {

            return (
                volume / 1e9
            ).toFixed(1) + "B";

        }

        if (volume >= 1e6) {

            return (
                volume / 1e6
            ).toFixed(1) + "M";

        }

        if (volume >= 1e3) {

            return (
                volume / 1e3
            ).toFixed(1) + "K";

        }

        return String(volume);

    }

};
