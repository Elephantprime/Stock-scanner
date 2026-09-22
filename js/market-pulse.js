/* =========================================================
   STOCK SCANNER — LIVE MARKET PULSE
   ========================================================= */

window.StockScanner =
    window.StockScanner || {};


StockScanner.marketPulse = {

    async init() {

        this.clear();


        try {

            const data =
                await StockScanner
                    .marketService
                    .getMarketPulse();


            this.render(
                data || {}
            );


            this.setStatus(
                "LIVE"
            );

        }
        catch (error) {

            console.error(
                "[Market Pulse]",
                error
            );


            this.clear();

            this.setStatus(
                "ERROR"
            );

        }

    },


    clear() {

        document
            .querySelectorAll(
                ".pulse-item strong"
            )
            .forEach(
                element => {

                    element.textContent =
                        "---";

                }
            );

    },


    render(data) {

        const items =
            document.querySelectorAll(
                ".pulse-item"
            );


        items.forEach(
            item => {

                const label =
                    item.querySelector(
                        "span"
                    );


                const value =
                    item.querySelector(
                        "strong"
                    );


                if (
                    !label ||
                    !value
                ) {

                    return;

                }


                const name =
                    label.textContent
                        .trim();


                if (
                    [
                        "SPY",
                        "QQQ",
                        "IWM"
                    ].includes(
                        name
                    )
                ) {

                    const market =
                        data[name];


                    const price =
                        this.numberOrNull(
                            market?.price
                        );


                    const change =
                        this.numberOrNull(
                            market?.change
                        );


                    if (
                        price === null
                    ) {

                        value.textContent =
                            "---";

                        return;

                    }


                    value.innerHTML = `

                        ${this.formatPrice(price)}

                        ${
                            change !== null
                                ? `
                                    <span class="${
                                        change >= 0
                                            ? "positive"
                                            : "negative"
                                    }">
                                        ${
                                            change >= 0
                                                ? "+"
                                                : ""
                                        }${change.toFixed(2)}%
                                    </span>
                                  `
                                : ""
                        }
                    `;


                    return;

                }


                if (
                    name === "VIX"
                ) {

                    value.textContent =
                        "N/A";

                    return;

                }


                if (
                    name ===
                    "ADV / DEC"
                ) {

                    value.textContent =
                        data.advanceDecline ||
                        "N/A";

                    return;

                }


                if (
                    name ===
                    "LEADING SECTOR"
                ) {

                    value.textContent =
                        data.leadingSector ||
                        "N/A";

                }

            }
        );

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
                            "MARKET"
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
            value >= 100
        ) {

            return value.toFixed(2);

        }


        return value.toFixed(2);

    }

};
