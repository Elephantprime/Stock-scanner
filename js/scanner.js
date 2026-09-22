/* =========================================================
   STOCK SCANNER — LIVE MARKET SCANNER

   Data source:
   StockScanner.marketService.getMovers()

   NO DEMO DATA.
   ========================================================= */

window.StockScanner =
    window.StockScanner || {};


StockScanner.scanner = {

    stocks: [],

    filteredStocks: [],


    settings: {

        minimumPrice:
            null,

        maximumPrice:
            null,

        minimumVolume:
            null,

        minimumRelativeVolume:
            null,

        minimumMove:
            null,

        maximumSpread:
            null

    },


    /* =====================================================
       INITIALIZE
    ===================================================== */

    async init() {

        this.bindSettings();

        this.updateSummary();

        await this.refresh();

    },


    /* =====================================================
       REFRESH LIVE SCANNER
    ===================================================== */

    async refresh() {

        this.setStatus(
            "LOADING"
        );


        this.renderLoading();


        try {

            const stocks =
                await StockScanner
                    .marketService
                    .getMovers({

                        top: 25

                    });


            this.stocks =
                Array.isArray(stocks)
                    ? stocks
                    : [];


            this.applyFilters();


            this.setStatus(
                "LIVE"
            );

        }
        catch (error) {

            console.error(
                "[Scanner]",
                error
            );


            this.stocks = [];

            this.filteredStocks = [];


            this.setStatus(
                "ERROR"
            );


            this.renderError(

                error?.message ||
                "Live scanner unavailable."

            );

        }

    },


    /* =====================================================
       FILTERS
    ===================================================== */

    applyFilters() {

        const settings =
            this.settings;


        let results =
            [...this.stocks];


        if (
            settings.minimumPrice !== null
        ) {

            results =
                results.filter(
                    stock =>

                        this.numberOrNull(
                            stock.price
                        ) !== null &&

                        Number(
                            stock.price
                        ) >=
                        settings.minimumPrice
                );

        }


        if (
            settings.maximumPrice !== null
        ) {

            results =
                results.filter(
                    stock =>

                        this.numberOrNull(
                            stock.price
                        ) !== null &&

                        Number(
                            stock.price
                        ) <=
                        settings.maximumPrice
                );

        }


        if (
            settings.minimumVolume !== null
        ) {

            results =
                results.filter(
                    stock =>

                        this.numberOrNull(
                            stock.volume
                        ) !== null &&

                        Number(
                            stock.volume
                        ) >=
                        settings.minimumVolume
                );

        }


        /*
         RVOL is not yet calculated.

         If the user activates an RVOL filter, stocks
         without actual RVOL data correctly fail it.
        */

        if (
            settings.minimumRelativeVolume !==
            null
        ) {

            results =
                results.filter(
                    stock => {

                        const rvol =
                            this.numberOrNull(
                                stock.relativeVolume
                            );


                        return (
                            rvol !== null &&
                            rvol >=
                            settings.minimumRelativeVolume
                        );

                    }
                );

        }


        if (
            settings.minimumMove !== null
        ) {

            results =
                results.filter(
                    stock => {

                        const move =
                            this.numberOrNull(
                                stock.changePercent
                            );


                        return (
                            move !== null &&
                            Math.abs(move) >=
                            settings.minimumMove
                        );

                    }
                );

        }


        /*
         This setting existed previously but was not
         actually being applied.
        */

        if (
            settings.maximumSpread !== null
        ) {

            results =
                results.filter(
                    stock => {

                        const spread =
                            this.numberOrNull(
                                stock.spreadPercent
                            );


                        return (
                            spread !== null &&
                            spread <=
                            settings.maximumSpread
                        );

                    }
                );

        }


        this.filteredStocks =
            results;


        this.render(
            results
        );

    },


    /* =====================================================
       RENDER
    ===================================================== */

    render(stocks) {

        const body =
            document.getElementById(
                "scannerResults"
            );


        if (!body) {
            return;
        }


        body.innerHTML = "";


        if (!stocks.length) {

            body.innerHTML = `

                <tr class="empty-row">

                    <td colspan="8">
                        No live stocks match the current scan settings.
                    </td>

                </tr>
            `;


            return;

        }


        stocks.forEach(
            stock => {

                const row =
                    document.createElement(
                        "tr"
                    );


                row.dataset.symbol =
                    stock.symbol;


                const price =
                    this.numberOrNull(
                        stock.price
                    );


                const change =
                    this.numberOrNull(
                        stock.changePercent
                    );


                const rvol =
                    this.numberOrNull(
                        stock.relativeVolume
                    );


                row.innerHTML = `

                    <td>
                        <strong>
                            ${this.escapeHTML(stock.symbol)}
                        </strong>
                    </td>

                    <td>
                        ${
                            price !== null
                                ? "$" +
                                  price.toFixed(2)
                                : "---"
                        }
                    </td>

                    <td class="${
                        change === null
                            ? ""
                            : change >= 0
                                ? "positive"
                                : "negative"
                    }">

                        ${
                            change !== null
                                ? (
                                    change >= 0
                                        ? "+"
                                        : ""
                                  ) +
                                  change.toFixed(2) +
                                  "%"
                                : "---"
                        }

                    </td>

                    <td>

                        ${
                            rvol !== null
                                ? rvol.toFixed(1) +
                                  "×"
                                : "---"
                        }

                    </td>

                    <td>

                        ${this.formatVolume(
                            stock.volume
                        )}

                    </td>

                    <td class="accent">

                        ${this.escapeHTML(
                            stock.setup ||
                            "Analyzing"
                        )}

                    </td>

                    <td>

                        ${this.escapeHTML(
                            stock.catalyst ||
                            "---"
                        )}

                    </td>

                    <td>

                        ${this.escapeHTML(
                            stock.setupStatus ||
                            "LIVE"
                        )}

                    </td>
                `;


                row.addEventListener(
                    "click",
                    () => {

                        if (
                            StockScanner.ticker
                        ) {

                            StockScanner.ticker
                                .select(
                                    stock.symbol
                                );

                        }

                    }
                );


                body.appendChild(
                    row
                );

            }
        );

    },


    /* =====================================================
       LOADING / ERROR
    ===================================================== */

    renderLoading() {

        const body =
            document.getElementById(
                "scannerResults"
            );


        if (!body) {
            return;
        }


        body.innerHTML = `

            <tr class="empty-row">

                <td colspan="8">
                    Loading live market scanner...
                </td>

            </tr>
        `;

    },


    renderError(message) {

        const body =
            document.getElementById(
                "scannerResults"
            );


        if (!body) {
            return;
        }


        body.innerHTML = `

            <tr class="empty-row">

                <td colspan="8">
                    LIVE SCANNER UNAVAILABLE:
                    ${this.escapeHTML(message)}
                </td>

            </tr>
        `;

    },


    /* =====================================================
       SETTINGS
    ===================================================== */

    bindSettings() {

        const button =
            document.getElementById(
                "applyScanSettings"
            );


        if (!button) {
            return;
        }


        button.addEventListener(
            "click",
            () => {

                this.readSettings();

                this.applyFilters();


                if (
                    StockScanner.app &&
                    typeof StockScanner.app
                        .closeDrawers ===
                        "function"
                ) {

                    StockScanner.app
                        .closeDrawers();

                }

            }
        );

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


    readNumber(id) {

        const element =
            document.getElementById(
                id
            );


        if (!element) {
            return null;
        }


        const value =
            element.value;


        if (
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


    updateSummary() {

        const summary =
            document.getElementById(
                "activeScanSummary"
            );


        if (!summary) {
            return;
        }


        const s =
            this.settings;


        summary.innerHTML = `

            <span>
                Price:
                ${s.minimumPrice ?? "ANY"}
                –
                ${s.maximumPrice ?? "ANY"}
            </span>

            <span>
                RelVol:
                ${s.minimumRelativeVolume ?? "ANY"}
            </span>

            <span>
                Volume:
                ${s.minimumVolume ?? "ANY"}
            </span>

            <span>
                Move:
                ${s.minimumMove ?? "ANY"}%
            </span>

            <span>
                Spread:
                ${s.maximumSpread ?? "ANY"}%
            </span>

            <span>
                Setup: ALL
            </span>
        `;

    },


    /* =====================================================
       STATUS
    ===================================================== */

    setStatus(status) {

        const elements =
            document.querySelectorAll(
                "#systemStatus span"
            );


        elements.forEach(
            element => {

                if (
                    !element.textContent
                        .trim()
                        .startsWith(
                            "SCANNER"
                        )
                ) {

                    return;

                }


                const indicator =
                    element.querySelector(
                        "b"
                    );


                if (!indicator) {
                    return;
                }


                indicator.textContent =
                    status;


                indicator.className =
                    (
                        status === "LIVE" ||
                        status === "READY"
                    )
                        ? "status-ready"
                        : "status-off";

            }
        );

    },


    /* =====================================================
       HELPERS
    ===================================================== */

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


    escapeHTML(value) {

        return String(
            value ?? ""
        )
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );

    }

};
