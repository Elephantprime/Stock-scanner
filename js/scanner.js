/* =========================================================
   MARKET SCANNER
   Data source: StockScanner.marketService
   ========================================================= */

StockScanner.scanner = {

    stocks: [],

    settings: {
        minimumPrice: null,
        maximumPrice: null,
        minimumVolume: null,
        minimumRelativeVolume: null,
        minimumMove: null,
        maximumSpread: null
    },


    async init() {

        this.bindSettings();

        await this.refresh();

    },


    async refresh() {

        try {

            const stocks =
                await StockScanner.marketService.getMovers();

            this.stocks =
                Array.isArray(stocks)
                    ? stocks
                    : [];

            this.applyFilters();

            this.setStatus("READY");

        }
        catch (error) {

            console.error(
                "[Scanner]",
                error
            );

            this.setStatus("ERROR");

            this.renderError(
                error.message
            );

        }

    },


    render(stocks) {

        const body =
            document.getElementById(
                "scannerResults"
            );

        body.innerHTML = "";


        if (!stocks.length) {

            body.innerHTML = `
                <tr class="empty-row">
                    <td colspan="8">
                        No stocks match current scan settings.
                    </td>
                </tr>
            `;

            return;

        }


        stocks.forEach(stock => {

            const row =
                document.createElement("tr");

            row.dataset.symbol =
                stock.symbol;


            row.innerHTML = `

                <td>
                    <strong>
                        ${stock.symbol}
                    </strong>
                </td>

                <td>
                    $${Number(stock.price).toFixed(2)}
                </td>

                <td class="
                    ${
                        stock.changePercent >= 0
                            ? "positive"
                            : "negative"
                    }
                ">
                    ${
                        stock.changePercent >= 0
                            ? "+"
                            : ""
                    }
                    ${Number(
                        stock.changePercent
                    ).toFixed(2)}%
                </td>

                <td>
                    ${
                        stock.relativeVolume != null
                            ? Number(
                                stock.relativeVolume
                              ).toFixed(1) + "×"
                            : "---"
                    }
                </td>

                <td>
                    ${this.formatVolume(
                        stock.volume
                    )}
                </td>

                <td class="accent">
                    ${stock.setup || "---"}
                </td>

                <td>
                    ${stock.catalyst || "---"}
                </td>

                <td>
                    ${stock.setupStatus || "---"}
                </td>
            `;


            row.addEventListener(
                "click",
                () => {

                    StockScanner.ticker.select(
                        stock.symbol
                    );

                }
            );


            body.appendChild(row);

        });

    },


    renderError(message) {

        const body =
            document.getElementById(
                "scannerResults"
            );

        body.innerHTML = `
            <tr class="empty-row">
                <td colspan="8">
                    Scanner unavailable:
                    ${message}
                </td>
            </tr>
        `;

    },


    bindSettings() {

        const button =
            document.getElementById(
                "applyScanSettings"
            );

        button.addEventListener(
            "click",
            () => {

                this.readSettings();

                this.applyFilters();

                StockScanner.app.closeDrawers();

            }
        );

    },


    readNumber(id) {

        const element =
            document.getElementById(id);

        const value =
            element.value;

        if (value === "") {
            return null;
        }

        return Number(value);

    },


    readSettings() {

        this.settings.minimumPrice =
            this.readNumber(
                "minimumPrice"
            );

        this.settings.maximumPrice =
            this.readNumber(
                "maximumPrice"
            );

        this.settings.minimumVolume =
            this.readNumber(
                "minimumVolume"
            );

        this.settings.minimumRelativeVolume =
            this.readNumber(
                "minimumRelativeVolume"
            );

        this.settings.minimumMove =
            this.readNumber(
                "minimumMove"
            );

        this.settings.maximumSpread =
            this.readNumber(
                "maximumSpread"
            );

        this.updateSummary();

    },


    applyFilters() {

        let results = [
            ...this.stocks
        ];

        const s =
            this.settings;


        if (s.minimumPrice !== null) {

            results =
                results.filter(
                    stock =>
                        Number(stock.price) >=
                        s.minimumPrice
                );

        }


        if (s.maximumPrice !== null) {

            results =
                results.filter(
                    stock =>
                        Number(stock.price) <=
                        s.maximumPrice
                );

        }


        if (s.minimumVolume !== null) {

            results =
                results.filter(
                    stock =>
                        Number(stock.volume) >=
                        s.minimumVolume
                );

        }


        if (
            s.minimumRelativeVolume !== null
        ) {

            results =
                results.filter(
                    stock =>
                        Number(
                            stock.relativeVolume
                        ) >=
                        s.minimumRelativeVolume
                );

        }


        if (s.minimumMove !== null) {

            results =
                results.filter(
                    stock =>
                        Math.abs(
                            Number(
                                stock.changePercent
                            )
                        ) >=
                        s.minimumMove
                );

        }


        this.render(results);

    },


    updateSummary() {

        const s =
            this.settings;

        document.getElementById(
            "activeScanSummary"
        ).innerHTML = `

            <span>
                Price:
                ${s.minimumPrice ?? "ANY"}
                –
                ${s.maximumPrice ?? "ANY"}
            </span>

            <span>
                RelVol:
                ${
                    s.minimumRelativeVolume
                    ?? "ANY"
                }
            </span>

            <span>
                Volume:
                ${
                    s.minimumVolume
                    ?? "ANY"
                }
            </span>

            <span>
                Move:
                ${
                    s.minimumMove
                    ?? "ANY"
                }%
            </span>

            <span>
                Setup: ALL
            </span>
        `;

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

    },


    setStatus(status) {

        const elements =
            document.querySelectorAll(
                "#systemStatus span"
            );

        elements.forEach(element => {

            if (
                element.textContent
                    .trim()
                    .startsWith("SCANNER")
            ) {

                const indicator =
                    element.querySelector("b");

                indicator.textContent =
                    status;

                indicator.className =
                    status === "READY"
                        ? "status-ready"
                        : "status-off";

            }

        });

    }

};
