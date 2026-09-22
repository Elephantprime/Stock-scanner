/* =========================================================
   STOCK SCANNER — WATCHLIST MANAGER

   Watchlist membership:
   Browser localStorage

   Quote data:
   LIVE market service

   NO DEMO QUOTE DATA.
   ========================================================= */

window.StockScanner =
    window.StockScanner || {};


StockScanner.watchlist = {

    active:
        "main",


    storageKey:
        "stockScanner.watchlists.v1",


    lists: {

        main: [],

        momentum: [],

        swing: []

    },


    quotes:
        {},


    init() {

        this.load();

        this.bindTabs();

        this.bindButtons();

        this.render();

        this.updateButtons();

        this.refreshActive();

    },


    load() {

        try {

            const saved =
                JSON.parse(
                    localStorage.getItem(
                        this.storageKey
                    ) || "null"
                );


            if (
                saved &&
                typeof saved ===
                    "object"
            ) {

                [
                    "main",
                    "momentum",
                    "swing"
                ].forEach(
                    name => {

                        if (
                            Array.isArray(
                                saved[name]
                            )
                        ) {

                            this.lists[
                                name
                            ] =
                                saved[name]
                                    .map(
                                        symbol =>
                                            StockScanner
                                                .marketService
                                                .normalizeSymbol(
                                                    symbol
                                                )
                                    )
                                    .filter(
                                        Boolean
                                    );

                        }

                    }
                );

            }

        }
        catch (error) {

            console.warn(
                "[Watchlist] Unable to load saved watchlists.",
                error
            );

        }

    },


    save() {

        try {

            localStorage.setItem(
                this.storageKey,
                JSON.stringify(
                    this.lists
                )
            );

        }
        catch (error) {

            console.warn(
                "[Watchlist] Unable to save watchlists.",
                error
            );

        }

    },


    bindTabs() {

        document
            .querySelectorAll(
                ".watchlist-tab"
            )
            .forEach(
                tab => {

                    tab.addEventListener(
                        "click",
                        () => {

                            this.switchTo(
                                tab.dataset
                                    .watchlist
                            );

                        }
                    );

                }
            );

    },


    bindButtons() {

        const add =
            document.getElementById(
                "addWatchlistButton"
            );


        const remove =
            document.getElementById(
                "removeWatchlistButton"
            );


        if (add) {

            add.addEventListener(
                "click",
                () =>
                    this.addSelected()
            );

        }


        if (remove) {

            remove.addEventListener(
                "click",
                () =>
                    this.removeSelected()
            );

        }

    },


    switchTo(name) {

        if (
            !this.lists[name]
        ) {

            return;

        }


        this.active =
            name;


        document
            .querySelectorAll(
                ".watchlist-tab"
            )
            .forEach(
                tab => {

                    tab.classList.toggle(
                        "active",
                        tab.dataset
                            .watchlist ===
                            name
                    );

                }
            );


        const activeTab =
            document.querySelector(
                `.watchlist-tab[data-watchlist="${name}"]`
            );


        const title =
            document.getElementById(
                "activeWatchlistTitle"
            );


        if (title) {

            title.textContent =
                activeTab
                    ? activeTab
                        .textContent
                        .trim()
                    : name
                        .toUpperCase();

        }


        this.render();

        this.updateButtons();

        this.refreshActive();

    },


    addSelected() {

        const symbol =
            StockScanner.ticker
                ?.selectedSymbol;


        if (!symbol) {
            return;
        }


        const list =
            this.lists[
                this.active
            ];


        if (
            !list.includes(
                symbol
            )
        ) {

            list.push(
                symbol
            );


            this.save();

        }


        if (
            StockScanner.ticker
                ?.selectedQuote
        ) {

            this.updateQuote(
                StockScanner.ticker
                    .selectedQuote
            );

        }


        this.render();

        this.updateButtons();

        this.refreshSymbol(
            symbol
        );

    },


    removeSelected() {

        const symbol =
            StockScanner.ticker
                ?.selectedSymbol;


        if (!symbol) {
            return;
        }


        this.remove(
            symbol
        );

    },


    remove(symbol) {

        const list =
            this.lists[
                this.active
            ];


        const index =
            list.indexOf(
                symbol
            );


        if (
            index !== -1
        ) {

            list.splice(
                index,
                1
            );


            this.save();

        }


        this.render();

        this.updateButtons();

    },


    contains(symbol) {

        if (!symbol) {
            return false;
        }


        return this.lists[
            this.active
        ].includes(
            symbol
        );

    },


    updateButtons() {

        const symbol =
            StockScanner.ticker
                ?.selectedSymbol;


        const add =
            document.getElementById(
                "addWatchlistButton"
            );


        const remove =
            document.getElementById(
                "removeWatchlistButton"
            );


        if (
            !add ||
            !remove
        ) {

            return;

        }


        if (!symbol) {

            add.disabled =
                true;

            remove.disabled =
                true;

            return;

        }


        const exists =
            this.contains(
                symbol
            );


        add.disabled =
            exists;


        remove.disabled =
            !exists;

    },


    updateQuote(quote) {

        const symbol =
            StockScanner
                .marketService
                .normalizeSymbol(
                    quote?.symbol
                );


        if (!symbol) {
            return;
        }


        this.quotes[
            symbol
        ] = quote;


        if (
            this.lists[
                this.active
            ].includes(
                symbol
            )
        ) {

            this.render();

        }

    },


    async refreshActive() {

        const symbols =
            [
                ...this.lists[
                    this.active
                ]
            ];


        if (!symbols.length) {
            return;
        }


        await Promise.allSettled(

            symbols.map(
                symbol =>
                    this.refreshSymbol(
                        symbol
                    )
            )

        );


        this.render();

    },


    async refreshSymbol(symbol) {

        try {

            const quote =
                await StockScanner
                    .marketService
                    .getQuote(
                        symbol
                    );


            this.quotes[
                symbol
            ] = quote;


            return quote;

        }
        catch (error) {

            console.warn(
                `[Watchlist] ${symbol}`,
                error
            );


            this.quotes[
                symbol
            ] = {

                symbol,

                error:
                    true

            };


            return null;

        }

    },


    render() {

        const body =
            document.getElementById(
                "watchlistBody"
            );


        if (!body) {
            return;
        }


        const symbols =
            this.lists[
                this.active
            ];


        body.innerHTML =
            "";


        const count =
            document.getElementById(
                "watchlistCount"
            );


        if (count) {

            count.textContent =
                `${symbols.length} STOCK${
                    symbols.length === 1
                        ? ""
                        : "S"
                }`;

        }


        if (!symbols.length) {

            body.innerHTML = `

                <tr class="empty-row">

                    <td colspan="7">
                        No stocks in this watchlist.
                    </td>

                </tr>
            `;


            return;

        }


        symbols.forEach(
            symbol => {

                const stock =
                    this.quotes[
                        symbol
                    ];


                const row =
                    document.createElement(
                        "tr"
                    );


                const price =
                    this.numberOrNull(
                        stock?.price
                    );


                const change =
                    this.numberOrNull(
                        stock?.changePercent
                    );


                row.innerHTML = `

                    <td>
                        <strong>
                            ${this.escapeHTML(symbol)}
                        </strong>
                    </td>

                    <td>
                        ${
                            price !== null
                                ? this.formatPrice(
                                    price
                                )
                                : stock?.error
                                    ? "ERROR"
                                    : "LOADING..."
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
                                ? `${
                                    change >= 0
                                        ? "+"
                                        : ""
                                  }${change.toFixed(2)}%`
                                : "---"
                        }

                    </td>

                    <td>
                        ---
                    </td>

                    <td>
                        LIVE
                    </td>

                    <td>
                        ---
                    </td>

                    <td>

                        <button
                            class="danger-button watchlist-row-remove"
                            data-symbol="${this.escapeHTML(symbol)}"
                        >
                            REMOVE
                        </button>

                    </td>
                `;


                row.addEventListener(
                    "click",
                    event => {

                        if (
                            event.target.closest(
                                ".watchlist-row-remove"
                            )
                        ) {

                            return;

                        }


                        StockScanner.ticker
                            .select(
                                symbol
                            );

                    }
                );


                const removeButton =
                    row.querySelector(
                        ".watchlist-row-remove"
                    );


                if (removeButton) {

                    removeButton.addEventListener(
                        "click",
                        event => {

                            event.stopPropagation();


                            this.remove(
                                symbol
                            );

                        }
                    );

                }


                body.appendChild(
                    row
                );

            }
        );

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
