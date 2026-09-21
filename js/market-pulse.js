/* =========================================================
   MARKET PULSE
   ========================================================= */

StockScanner.marketPulse = {

    init() {

        const data =
            StockScanner.data.marketPulse;


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
                    ${market.price.toFixed(2)}
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
                        ${market.change.toFixed(2)}%
                    </span>
                `;

            }


            if (name === "ADV / DEC") {

                value.textContent =
                    data.advanceDecline;

            }


            if (
                name === "LEADING SECTOR"
            ) {

                value.textContent =
                    data.leadingSector;

            }

        });

    }

};
