/* =========================================================
   STOCK SCANNER APPLICATION CONTROLLER
   ========================================================= */

window.StockScanner =
    window.StockScanner || {};


StockScanner.app = {

    async init() {

        this.startClock();

        this.bindDrawers();

        this.bindWatchlistNavigation();


        StockScanner.patterns.init();

        StockScanner.watchlist.init();

        StockScanner.search.init();

        StockScanner.chart.init();


        await Promise.all([

            StockScanner.marketPulse.init(),

            StockScanner.news.init(),

            StockScanner.scanner.init()

        ]);


        /*
         Select the first LIVE scanner result.

         No demo-stock dependency.
        */

        const firstLiveStock =
            StockScanner.scanner
                ?.filteredStocks?.[0] ||
            StockScanner.scanner
                ?.stocks?.[0] ||
            null;


        if (
            firstLiveStock?.symbol
        ) {

            StockScanner.ticker.select(
                firstLiveStock.symbol
            );

        }

    },


    startClock() {

        const clock =
            document.getElementById(
                "marketClock"
            );


        if (!clock) {
            return;
        }


        const update =
            () => {

                const now =
                    new Date();


                clock.textContent =
                    now.toLocaleTimeString(
                        [],
                        {

                            hour:
                                "2-digit",

                            minute:
                                "2-digit",

                            second:
                                "2-digit"

                        }
                    );

            };


        update();


        setInterval(
            update,
            1000
        );

    },


    bindDrawers() {

        this.bindDrawerButton(
            "scanSettingsButton",
            "scanSettingsDrawer"
        );


        this.bindDrawerButton(
            "patternsButton",
            "patternsDrawer"
        );


        this.bindDrawerButton(
            "toolsButton",
            "toolsDrawer"
        );


        document
            .querySelectorAll(
                "[data-close-drawer]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () =>
                            this.closeDrawers()
                    );

                }
            );


        const backdrop =
            document.getElementById(
                "drawerBackdrop"
            );


        if (backdrop) {

            backdrop.addEventListener(
                "click",
                () =>
                    this.closeDrawers()
            );

        }


        document.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                    "Escape"
                ) {

                    this.closeDrawers();

                }

            }
        );

    },


    bindDrawerButton(
        buttonId,
        drawerId
    ) {

        const button =
            document.getElementById(
                buttonId
            );


        if (!button) {
            return;
        }


        button.addEventListener(
            "click",
            () =>
                this.openDrawer(
                    drawerId
                )
        );

    },


    openDrawer(drawerId) {

        this.closeDrawers();


        const drawer =
            document.getElementById(
                drawerId
            );


        const backdrop =
            document.getElementById(
                "drawerBackdrop"
            );


        if (drawer) {

            drawer.classList.remove(
                "hidden"
            );

        }


        if (backdrop) {

            backdrop.classList.remove(
                "hidden"
            );

        }

    },


    closeDrawers() {

        document
            .querySelectorAll(
                ".drawer"
            )
            .forEach(
                drawer => {

                    drawer.classList.add(
                        "hidden"
                    );

                }
            );


        const backdrop =
            document.getElementById(
                "drawerBackdrop"
            );


        if (backdrop) {

            backdrop.classList.add(
                "hidden"
            );

        }

    },


    bindWatchlistNavigation() {

        const previous =
            document.getElementById(
                "watchlistPrev"
            );


        const next =
            document.getElementById(
                "watchlistNext"
            );


        if (previous) {

            previous.addEventListener(
                "click",
                () =>
                    this.moveWatchlist(
                        -1
                    )
            );

        }


        if (next) {

            next.addEventListener(
                "click",
                () =>
                    this.moveWatchlist(
                        1
                    )
            );

        }

    },


    moveWatchlist(direction) {

        const tabs =
            Array.from(
                document.querySelectorAll(
                    ".watchlist-tab"
                )
            );


        if (!tabs.length) {
            return;
        }


        let current =
            tabs.findIndex(
                tab =>
                    tab.dataset.watchlist ===
                    StockScanner.watchlist.active
            );


        current +=
            direction;


        if (
            current < 0
        ) {

            current =
                tabs.length - 1;

        }


        if (
            current >=
            tabs.length
        ) {

            current =
                0;

        }


        tabs[
            current
        ].click();

    }

};


document.addEventListener(
    "DOMContentLoaded",
    () => {

        StockScanner.app.init();

    }
);
