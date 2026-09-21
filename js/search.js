/* =========================================================
   STOCK SCANNER — TICKER SEARCH

   PURPOSE:
   - Search known stocks by ticker or company name
   - Provide autocomplete suggestions
   - Allow direct ticker lookup
   - Send selected ticker to ticker.js
   - Works with our LIVE quote service
   ========================================================= */

window.StockScanner = window.StockScanner || {};


StockScanner.search = {

    input: null,
    button: null,
    results: null,

    selectedIndex: -1,
    matches: [],


    /* =====================================================
       INITIALIZE
    ===================================================== */

    init() {

        this.input =
            document.getElementById(
                "tickerSearch"
            );

        this.button =
            document.getElementById(
                "tickerSearchButton"
            );

        this.results =
            document.getElementById(
                "tickerSearchResults"
            );


        if (
            !this.input ||
            !this.button ||
            !this.results
        ) {

            console.warn(
                "[Search] Search UI not found."
            );

            return;

        }


        this.bindEvents();

    },


    /* =====================================================
       EVENTS
    ===================================================== */

    bindEvents() {

        this.input.addEventListener(
            "input",
            () => {

                this.handleInput();

            }
        );


        this.input.addEventListener(
            "keydown",
            event => {

                this.handleKeydown(
                    event
                );

            }
        );


        this.button.addEventListener(
            "click",
            () => {

                this.submit();

            }
        );


        /*
         Close suggestions when tapping outside search.
        */

        document.addEventListener(
            "click",
            event => {

                const wrapper =
                    event.target.closest(
                        ".ticker-search-wrapper"
                    );


                if (!wrapper) {

                    this.hideResults();

                }

            }
        );

    },


    /* =====================================================
       INPUT / AUTOCOMPLETE
    ===================================================== */

    handleInput() {

        const query =
            this.input.value
                .trim()
                .toUpperCase();


        this.selectedIndex = -1;


        if (!query) {

            this.hideResults();

            return;

        }


        this.matches =
            this.findMatches(
                query
            );


        this.renderResults();

    },


    findMatches(query) {

        const stocks =
            StockScanner.data?.stocks ||
            [];


        return stocks
            .filter(stock => {

                const symbol =
                    String(
                        stock.symbol || ""
                    ).toUpperCase();


                const company =
                    String(
                        stock.company || ""
                    ).toUpperCase();


                return (
                    symbol.includes(query) ||
                    company.includes(query)
                );

            })
            .sort((a, b) => {

                /*
                 Exact ticker match first.
                */

                if (
                    a.symbol.toUpperCase() ===
                    query
                ) {
                    return -1;
                }

                if (
                    b.symbol.toUpperCase() ===
                    query
                ) {
                    return 1;
                }


                /*
                 Tickers beginning with query next.
                */

                const aStarts =
                    a.symbol
                        .toUpperCase()
                        .startsWith(query);

                const bStarts =
                    b.symbol
                        .toUpperCase()
                        .startsWith(query);


                if (
                    aStarts &&
                    !bStarts
                ) {
                    return -1;
                }


                if (
                    bStarts &&
                    !aStarts
                ) {
                    return 1;
                }


                return a.symbol.localeCompare(
                    b.symbol
                );

            })
            .slice(
                0,
                8
            );

    },


    /* =====================================================
       RENDER AUTOCOMPLETE
    ===================================================== */

    renderResults() {

        this.results.innerHTML = "";


        const typedSymbol =
            StockScanner.marketService
                .normalizeSymbol(
                    this.input.value
                );


        /*
         Known/demo matches.
        */

        this.matches.forEach(
            (stock, index) => {

                const item =
                    document.createElement(
                        "button"
                    );


                item.type =
                    "button";


                item.className =
                    "ticker-search-result";


                item.dataset.index =
                    index;


                item.innerHTML = `

                    <span class="search-result-symbol">
                        ${stock.symbol}
                    </span>

                    <span class="search-result-company">
                        ${stock.company || ""}
                    </span>

                    <span class="search-result-price">
                        ${
                            stock.price != null
                                ? "$" +
                                  Number(
                                      stock.price
                                  ).toFixed(2)
                                : ""
                        }
                    </span>
                `;


                item.addEventListener(
                    "click",
                    () => {

                        this.select(
                            stock.symbol
                        );

                    }
                );


                this.results.appendChild(
                    item
                );

            }
        );


        /*
         This allows arbitrary ticker lookup.

         Example:
         User types AAPL even though AAPL isn't currently
         present in demo-data.js.

         The selection goes to ticker.js, which asks the
         live quote service for AAPL.
        */

        const exactMatch =
            this.matches.some(
                stock =>
                    stock.symbol
                        .toUpperCase() ===
                    typedSymbol
            );


        if (
            typedSymbol &&
            !exactMatch
        ) {

            const lookup =
                document.createElement(
                    "button"
                );


            lookup.type =
                "button";


            lookup.className =
                "ticker-search-result ticker-direct-lookup";


            lookup.innerHTML = `

                <span class="search-result-symbol">
                    ${typedSymbol}
                </span>

                <span class="search-result-company">
                    Look up ticker
                </span>

                <span class="search-result-live">
                    LIVE
                </span>
            `;


            lookup.addEventListener(
                "click",
                () => {

                    this.select(
                        typedSymbol
                    );

                }
            );


            this.results.appendChild(
                lookup
            );

        }


        if (
            !this.results.children.length
        ) {

            this.hideResults();

            return;

        }


        this.results.classList.remove(
            "hidden"
        );

    },


    /* =====================================================
       KEYBOARD CONTROL
    ===================================================== */

    handleKeydown(event) {

        const items =
            Array.from(
                this.results.querySelectorAll(
                    ".ticker-search-result"
                )
            );


        if (
            event.key === "ArrowDown"
        ) {

            if (!items.length) {
                return;
            }


            event.preventDefault();


            this.selectedIndex++;


            if (
                this.selectedIndex >=
                items.length
            ) {

                this.selectedIndex = 0;

            }


            this.highlight(
                items
            );

            return;

        }


        if (
            event.key === "ArrowUp"
        ) {

            if (!items.length) {
                return;
            }


            event.preventDefault();


            this.selectedIndex--;


            if (
                this.selectedIndex < 0
            ) {

                this.selectedIndex =
                    items.length - 1;

            }


            this.highlight(
                items
            );

            return;

        }


        if (
            event.key === "Enter"
        ) {

            event.preventDefault();


            if (
                this.selectedIndex >= 0 &&
                items[
                    this.selectedIndex
                ]
            ) {

                items[
                    this.selectedIndex
                ].click();

                return;

            }


            this.submit();

            return;

        }


        if (
            event.key === "Escape"
        ) {

            this.hideResults();

            this.input.blur();

        }

    },


    highlight(items) {

        items.forEach(
            (
                item,
                index
            ) => {

                item.classList.toggle(
                    "active",
                    index ===
                    this.selectedIndex
                );

            }
        );

    },


    /* =====================================================
       SUBMIT DIRECT SEARCH
    ===================================================== */

    submit() {

        const symbol =
            StockScanner.marketService
                .normalizeSymbol(
                    this.input.value
                );


        if (!symbol) {
            return;
        }


        /*
         If input exactly matches a known company ticker,
         use it.

         Otherwise treat input as a ticker symbol.
        */

        const exact =
            (
                StockScanner.data?.stocks ||
                []
            ).find(
                stock =>
                    stock.symbol
                        .toUpperCase() ===
                    symbol
            );


        this.select(
            exact
                ? exact.symbol
                : symbol
        );

    },


    /* =====================================================
       SELECT STOCK
    ===================================================== */

    async select(symbol) {

        symbol =
            StockScanner.marketService
                .normalizeSymbol(
                    symbol
                );


        if (!symbol) {
            return;
        }


        this.input.value =
            symbol;


        this.hideResults();


        this.setLoading(
            true
        );


        try {

            await StockScanner.ticker.select(
                symbol
            );


            /*
             Scroll selected-stock workspace into view
             on phones/tablets.

             Desktop layout won't meaningfully move.
            */

            const panel =
                document.querySelector(
                    ".ticker-panel"
                );


            if (
                panel &&
                window.innerWidth <= 1100
            ) {

                panel.scrollIntoView({
                    behavior:
                        "smooth",

                    block:
                        "start"
                });

            }

        }
        catch (error) {

            console.error(
                "[Search]",
                error
            );

        }
        finally {

            this.setLoading(
                false
            );

        }

    },


    /* =====================================================
       SEARCH BUTTON STATE
    ===================================================== */

    setLoading(loading) {

        this.button.disabled =
            loading;


        this.button.textContent =
            loading
                ? "LOADING..."
                : "SEARCH";

    },


    /* =====================================================
       HIDE RESULTS
    ===================================================== */

    hideResults() {

        this.results.classList.add(
            "hidden"
        );


        this.selectedIndex = -1;

    }

};
