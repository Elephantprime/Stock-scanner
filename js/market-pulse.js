/* =========================================================
   MARKET PULSE
   Data source: StockScanner.marketService
   ========================================================= */

StockScanner.marketPulse = {

    async init() {

        try {

            const data =
                await StockScanner.marketService
                    .getMarketPulse();

            this.render(data);

            this.setStatus(
                StockScanner.marketService.isLive()
                    ? "LIVE"
                    : "DEMO"
            );

        }
        catch (error) {

            console.error(
                "[Market Pulse]",
                error
            );

            this.setStatus("ERROR");

        }

    },


    render(data) {

        const items =
            document.querySelectorAll(
                ".pulse-item"
            );


        items.forEach(item => {

            const label =
                item.querySelector("span");

            const value =
                item.querySelector("strong");

            if (!label || !value) {
                return;
            }


            const name =
                label.textContent.trim();


            if (data[name]) {

                const market =
                    data[name];

                value.innerHTML = `

                    ${Number(
                        market.price
                    ).toFixed(2)}

                    <span class="
                        ${
                            market.change >= 0
                                ? "positive"
                                : "negative"
                        }
                    ">
                        ${
                            market.change >= 0
                                ? "+"
                                : ""
                        }

                        ${Number(
                            market.change
                        ).toFixed(2)}%
                    </span>
                `;

            }


            if (name === "ADV / DEC") {

                value.textContent =
                    data.advanceDecline ||
                    "---";

            }


            if (
                name === "LEADING SECTOR"
            ) {

                value.textContent =
                    data.leadingSector ||
                    "---";

            }

        });

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
                    .startsWith("MARKET")
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
