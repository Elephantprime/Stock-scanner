/* =========================================================
   STOCK SCANNER — LIVE MARKET SCANNER

   Data source:
   StockScanner.marketService.getMovers()

   Responsibilities:
   - Receive cleaned live mover data
   - Apply USER scanner preferences
   - Rank usable candidates
   - Render scanner results
   - Refresh live data periodically

   NO DEMO DATA.
   ========================================================= */

window.StockScanner =
    window.StockScanner || {};


StockScanner.scanner = {

    stocks: [],

    filteredStocks: [],

    refreshTimer: null,

    refreshing: false,


    /* =====================================================
       DEFAULT USER SCAN

       These are preferences — not API validity rules.

       They can be changed from Scan Settings.
    ===================================================== */

    settings: {

        minimumPrice:
            1,

        maximumPrice:
            null,

        minimumVolume:
            100000,

        /*
         RVOL remains disabled until we have legitimate
         historical average-volume calculations.
        */

        minimumRelativeVolume:
            null,

        minimumMove:
            2,

        maximumSpread:
            10

    },


    /* =====================================================
       INITIALIZE
    ===================================================== */

    async init() {

        this.bindSettings();

        this.populateSettingsInputs();

        this.updateSummary();

        await this.refresh();


        /*
         Keep the scanner alive.

         Thirty seconds is frequent enough for this
         Alpaca mover-based discovery layer without
         hammering the API.
        */

        this.startAutoRefresh();

    },


    /* =====================================================
       AUTO REFRESH
    ===================================================== */

    startAutoRefresh() {

        if (
            this.refreshTimer
        ) {

            clearInterval(
                this.refreshTimer
            );

        }


        this.refreshTimer =
            setInterval(
                () => {

                    /*
                     Don't burn requests while the browser
                     tab is hidden.
                    */

                    if (
                        document.hidden
                    ) {

                        return;

                    }


                    this.refresh();

                },
                30000
            );

    },


    /* =====================================================
       REFRESH LIVE SCANNER
    ===================================================== */

    async refresh() {

        /*
         Prevent overlapping scanner requests.
        */

        if (
            this.refreshing
        ) {

            return;

        }


        this.refreshing =
            true;


        /*
         Keep existing rows visible during automatic
         refreshes.

         Only show the loading row when we have no
         scanner data yet.
        */

        if (
            !this.stocks.length
        ) {

            this.setStatus(
                "LOADING"
            );


            this.renderLoading();

        }


        try {

            const stocks =
                await StockScanner
                    .marketService
                    .getMovers({

                        top: 40

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


            /*
             If we already have valid scanner data,
             don't erase the entire screen because one
             refresh failed.

             Mark the scanner error but preserve the
             previous results.
            */

            this.setStatus(
                "ERROR"
            );


            if (
                !this.stocks.length
            ) {

                this.filteredStocks = [];


                this.renderError(

                    error?.message ||
                    "Live scanner unavailable."

                );

            }

        }
        finally {

            this.refreshing =
                false;

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


        /*
         DATA QUALITY

         movers.js already removes truly stale data.

         CHECK rows are retained because an unusual
         market move is not automatically invalid.

         We rank CHECK below clean data later.
        */

        results =
            results.filter(
                stock => {

                    return (
                        stock &&
                        stock.symbol &&
                        this.numberOrNull(
                            stock.price
                        ) !== null
                    );

                }
            );


        /* ---------------- PRICE ---------------- */

        if (
            settings.minimumPrice !== null
        ) {

            results =
                results.filter(
                    stock => {

                        const price =
                            this.numberOrNull(
                                stock.price
                            );


                        return (
                            price !== null &&
                            price >=
                            settings.minimumPrice
                        );

                    }
                );

        }


        if (
            settings.maximumPrice !== null
        ) {

            results =
                results.filter(
                    stock => {

                        const price =
                            this.numberOrNull(
                                stock.price
                            );


                        return (
                            price !== null &&
                            price <=
                            settings.maximumPrice
                        );

                    }
                );

        }


        /* ---------------- VOLUME ---------------- */

        if (
            settings.minimumVolume !== null
        ) {

            results =
                results.filter(
                    stock => {

                        const volume =
                            this.numberOrNull(
                                stock.volume
                            );


                        return (
                            volume !== null &&
                            volume >=
                            settings.minimumVolume
                        );

                    }
                );

        }


        /* ---------------- RVOL ----------------

           We do NOT fake relative volume.

           If the user manually activates this filter
           before RVOL history is implemented, symbols
           without a real RVOL value correctly fail.
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


        /* ---------------- DAILY MOVE ---------------- */

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


        /* ---------------- SPREAD ---------------- */

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


                        /*
                         If we requested a spread limit,
                         a symbol with no valid bid/ask
                         cannot prove that it passes.
                        */

                        return (
                            spread !== null &&
                            spread <=
                            settings.maximumSpread
                        );

                    }
                );

        }


        /* =================================================
           RANKING

           1. Clean data before CHECK data
           2. LIVE before LAST SESSION / UNKNOWN
           3. Larger percentage move
           4. Higher volume as tie breaker
        ================================================= */

        results.sort(
            (a, b) => {

                const qualityDifference =
                    this.qualityRank(
                        a.dataQuality
                    ) -
                    this.qualityRank(
                        b.dataQuality
                    );


                if (
                    qualityDifference !== 0
                ) {

                    return qualityDifference;

                }


                const freshnessDifference =
                    this.freshnessRank(
                        a.freshness ||
                        a.setupStatus
                    ) -
                    this.freshnessRank(
                        b.freshness ||
                        b.setupStatus
                    );


                if (
                    freshnessDifference !== 0
                ) {

                    return freshnessDifference;

                }


                const moveA =
                    Math.abs(
                        this.numberOrNull(
                            a.changePercent
                        ) || 0
                    );


                const moveB =
                    Math.abs(
                        this.numberOrNull(
                            b.changePercent
                        ) || 0
                    );


                if (
                    moveA !== moveB
                ) {

                    return (
                        moveB -
                        moveA
                    );

                }


                const volumeA =
                    this.numberOrNull(
                        a.volume
                    ) || 0;


                const volumeB =
                    this.numberOrNull(
                        b.volume
                    ) || 0;


                return (
                    volumeB -
                    volumeA
                );

            }
        );


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


                const quality =
                    String(
                        stock.dataQuality ||
                        "OK"
                    ).toUpperCase();


                const freshness =
                    String(
                        stock.freshness ||
                        stock.setupStatus ||
                        "UNKNOWN"
                    ).toUpperCase();


                /*
                 Keep STATUS meaningful.

                 Examples:
                 LIVE
                 LAST SESSION
                 LIVE · CHECK
                */

                let status =
                    freshness;


                if (
                    quality === "CHECK"
                ) {

                    status +=
                        " · CHECK";

                }


                row.innerHTML = `

                    <td>
                        <strong>
                            ${this.escapeHTML(
                                stock.symbol
                            )}
                        </strong>
                    </td>

                    <td>
                        ${
                            price !== null
                                ? this.formatPrice(
                                    price
                                  )
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

                    <td class="${
                        quality === "CHECK"
                            ? "warning"
                            : ""
                    }">

                        ${this.escapeHTML(
                            status
                        )}

                    </td>
                `;


                row.addEventListener(
                    "click",
                    () => {

                        if (
                            StockScanner.ticker &&
                            typeof StockScanner
                                .ticker
                                .select ===
                                "function"
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
            async () => {

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


                /*
                 Immediately get a fresh mover snapshot
                 after changing scanner preferences.
                */

                await this.refresh();

            }
        );

    },


    /*
     Put our defaults into the actual drawer inputs so
     the UI and scanner state cannot disagree.
    */

    populateSettingsInputs() {

        this.writeInput(
            "minimumPrice",
            this.settings.minimumPrice
        );


        this.writeInput(
            "maximumPrice",
            this.settings.maximumPrice
        );


        this.writeInput(
            "minimumVolume",
            this.settings.minimumVolume
        );


        this.writeInput(
            "minimumRelativeVolume",
            this.settings.minimumRelativeVolume
        );


        this.writeInput(
            "minimumMove",
            this.settings.minimumMove
        );


        this.writeInput(
            "maximumSpread",
            this.settings.maximumSpread
        );

    },


    writeInput(
        id,
        value
    ) {

        const element =
            document.getElementById(
                id
            );


        if (!element) {
            return;
        }


        element.value =
            value === null
                ? ""
                : String(value);

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
            String(
                element.value || ""
            ).trim();


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
                ${
                    s.minimumRelativeVolume ??
                    "OFF"
                }
            </span>

            <span>
                Volume:
                ${
                    s.minimumVolume !== null
                        ? this.formatVolume(
                            s.minimumVolume
                          )
                        : "ANY"
                }
            </span>

            <span>
                Move:
                ${
                    s.minimumMove !== null
                        ? s.minimumMove + "%"
                        : "ANY"
                }
            </span>

            <span>
                Spread:
                ${
                    s.maximumSpread !== null
                        ? "≤ " +
                          s.maximumSpread +
                          "%"
                        : "ANY"
                }
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
       RANK HELPERS
    ===================================================== */

    qualityRank(
        quality
    ) {

        const value =
            String(
                quality ||
                "OK"
            ).toUpperCase();


        if (
            value === "OK"
        ) {

            return 0;

        }


        if (
            value === "CHECK"
        ) {

            return 1;

        }


        return 2;

    },


    freshnessRank(
        freshness
    ) {

        const value =
            String(
                freshness ||
                ""
            ).toUpperCase();


        if (
            value === "LIVE"
        ) {

            return 0;

        }


        if (
            value === "LAST SESSION"
        ) {

            return 1;

        }


        return 2;

    },


    /* =====================================================
       FORMATTERS
    ===================================================== */

    formatPrice(price) {

        const number =
            this.numberOrNull(
                price
            );


        if (
            number === null
        ) {

            return "---";

        }


        /*
         Preserve precision for low-priced stocks.
        */

        if (
            number < 1
        ) {

            return (
                "$" +
                number.toFixed(4)
            );

        }


        return (
            "$" +
            number.toFixed(2)
        );

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
