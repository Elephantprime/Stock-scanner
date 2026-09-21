/* =========================================================
   STOCK SCANNER APPLICATION CONTROLLER
   ========================================================= */

StockScanner.app = {

    async init() {

        this.startClock();

        this.bindDrawers();

        this.bindWatchlistNavigation();


        StockScanner.patterns.init();

StockScanner.watchlist.init();

StockScanner.search.init();
       
await Promise.all([
    StockScanner.marketPulse.init(),
    StockScanner.news.init(),
    StockScanner.scanner.init()
]);

        /*
         Start with first scanner candidate selected.
        */

        if (
            StockScanner.data.stocks.length
        ) {

            StockScanner.ticker.select(
                StockScanner.data.stocks[0]
                    .symbol
            );

        }

    },


    startClock() {

        const clock =
            document.getElementById(
                "marketClock"
            );


        const update = () => {

            const now =
                new Date();


            clock.textContent =
                now.toLocaleTimeString(
                    [],
                    {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit"
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
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () =>
                        this.closeDrawers()
                );

            });


        document
            .getElementById(
                "drawerBackdrop"
            )
            .addEventListener(
                "click",
                () =>
                    this.closeDrawers()
            );


        document.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Escape"
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

        document
            .getElementById(buttonId)
            .addEventListener(
                "click",
                () =>
                    this.openDrawer(
                        drawerId
                    )
            );

    },


    openDrawer(drawerId) {

        this.closeDrawers();


        document
            .getElementById(drawerId)
            .classList.remove(
                "hidden"
            );


        document
            .getElementById(
                "drawerBackdrop"
            )
            .classList.remove(
                "hidden"
            );

    },


    closeDrawers() {

        document
            .querySelectorAll(".drawer")
            .forEach(drawer => {

                drawer.classList.add(
                    "hidden"
                );

            });


        document
            .getElementById(
                "drawerBackdrop"
            )
            .classList.add(
                "hidden"
            );

    },


    bindWatchlistNavigation() {

        document
            .getElementById(
                "watchlistPrev"
            )
            .addEventListener(
                "click",
                () =>
                    this.moveWatchlist(-1)
            );


        document
            .getElementById(
                "watchlistNext"
            )
            .addEventListener(
                "click",
                () =>
                    this.moveWatchlist(1)
            );

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


        current += direction;


        if (current < 0) {

            current =
                tabs.length - 1;

        }


        if (
            current >= tabs.length
        ) {

            current = 0;

        }


        tabs[current].click();

    }

};


/* =========================================================
   START APPLICATION
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        StockScanner.app.init();

    }
);
