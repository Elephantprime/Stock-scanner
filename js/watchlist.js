/* =========================================================
   WATCHLIST MANAGER
   ========================================================= */

StockScanner.watchlist = {

    active: "main",


    init() {

        this.bindTabs();

        this.bindButtons();

        this.render();

    },


    bindTabs() {

        document
            .querySelectorAll(".watchlist-tab")
            .forEach(tab => {

                tab.addEventListener(
                    "click",
                    () => {

                        this.switchTo(
                            tab.dataset.watchlist
                        );

                    }
                );

            });

    },


    bindButtons() {

        document
            .getElementById(
                "addWatchlistButton"
            )
            .addEventListener(
                "click",
                () => this.addSelected()
            );


        document
            .getElementById(
                "removeWatchlistButton"
            )
            .addEventListener(
                "click",
                () => this.removeSelected()
            );

    },


    switchTo(name) {

        if (
            !StockScanner.data.watchlists[name]
        ) {
            return;
        }


        this.active = name;


        document
            .querySelectorAll(".watchlist-tab")
            .forEach(tab => {

                tab.classList.toggle(
                    "active",
                    tab.dataset.watchlist === name
                );

            });


        const activeTab =
            document.querySelector(
                `.watchlist-tab[data-watchlist="${name}"]`
            );


        document.getElementById(
            "activeWatchlistTitle"
        ).textContent =
            activeTab
                ? activeTab.textContent.trim()
                : name.toUpperCase();


        this.render();

        this.updateButtons();

    },


    addSelected() {

        const symbol =
            StockScanner.ticker.selectedSymbol;

        if (!symbol) {
            return;
        }


        const list =
            StockScanner.data.watchlists[
                this.active
            ];


        if (!list.includes(symbol)) {

            list.push(symbol);

        }


        this.render();

        this.updateButtons();

    },


    removeSelected() {

        const symbol =
            StockScanner.ticker.selectedSymbol;

        if (!symbol) {
            return;
        }


        this.remove(symbol);

    },


    remove(symbol) {

        const list =
            StockScanner.data.watchlists[
                this.active
            ];


        const index =
            list.indexOf(symbol);


        if (index !== -1) {

            list.splice(index, 1);

        }


        this.render();

        this.updateButtons();

    },


    contains(symbol) {

        if (!symbol) {
            return false;
        }

        return StockScanner.data.watchlists[
            this.active
        ].includes(symbol);

    },


    updateButtons() {

        const symbol =
            StockScanner.ticker.selectedSymbol;


        const add =
            document.getElementById(
                "addWatchlistButton"
            );


        const remove =
            document.getElementById(
                "removeWatchlistButton"
            );


        if (!symbol) {

            add.disabled = true;
            remove.disabled = true;

            return;

        }


        const exists =
            this.contains(symbol);


        add.disabled = exists;

        remove.disabled = !exists;

    },


    render() {

        const body =
            document.getElementById(
                "watchlistBody"
            );


        const symbols =
            StockScanner.data.watchlists[
                this.active
            ];


        body.innerHTML = "";


        document.getElementById(
            "watchlistCount"
        ).textContent =
            `${symbols.length} STOCK${
                symbols.length === 1 ? "" : "S"
            }`;


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


        symbols.forEach(symbol => {

            const stock =
                StockScanner.ticker.getStock(
                    symbol
                );


            if (!stock) {
                return;
            }


            const row =
                document.createElement("tr");


            row.innerHTML = `

                <td>
                    <strong>
                        ${stock.symbol}
                    </strong>
                </td>

                <td>
                    $${stock.price.toFixed(2)}
                </td>

                <td class="
                    ${
                        stock.change >= 0
                        ? "positive"
                        : "negative"
                    }
                ">
                    ${
                        stock.change >= 0
                        ? "+"
                        : ""
                    }
                    ${stock.change.toFixed(2)}%
                </td>

                <td>
                    ${stock.setup}
                </td>

                <td>
                    ${stock.setupStatus}
                </td>

                <td>
                    ${stock.catalyst}
                </td>

                <td>
                    <button
                        class="danger-button
                               watchlist-row-remove"
                        data-symbol="${stock.symbol}"
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

                    StockScanner.ticker.select(
                        stock.symbol
                    );

                }
            );


            const removeButton =
                row.querySelector(
                    ".watchlist-row-remove"
                );


            removeButton.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    this.remove(
                        stock.symbol
                    );

                }
            );


            body.appendChild(row);

        });

    }

};
