/* =========================================================
   MARKET INTELLIGENCE FEED
   Data source: StockScanner.marketService
   ========================================================= */

StockScanner.news = {

    items: [],


    async init() {

        document
            .getElementById("newsFilter")
            .addEventListener(
                "change",
                event => {

                    this.filter(
                        event.target.value
                    );

                }
            );


        await this.refresh();

    },


    async refresh() {

        try {

            const items =
                await StockScanner.marketService
                    .getMarketNews();

            this.items =
                Array.isArray(items)
                    ? items
                    : [];

            this.render(
                this.items
            );

            this.setStatus(
                StockScanner.marketService.isLive()
                    ? "LIVE"
                    : "DEMO"
            );

        }
        catch (error) {

            console.error(
                "[News]",
                error
            );

            this.setStatus("ERROR");

            this.renderError(
                error.message
            );

        }

    },


    render(items) {

        const feed =
            document.getElementById(
                "newsFeed"
            );

        feed.innerHTML = "";


        if (!items.length) {

            feed.innerHTML = `
                <article class="news-item">
                    No stories available.
                </article>
            `;

            return;

        }


        items.forEach(item => {

            const article =
                document.createElement(
                    "article"
                );

            article.className =
                "news-item";


            article.innerHTML = `

                <div class="news-meta">

                    <span>
                        ${item.ticker || "MARKET"}
                        •
                        ${(item.type || "news")
                            .toUpperCase()}
                    </span>

                    <time>
                        ${item.time || ""}
                    </time>

                </div>

                <h3>
                    ${item.headline || ""}
                </h3>

                <p>
                    ${item.summary || ""}
                </p>
            `;


            if (
                item.ticker &&
                item.ticker !== "MARKET"
            ) {

                article.addEventListener(
                    "click",
                    () => {

                        StockScanner.ticker.select(
                            item.ticker
                        );

                    }
                );

            }


            feed.appendChild(article);

        });

    },


    filter(type) {

        if (type === "all") {

            this.render(
                this.items
            );

            return;

        }


        this.render(
            this.items.filter(
                item =>
                    item.type === type
            )
        );

    },


    renderError(message) {

        document.getElementById(
            "newsFeed"
        ).innerHTML = `

            <article class="news-item">
                <h3>
                    News feed unavailable
                </h3>

                <p>
                    ${message}
                </p>
            </article>
        `;

    },


    setStatus(status) {

        const elements =
            document.querySelectorAll(
                "#systemStatus span"
            );

        elements.forEach(element => {

            if (
                element.textContent
                    .trim()
                    .startsWith("NEWS")
            ) {

                const indicator =
                    element.querySelector("b");

                indicator.textContent =
                    status;

                indicator.className =
                    status === "ERROR"
                        ? "status-off"
                        : "status-ready";

            }

        });

    }

};
