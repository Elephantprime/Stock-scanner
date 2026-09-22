/* =========================================================
   STOCK SCANNER — LIVE TICKER SEARCH

   - Autocomplete from current live scanner universe
   - Direct arbitrary ticker lookup
   - No demo stock dependency
   ========================================================= */

window.StockScanner =
    window.StockScanner || {};


StockScanner.search = {

    input:
        null,

    button:
        null,

    results:
        null,

    selectedIndex:
        -1,

    matches:
        [],


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


    bindEvents() {

        this.input.addEventListener(
            "input",
            () =>
                this.handleInput()
        );


        this.input.addEventListener(
            "keydown",
            event =>
                this.handleKeydown(
                    event
                )
        );


        this.button.addEventListener(
            "click",
            () =>
                this.submit()
        );


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


    handleInput() {

        const query =
            this.input.value
                .trim()
                .toUpperCase();


        this.selectedIndex =
            -1;


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
            StockScanner.scanner
                ?.stocks ||
            [];


        return stocks
            .filter(
                stock => {

                    const symbol =
                        String(
                            stock.symbol ||
                            ""
                        ).toUpperCase();


                    return symbol.includes(
                        query
                    );

                }
            )
            .sort(
                (a, b) => {

                    const aSymbol =
                        String(
                            a.symbol ||
                            ""
                        ).toUpperCase();


                    const bSymbol =
                        String(
                            b.symbol ||
                            ""
                        ).toUpperCase();


                    if (
                        aSymbol ===
                        query
                    ) {

                        return -1;

                    }


                    if (
                        bSymbol ===
                        query
                    ) {

                        return 1;

                    }


                    const aStarts =
                        aSymbol.startsWith(
                            query
                        );


                    const bStarts =
                        bSymbol.startsWith(
                            query
                        );


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


                    return aSymbol
                        .localeCompare(
                            bSymbol
                        );

                }
            )
            .slice(
                0,
                8
            );

    },


    renderResults() {

        this.results.innerHTML =
            "";


        const typedSymbol =
            StockScanner
                .marketService
                .normalizeSymbol(
                    this.input.value
                );


        this.matches.forEach(
            (
                stock,
                index
            ) => {

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


                const price =
                    this.numberOrNull(
                        stock.price
                    );


                item.innerHTML = `

                    <span class="search-result-symbol">
                        ${this.escapeHTML(stock.symbol)}
                    </span>

                    <span class="search-result-company">
                        Live scanner result
                    </span>

                    <span class="search-result-price">
                        ${
                            price !== null
                                ? this.formatPrice(
                                    price
                                )
                                : ""
                        }
                    </span>
                `;


                item.addEventListener(
                    "click",
                    () =>
                        this.select(
                            stock.symbol
                        )
                );


                this.results.appendChild(
                    item
                );

            }
        );


        const exactMatch =
            this.matches.some(
                stock =>
                    String(
                        stock.symbol ||
                        ""
                    ).toUpperCase() ===
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
                    ${this.escapeHTML(typedSymbol)}
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
                () =>
                    this.select(
                        typedSymbol
                    )
            );


            this.results.appendChild(
                lookup
            );

        }


        if (
            !this.results.children
                .length
        ) {

            this.hideResults();

            return;

        }


        this.results.classList.remove(
            "hidden"
        );

    },


    handleKeydown(event) {

        const items =
            Array.from(
                this.results
                    .querySelectorAll(
                        ".ticker-search-result"
                    )
            );


        if (
            event.key ===
            "ArrowDown"
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

                this.selectedIndex =
                    0;

            }


            this.highlight(
                items
            );

            return;

        }


        if (
            event.key ===
            "ArrowUp"
        ) {

            if (!items.length) {
                return;
            }


            event.preventDefault();


            this.selectedIndex--;


            if (
                this.selectedIndex <
                0
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
            event.key ===
            "Enter"
        ) {

            event.preventDefault();


            if (
                this.selectedIndex >=
                    0 &&
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
            event.key ===
            "Escape"
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


    submit() {

        const symbol =
            StockScanner
                .marketService
                .normalizeSymbol(
                    this.input.value
                );


        if (!symbol) {
            return;
        }


        this.select(
            symbol
        );

    },


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


        this.input.value =
            symbol;


        this.hideResults();


        this.setLoading(
            true
        );


        try {

            await StockScanner
                .ticker
                .select(
                    symbol
                );


            const panel =
                document.querySelector(
                    ".ticker-panel"
                );


            if (
                panel &&
                window.innerWidth <=
                    1100
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


    setLoading(loading) {

        this.button.disabled =
            loading;


        this.button.textContent =
            loading
                ? "LOADING..."
                : "SEARCH";

    },


    hideResults() {

        this.results.classList.add(
            "hidden"
        );


        this.selectedIndex =
            -1;

    },


    numberOrNull(value) {

        const number =
            Number(value);


        return Number.isFinite(
            number
        )
            ? number
            : null;

    },


    formatPrice(value) {

        if (
            value >= 1
        ) {

            return `$${value.toFixed(2)}`;

        }


        if (
            value >= 0.01
        ) {

            return `$${value.toFixed(3)}`;

        }


        return `$${value.toFixed(4)}`;

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
