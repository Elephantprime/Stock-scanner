/* =========================================================
   SELECTED TICKER WORKSPACE
   ========================================================= */

StockScanner.ticker = {

    selectedSymbol: null,


    getStock(symbol) {

        return StockScanner.data.stocks.find(
            stock => stock.symbol === symbol
        );

    },


    select(symbol) {

        const stock = this.getStock(symbol);

        if (!stock) {
            return;
        }

        this.selectedSymbol = symbol;

        document.getElementById("tickerSymbol").textContent =
            stock.symbol;

        document.getElementById("tickerCompany").textContent =
            stock.company;

        document.getElementById("tickerPrice").textContent =
            "$" + stock.price.toFixed(2);


        const change =
            document.getElementById("tickerChange");

        change.textContent =
            (stock.change >= 0 ? "+" : "") +
            stock.change.toFixed(2) +
            "%";

        change.className =
            "ticker-change " +
            (stock.change >= 0
                ? "positive"
                : "negative");


        document.getElementById("metricPrice").textContent =
            "$" + stock.price.toFixed(2);

        document.getElementById("metricVolume").textContent =
            this.formatVolume(stock.volume);

        document.getElementById("metricRelVolume").textContent =
            stock.relativeVolume.toFixed(1) + "×";

        document.getElementById("metricVWAP").textContent =
            "$" + stock.vwap.toFixed(2);

        document.getElementById("metricMomentum").textContent =
            stock.momentum;

        document.getElementById("metricVolatility").textContent =
            stock.volatility;


        document.getElementById("detectedSetup").textContent =
            stock.setup;

        document.getElementById("setupStatus").textContent =
            stock.setupStatus;


        this.renderWhyNow(stock);

        this.renderTradePlan(stock);


        if (StockScanner.watchlist) {

            StockScanner.watchlist.updateButtons();

        }

    },


    renderWhyNow(stock) {

        const container =
            document.getElementById("whyNowContent");

        container.innerHTML = "";

        stock.whyNow.forEach(reason => {

            const row =
                document.createElement("div");

            row.textContent = "• " + reason;

            row.style.marginBottom = "5px";

            container.appendChild(row);

        });

    },


    renderTradePlan(stock) {

        document.getElementById("tradeEntry").textContent =
            stock.trade.entry;

        document.getElementById("tradeStop").textContent =
            stock.trade.stop;

        document.getElementById("tradeTarget1").textContent =
            stock.trade.target1;

        document.getElementById("tradeTarget2").textContent =
            stock.trade.target2;

        document.getElementById("riskReward").textContent =
            stock.trade.riskReward;

    },


    formatVolume(volume) {

        if (volume >= 1000000000) {

            return (
                volume / 1000000000
            ).toFixed(1) + "B";

        }

        if (volume >= 1000000) {

            return (
                volume / 1000000
            ).toFixed(1) + "M";

        }

        if (volume >= 1000) {

            return (
                volume / 1000
            ).toFixed(1) + "K";

        }

        return volume.toString();

    }

};
