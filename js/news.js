/* =========================================================
   STOCK SCANNER — LIVE MARKET INTELLIGENCE
   ========================================================= */

window.StockScanner =
    window.StockScanner || {};


StockScanner.news = {

    items:
        [],


    async init() {

        const filter =
            document.getElementById(
                "newsFilter"
            );


        if (filter) {

            filter.addEventListener(
                "change",
                event => {

                    this.filter(
                        event.target.value
                    );

                }
            );

        }


        await this.refresh();

    },


    async refresh() {

        try {

            const items =
                await StockScanner
                    .marketService
                    .getMarketNews({

                        limit:
                            30

                    });


            this.items =
                Array.isArray(items)
                    ? items
                    : [];


            this.render(
                this.items
            );


            this.setStatus(
                "LIVE"
            );

        }
        catch (error) {

            console.error(
                "[News]",
                error
            );


            this.items =
                [];


            this.setStatus(
                "ERROR"
            );


            this.renderError(
                error?.message ||
                "Live news unavailable."
            );

        }

    },


    render(items) {

        const feed =
            document.getElementById(
                "newsFeed"
            );


        if (!feed) {
            return;
        }


        feed.innerHTML =
            "";


        if (!items.length) {

            feed.innerHTML = `

                <article class="news-item placeholder">

                    No live stories available.

                </article>
            `;


            return;

        }


        items.forEach(
            item => {

                const article =
                    document.createElement(
                        "article"
                    );


                article.className =
                    "news-item";


                const ticker =
                    item.ticker ||
                    "MARKET";


                article.innerHTML = `

                    <div class="news-meta">

                        <span>
                            ${this.escapeHTML(ticker)}
                            •
                            ${this.escapeHTML(
                                String(
                                    item.type ||
                                    "news"
                                ).toUpperCase()
                            )}
                        </span>

                        <time>
                            ${this.escapeHTML(
                                item.time ||
                                ""
                            )}
                        </time>

                    </div>

                    <h3>
                        ${this.escapeHTML(
                            item.headline ||
                            ""
                        )}
                    </h3>

                    <p>
                        ${this.escapeHTML(
                            item.summary ||
                            ""
                        )}
                    </p>
                `;


                if (
                    ticker !==
                    "MARKET"
                ) {

                    article.addEventListener(
                        "click",
                        () => {

                            StockScanner.ticker
                                .select(
                                    ticker
                                );

                        }
                    );

                }


                feed.appendChild(
                    article
                );

            }
        );

    },


    filter(type) {

        if (
            type === "all"
        ) {

            this.render(
                this.items
            );

            return;

        }


        this.render(

            this.items.filter(
                item =>
                    item.type ===
                    type
            )

        );

    },


    renderError(message) {

        const feed =
            document.getElementById(
                "newsFeed"
            );


        if (!feed) {
            return;
        }


        feed.innerHTML = `

            <article class="news-item placeholder">

                <h3>
                    News feed unavailable
                </h3>

                <p>
                    ${this.escapeHTML(message)}
                </p>

            </article>
        `;

    },


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
                            "NEWS"
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
                    status === "LIVE"
                        ? "status-ready"
                        : "status-off";

            }
        );

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
