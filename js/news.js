/* =========================================================
   MARKET INTELLIGENCE FEED
   ========================================================= */

StockScanner.news = {

    init() {

        this.render(
            StockScanner.data.news
        );


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
                    No stories match this filter.
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
                        ${item.ticker}
                        •
                        ${item.type.toUpperCase()}
                    </span>

                    <time>
                        ${item.time}
                    </time>

                </div>

                <h3>
                    ${item.headline}
                </h3>

                <p>
                    ${item.summary}
                </p>

            `;


            if (
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
                StockScanner.data.news
            );

            return;

        }


        const filtered =
            StockScanner.data.news.filter(
                item =>
                    item.type === type
            );


        this.render(filtered);

    }

};
