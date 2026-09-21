/* =========================================================
   MARKET SCANNER
   ========================================================= */

StockScanner.scanner = {

    settings: {
        minimumPrice: null,
        maximumPrice: null,
        minimumVolume: null,
        minimumRelativeVolume: null,
        minimumMove: null,
        maximumSpread: null
    },


    init() {

        this.render(
            StockScanner.data.stocks
        );

        this.bindSettings();

    },


    render(stocks) {

        const body =
            document.getElementById("scannerResults");

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
                    <strong>${stock.symbol}</strong>
                </td>

                <td>
                    $${stock.price.toFixed(2)}
                </td>

                <td class="
                    ${stock.change >= 0
                        ? "positive"
                        : "negative"}
                ">
                    ${stock.change >= 0 ? "+" : ""}
                    ${stock.change.toFixed(2)}%
                </td>

                <td>
                    ${stock.relativeVolume.toFixed(1)}×
                </td>

                <td>
                    ${StockScanner.ticker.formatVolume(
                        stock.volume
                    )}
                </td>

                <td class="accent">
                    ${stock.setup}
                </td>

                <td>
                    ${stock.catalyst}
                </td>

                <td>
                    ${stock.setupStatus}
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


    bindSettings() {

        const apply =
            document.getElementById(
                "applyScanSettings"
            );


        apply.addEventListener(
            "click",
            () => {

                this.readSettings();

                this.applyFilters();

                StockScanner.app.closeDrawers();

            }
        );

    },


    readNumber(id) {

        const value =
            document.getElementById(id).value;

        if (value === "") {
            return null;
        }

        return Number(value);

    },


    readSettings() {

        this.settings.minimumPrice =
            this.readNumber("minimumPrice");

        this.settings.maximumPrice =
            this.readNumber("maximumPrice");

        this.settings.minimumVolume =
            this.readNumber("minimumVolume");

        this.settings.minimumRelativeVolume =
            this.readNumber(
                "minimumRelativeVolume"
            );

        this.settings.minimumMove =
            this.readNumber("minimumMove");

        this.settings.maximumSpread =
            this.readNumber("maximumSpread");


        this.updateSummary();

    },


    applyFilters() {

        let results = [
            ...StockScanner.data.stocks
        ];


        const s =
            this.settings;


        if (s.minimumPrice !== null) {

            results =
                results.filter(
                    stock =>
                        stock.price >=
                        s.minimumPrice
                );

        }


        if (s.maximumPrice !== null) {

            results =
                results.filter(
                    stock =>
                        stock.price <=
                        s.maximumPrice
                );

        }


        if (s.minimumVolume !== null) {

            results =
                results.filter(
                    stock =>
                        stock.volume >=
                        s.minimumVolume
                );

        }


        if (
            s.minimumRelativeVolume !== null
        ) {

            results =
                results.filter(
                    stock =>
                        stock.relativeVolume >=
                        s.minimumRelativeVolume
                );

        }


        if (s.minimumMove !== null) {

            results =
                results.filter(
                    stock =>
                        Math.abs(stock.change) >=
                        s.minimumMove
                );

        }


        this.render(results);

    },


    updateSummary() {

        const s =
            this.settings;

        const summary =
            document.getElementById(
                "activeScanSummary"
            );


        summary.innerHTML = `

            <span>
                Price:
                ${
                    s.minimumPrice ?? "ANY"
                }
                –
                ${
                    s.maximumPrice ?? "ANY"
                }
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

    }

};
