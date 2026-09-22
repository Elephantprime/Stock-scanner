/* =========================================================
   STOCK SCANNER — LIVE CANDLESTICK CHART

   Data source:
   StockScanner.marketService.getCandles()

   Native SVG:
   - candlesticks
   - volume
   - price scale
   - time labels
   - 1m / 5m / 15m / 1h / 1D
   ========================================================= */

window.StockScanner =
    window.StockScanner || {};


StockScanner.chart = {

    symbol:
        null,

    timeframe:
        "5m",

    bars:
        [],

    requestId:
        0,


    init() {

        this.bindTimeframes();

        this.renderEmpty(
            "Select a ticker to load chart"
        );

    },


    bindTimeframes() {

        document
            .querySelectorAll(
                "[data-chart-timeframe]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            const timeframe =
                                button.dataset
                                    .chartTimeframe;


                            if (
                                !timeframe ||
                                timeframe ===
                                this.timeframe
                            ) {

                                return;

                            }


                            this.timeframe =
                                timeframe;


                            this.updateTimeframeButtons();


                            if (
                                this.symbol
                            ) {

                                this.load(
                                    this.symbol
                                );

                            }

                        }
                    );

                }
            );


        this.updateTimeframeButtons();

    },


    updateTimeframeButtons() {

        document
            .querySelectorAll(
                "[data-chart-timeframe]"
            )
            .forEach(
                button => {

                    button.classList.toggle(
                        "active",
                        button.dataset
                            .chartTimeframe ===
                            this.timeframe
                    );

                }
            );

    },


    async load(symbol) {

        symbol =
            StockScanner
                .marketService
                .normalizeSymbol(
                    symbol
                );


        if (!symbol) {

            this.renderEmpty(
                "Select a ticker to load chart"
            );

            return;

        }


        const requestId =
            ++this.requestId;


        this.symbol =
            symbol;


        this.setStatus(
            `${symbol} • ${this.timeframe.toUpperCase()} • LOADING`
        );


        this.renderLoading();


        try {

            const response =
                await StockScanner
                    .marketService
                    .getCandles(
                        symbol,
                        this.timeframe,
                        200
                    );


            if (
                requestId !==
                this.requestId
            ) {

                return;

            }


            const bars =
                Array.isArray(
                    response
                )
                    ? response
                    : (
                        Array.isArray(
                            response?.bars
                        )
                            ? response.bars
                            : []
                    );


            this.bars =
                bars;


            if (!bars.length) {

                this.setStatus(
                    `${symbol} • ${this.timeframe.toUpperCase()} • NO DATA`
                );


                this.renderEmpty(
                    "No candles available for this timeframe"
                );

                return;

            }


            this.setStatus(
                `${symbol} • ${this.timeframe.toUpperCase()} • IEX`
            );


            this.render(
                bars
            );

        }
        catch (error) {

            if (
                requestId !==
                this.requestId
            ) {

                return;

            }


            console.error(
                "[Chart]",
                error
            );


            this.bars = [];


            this.setStatus(
                `${symbol} • CHART ERROR`
            );


            this.renderEmpty(
                error?.message ||
                "Unable to load chart"
            );

        }

    },


    render(bars) {

        const host =
            document.getElementById(
                "chartCanvas"
            );


        if (!host) {
            return;
        }


        const validBars =
            bars.filter(
                bar => {

                    return (
                        this.numberOrNull(
                            bar.open
                        ) !== null &&
                        this.numberOrNull(
                            bar.high
                        ) !== null &&
                        this.numberOrNull(
                            bar.low
                        ) !== null &&
                        this.numberOrNull(
                            bar.close
                        ) !== null
                    );

                }
            );


        if (!validBars.length) {

            this.renderEmpty(
                "No valid candle data"
            );

            return;

        }


        const width =
            Math.max(
                host.clientWidth || 0,
                320
            );


        const height =
            Math.max(
                host.clientHeight || 0,
                250
            );


        const margin = {

            top:
                12,

            right:
                58,

            bottom:
                25,

            left:
                8

        };


        const volumeHeight =
            Math.max(
                42,
                height * 0.19
            );


        const volumeGap =
            10;


        const plotWidth =
            width -
            margin.left -
            margin.right;


        const priceHeight =
            height -
            margin.top -
            margin.bottom -
            volumeHeight -
            volumeGap;


        let low =
            Math.min(
                ...validBars.map(
                    bar =>
                        Number(
                            bar.low
                        )
                )
            );


        let high =
            Math.max(
                ...validBars.map(
                    bar =>
                        Number(
                            bar.high
                        )
                )
            );


        if (
            !Number.isFinite(low) ||
            !Number.isFinite(high)
        ) {

            this.renderEmpty(
                "Invalid chart range"
            );

            return;

        }


        if (
            high === low
        ) {

            high +=
                Math.max(
                    high * 0.001,
                    0.01
                );


            low -=
                Math.max(
                    low * 0.001,
                    0.01
                );

        }


        const range =
            high - low;


        const padding =
            range * 0.05;


        high += padding;
        low -= padding;


        const maxVolume =
            Math.max(
                1,
                ...validBars.map(
                    bar =>
                        Number(
                            bar.volume || 0
                        )
                )
            );


        const slot =
            plotWidth /
            validBars.length;


        const candleWidth =
            Math.max(
                1,
                Math.min(
                    9,
                    slot * 0.62
                )
            );


        const priceY =
            value => {

                return (
                    margin.top +
                    (
                        (
                            high -
                            value
                        ) /
                        (
                            high -
                            low
                        )
                    ) *
                    priceHeight
                );

            };


        const volumeTop =
            margin.top +
            priceHeight +
            volumeGap;


        const volumeBottom =
            volumeTop +
            volumeHeight;


        let svg = `

            <svg
                class="stock-chart-svg"
                viewBox="0 0 ${width} ${height}"
                preserveAspectRatio="none"
                role="img"
                aria-label="${this.escapeHTML(this.symbol || "")} candlestick chart"
            >
        `;


        /*
         Horizontal price grid.
        */

        const gridLines =
            5;


        for (
            let index = 0;
            index < gridLines;
            index++
        ) {

            const ratio =
                index /
                (
                    gridLines - 1
                );


            const y =
                margin.top +
                ratio *
                priceHeight;


            const price =
                high -
                ratio *
                (
                    high -
                    low
                );


            svg += `

                <line
                    class="chart-grid-line"
                    x1="${margin.left}"
                    y1="${y}"
                    x2="${width - margin.right}"
                    y2="${y}"
                />

                <text
                    class="chart-axis-text"
                    x="${width - margin.right + 6}"
                    y="${y + 3}"
                >
                    ${this.formatAxisPrice(price)}
                </text>
            `;

        }


        /*
         Volume separator.
        */

        svg += `

            <line
                class="chart-volume-separator"
                x1="${margin.left}"
                y1="${volumeTop - 5}"
                x2="${width - margin.right}"
                y2="${volumeTop - 5}"
            />
        `;


        validBars.forEach(
            (
                bar,
                index
            ) => {

                const open =
                    Number(
                        bar.open
                    );


                const highValue =
                    Number(
                        bar.high
                    );


                const lowValue =
                    Number(
                        bar.low
                    );


                const close =
                    Number(
                        bar.close
                    );


                const volume =
                    Number(
                        bar.volume || 0
                    );


                const x =
                    margin.left +
                    index *
                    slot +
                    slot / 2;


                const openY =
                    priceY(
                        open
                    );


                const closeY =
                    priceY(
                        close
                    );


                const highY =
                    priceY(
                        highValue
                    );


                const lowY =
                    priceY(
                        lowValue
                    );


                const bullish =
                    close >= open;


                const className =
                    bullish
                        ? "chart-up"
                        : "chart-down";


                const bodyTop =
                    Math.min(
                        openY,
                        closeY
                    );


                const bodyHeight =
                    Math.max(
                        1.2,
                        Math.abs(
                            closeY -
                            openY
                        )
                    );


                const volumeBarHeight =
                    (
                        volume /
                        maxVolume
                    ) *
                    volumeHeight;


                svg += `

                    <line
                        class="chart-wick ${className}"
                        x1="${x}"
                        y1="${highY}"
                        x2="${x}"
                        y2="${lowY}"
                    />

                    <rect
                        class="chart-candle ${className}"
                        x="${x - candleWidth / 2}"
                        y="${bodyTop}"
                        width="${candleWidth}"
                        height="${bodyHeight}"
                        rx="0.5"
                    />

                    <rect
                        class="chart-volume-bar ${className}"
                        x="${x - candleWidth / 2}"
                        y="${volumeBottom - volumeBarHeight}"
                        width="${candleWidth}"
                        height="${Math.max(1, volumeBarHeight)}"
                    />
                `;

            }
        );


        /*
         Time labels.
        */

        const labelIndexes =
            this.labelIndexes(
                validBars.length,
                4
            );


        labelIndexes.forEach(
            index => {

                const bar =
                    validBars[
                        index
                    ];


                const x =
                    margin.left +
                    index *
                    slot +
                    slot / 2;


                svg += `

                    <text
                        class="chart-time-text"
                        x="${x}"
                        y="${height - 7}"
                        text-anchor="middle"
                    >
                        ${this.escapeHTML(
                            this.formatTimeLabel(
                                bar.timestamp
                            )
                        )}
                    </text>
                `;

            }
        );


        /*
         Latest-price marker.
        */

        const latest =
            validBars[
                validBars.length - 1
            ];


        const latestClose =
            Number(
                latest.close
            );


        const latestY =
            priceY(
                latestClose
            );


        svg += `

            <line
                class="chart-last-price-line"
                x1="${margin.left}"
                y1="${latestY}"
                x2="${width - margin.right}"
                y2="${latestY}"
            />

            <rect
                class="chart-last-price-box"
                x="${width - margin.right + 2}"
                y="${latestY - 8}"
                width="${margin.right - 4}"
                height="16"
                rx="2"
            />

            <text
                class="chart-last-price-text"
                x="${width - margin.right + 6}"
                y="${latestY + 3}"
            >
                ${this.formatAxisPrice(latestClose)}
            </text>

            </svg>
        `;


        host.innerHTML =
            svg;

    },


    renderLoading() {

        const host =
            document.getElementById(
                "chartCanvas"
            );


        if (!host) {
            return;
        }


        host.innerHTML = `

            <div class="chart-message">
                Loading live candles...
            </div>
        `;

    },


    renderEmpty(message) {

        const host =
            document.getElementById(
                "chartCanvas"
            );


        if (!host) {
            return;
        }


        host.innerHTML = `

            <div class="chart-message">
                ${this.escapeHTML(message)}
            </div>
        `;

    },


    setStatus(text) {

        const element =
            document.getElementById(
                "chartStatus"
            );


        if (element) {

            element.textContent =
                text;

        }

    },


    labelIndexes(
        length,
        count
    ) {

        if (
            length <= 1
        ) {

            return [0];

        }


        const result =
            new Set();


        for (
            let index = 0;
            index < count;
            index++
        ) {

            result.add(
                Math.round(
                    (
                        index /
                        (
                            count - 1
                        )
                    ) *
                    (
                        length - 1
                    )
                )
            );

        }


        return Array.from(
            result
        );

    },


    formatTimeLabel(value) {

        if (!value) {
            return "";
        }


        const date =
            new Date(value);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "";

        }


        if (
            this.timeframe ===
            "1d"
        ) {

            return date.toLocaleDateString(
                [],
                {

                    month:
                        "short",

                    day:
                        "numeric"

                }
            );

        }


        return date.toLocaleTimeString(
            [],
            {

                hour:
                    "numeric",

                minute:
                    "2-digit"

            }
        );

    },


    formatAxisPrice(value) {

        if (
            value >= 1000
        ) {

            return value.toFixed(0);

        }


        if (
            value >= 1
        ) {

            return value.toFixed(2);

        }


        if (
            value >= 0.01
        ) {

            return value.toFixed(3);

        }


        return value.toFixed(4);

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
