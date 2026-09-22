/* =========================================================
   STOCK SCANNER — LIVE CHART

   Pure SVG candlestick chart.

   No external chart library required.

   Data:
   StockScanner.marketService.getCandles()
   ========================================================= */

window.StockScanner =
    window.StockScanner || {};


StockScanner.chart = {

    symbol:
        null,

    timeframe:
        "5m",

    limit:
        200,

    bars:
        [],

    requestId:
        0,

    resizeTimer:
        null,


    /* =====================================================
       INITIALIZE
    ===================================================== */

    init() {

        this.bindTimeframes();


        window.addEventListener(
            "resize",
            () => {

                clearTimeout(
                    this.resizeTimer
                );


                this.resizeTimer =
                    setTimeout(
                        () => {

                            if (
                                this.bars.length
                            ) {

                                this.render();

                            }

                        },
                        150
                    );

            }
        );

    },


    /* =====================================================
       TIMEFRAME BUTTONS
    ===================================================== */

    bindTimeframes() {

        const buttons =
            document.querySelectorAll(
                "[data-chart-timeframe]"
            );


        buttons.forEach(
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


                        this.updateActiveButton();


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


        this.updateActiveButton();

    },


    updateActiveButton() {

        const buttons =
            document.querySelectorAll(
                "[data-chart-timeframe]"
            );


        buttons.forEach(
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


    /* =====================================================
       LOAD SYMBOL
    ===================================================== */

    async load(symbol) {

        symbol =
            StockScanner.marketService
                .normalizeSymbol(
                    symbol
                );


        if (!symbol) {

            this.clear();

            return;

        }


        this.symbol =
            symbol;


        const requestId =
            ++this.requestId;


        this.showLoading();


        try {

            const response =
                await StockScanner
                    .marketService
                    .getCandles(
                        symbol,
                        this.timeframe,
                        this.limit
                    );


            if (
                requestId !==
                this.requestId
            ) {

                return;

            }


            /*
             Support either normalized object response
             or a plain bar array.
            */

            const bars =
                Array.isArray(response)
                    ? response
                    : (
                        Array.isArray(
                            response?.bars
                        )
                            ? response.bars
                            : []
                      );


            this.bars =
                bars
                    .map(
                        bar => ({

                            ...bar,

                            timestamp:
                                Number.isFinite(
                                    Number(
                                        bar.timestamp
                                    )
                                )
                                    ? Number(
                                        bar.timestamp
                                      )
                                    : new Date(
                                        bar.time
                                      ).getTime(),

                            open:
                                Number(
                                    bar.open
                                ),

                            high:
                                Number(
                                    bar.high
                                ),

                            low:
                                Number(
                                    bar.low
                                ),

                            close:
                                Number(
                                    bar.close
                                ),

                            volume:
                                Number(
                                    bar.volume ||
                                    0
                                )

                        })
                    )
                    .filter(
                        bar =>

                            Number.isFinite(
                                bar.timestamp
                            ) &&

                            Number.isFinite(
                                bar.open
                            ) &&

                            Number.isFinite(
                                bar.high
                            ) &&

                            Number.isFinite(
                                bar.low
                            ) &&

                            Number.isFinite(
                                bar.close
                            )

                    );


            if (
                !this.bars.length
            ) {

                this.showEmpty();

                return;

            }


            this.render();

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


            this.showError(
                error?.message ||
                "Unable to load chart."
            );

        }

    },


    /* =====================================================
       RENDER
    ===================================================== */

    render() {

        const container =
            document.getElementById(
                "chartCanvas"
            );


        if (
            !container ||
            !this.bars.length
        ) {

            return;

        }


        container.innerHTML =
            "";


        const width =
            Math.max(
                container.clientWidth,
                320
            );


        const height =
            Math.max(
                container.clientHeight,
                300
            );


        const padding = {

            top:
                20,

            right:
                64,

            bottom:
                30,

            left:
                10

        };


        const volumeHeight =
            Math.max(
                50,
                height * 0.18
            );


        const volumeGap =
            10;


        const priceTop =
            padding.top;


        const priceBottom =
            height -
            padding.bottom -
            volumeHeight -
            volumeGap;


        const volumeTop =
            priceBottom +
            volumeGap;


        const volumeBottom =
            height -
            padding.bottom;


        const plotLeft =
            padding.left;


        const plotRight =
            width -
            padding.right;


        const plotWidth =
            plotRight -
            plotLeft;


        const bars =
            this.bars;


        let minimum =
            Math.min(
                ...bars.map(
                    bar =>
                        bar.low
                )
            );


        let maximum =
            Math.max(
                ...bars.map(
                    bar =>
                        bar.high
                )
            );


        /*
         Give price action a little breathing room.
        */

        const range =
            Math.max(
                maximum -
                minimum,
                maximum *
                0.001,
                0.01
            );


        minimum -=
            range * 0.05;


        maximum +=
            range * 0.05;


        const priceRange =
            maximum -
            minimum;


        const maxVolume =
            Math.max(
                ...bars.map(
                    bar =>
                        bar.volume
                ),
                1
            );


        const slotWidth =
            plotWidth /
            Math.max(
                bars.length,
                1
            );


        const candleWidth =
            Math.max(
                1,
                Math.min(
                    slotWidth * 0.65,
                    10
                )
            );


        const svg =
            this.svgElement(
                "svg"
            );


        svg.setAttribute(
            "viewBox",
            `0 0 ${width} ${height}`
        );


        svg.setAttribute(
            "preserveAspectRatio",
            "none"
        );


        svg.classList.add(
            "live-chart-svg"
        );


        /* =================================================
           PRICE GRID
        ================================================= */

        const gridLines =
            5;


        for (
            let i = 0;
            i <= gridLines;
            i++
        ) {

            const ratio =
                i /
                gridLines;


            const y =
                priceTop +
                (
                    (
                        priceBottom -
                        priceTop
                    ) *
                    ratio
                );


            const line =
                this.svgElement(
                    "line"
                );


            line.setAttribute(
                "x1",
                plotLeft
            );

            line.setAttribute(
                "x2",
                plotRight
            );

            line.setAttribute(
                "y1",
                y
            );

            line.setAttribute(
                "y2",
                y
            );

            line.setAttribute(
                "class",
                "chart-grid-line"
            );


            svg.appendChild(
                line
            );


            const price =
                maximum -
                (
                    priceRange *
                    ratio
                );


            const label =
                this.svgElement(
                    "text"
                );


            label.setAttribute(
                "x",
                plotRight + 7
            );

            label.setAttribute(
                "y",
                y + 4
            );

            label.setAttribute(
                "class",
                "chart-axis-label"
            );


            label.textContent =
                this.formatAxisPrice(
                    price
                );


            svg.appendChild(
                label
            );

        }


        /* =================================================
           CANDLES + VOLUME
        ================================================= */

        bars.forEach(
            (bar, index) => {

                const centerX =
                    plotLeft +
                    (
                        slotWidth *
                        index
                    ) +
                    (
                        slotWidth /
                        2
                    );


                const yHigh =
                    this.priceToY(
                        bar.high,
                        minimum,
                        maximum,
                        priceTop,
                        priceBottom
                    );


                const yLow =
                    this.priceToY(
                        bar.low,
                        minimum,
                        maximum,
                        priceTop,
                        priceBottom
                    );


                const yOpen =
                    this.priceToY(
                        bar.open,
                        minimum,
                        maximum,
                        priceTop,
                        priceBottom
                    );


                const yClose =
                    this.priceToY(
                        bar.close,
                        minimum,
                        maximum,
                        priceTop,
                        priceBottom
                    );


                const bullish =
                    bar.close >=
                    bar.open;


                /* WICK */

                const wick =
                    this.svgElement(
                        "line"
                    );


                wick.setAttribute(
                    "x1",
                    centerX
                );

                wick.setAttribute(
                    "x2",
                    centerX
                );

                wick.setAttribute(
                    "y1",
                    yHigh
                );

                wick.setAttribute(
                    "y2",
                    yLow
                );

                wick.setAttribute(
                    "class",
                    bullish
                        ? "chart-wick bullish"
                        : "chart-wick bearish"
                );


                svg.appendChild(
                    wick
                );


                /* BODY */

                const body =
                    this.svgElement(
                        "rect"
                    );


                const bodyTop =
                    Math.min(
                        yOpen,
                        yClose
                    );


                const bodyHeight =
                    Math.max(
                        Math.abs(
                            yClose -
                            yOpen
                        ),
                        1
                    );


                body.setAttribute(
                    "x",
                    centerX -
                    (
                        candleWidth /
                        2
                    )
                );

                body.setAttribute(
                    "y",
                    bodyTop
                );

                body.setAttribute(
                    "width",
                    candleWidth
                );

                body.setAttribute(
                    "height",
                    bodyHeight
                );

                body.setAttribute(
                    "class",
                    bullish
                        ? "chart-candle bullish"
                        : "chart-candle bearish"
                );


                svg.appendChild(
                    body
                );


                /* VOLUME */

                const volumeRatio =
                    Math.min(
                        bar.volume /
                        maxVolume,
                        1
                    );


                const volumeBarHeight =
                    (
                        volumeBottom -
                        volumeTop
                    ) *
                    volumeRatio;


                const volume =
                    this.svgElement(
                        "rect"
                    );


                volume.setAttribute(
                    "x",
                    centerX -
                    (
                        candleWidth /
                        2
                    )
                );

                volume.setAttribute(
                    "y",
                    volumeBottom -
                    volumeBarHeight
                );

                volume.setAttribute(
                    "width",
                    candleWidth
                );

                volume.setAttribute(
                    "height",
                    Math.max(
                        volumeBarHeight,
                        1
                    )
                );

                volume.setAttribute(
                    "class",
                    bullish
                        ? "chart-volume bullish"
                        : "chart-volume bearish"
                );


                svg.appendChild(
                    volume
                );

            }
        );


        /* =================================================
           TIME LABELS
        ================================================= */

        const labelCount =
            Math.min(
                5,
                bars.length
            );


        if (
            labelCount > 1
        ) {

            for (
                let i = 0;
                i < labelCount;
                i++
            ) {

                const index =
                    Math.round(
                        (
                            bars.length -
                            1
                        ) *
                        (
                            i /
                            (
                                labelCount -
                                1
                            )
                        )
                    );


                const bar =
                    bars[index];


                const x =
                    plotLeft +
                    (
                        slotWidth *
                        index
                    ) +
                    (
                        slotWidth /
                        2
                    );


                const label =
                    this.svgElement(
                        "text"
                    );


                label.setAttribute(
                    "x",
                    x
                );

                label.setAttribute(
                    "y",
                    height - 7
                );

                label.setAttribute(
                    "text-anchor",
                    "middle"
                );

                label.setAttribute(
                    "class",
                    "chart-time-label"
                );


                label.textContent =
                    this.formatTime(
                        bar.timestamp
                    );


                svg.appendChild(
                    label
                );

            }

        }


        container.appendChild(
            svg
        );


        this.renderLegend();

    },


    /* =====================================================
       LEGEND
    ===================================================== */

    renderLegend() {

        const latest =
            this.bars[
                this.bars.length - 1
            ];


        if (!latest) {
            return;
        }


        this.setText(
            "chartSymbol",
            this.symbol ||
            "---"
        );


        this.setText(
            "chartBarInfo",
            `O ${this.formatPrice(latest.open)}  H ${this.formatPrice(latest.high)}  L ${this.formatPrice(latest.low)}  C ${this.formatPrice(latest.close)}`
        );


        this.setText(
            "chartFeed",
            `IEX • ${this.timeframe.toUpperCase()} • ${this.bars.length} BARS`
        );

    },


    /* =====================================================
       STATES
    ===================================================== */

    showLoading() {

        const container =
            document.getElementById(
                "chartCanvas"
            );


        if (!container) {
            return;
        }


        container.innerHTML = `

            <div class="chart-message">
                <strong>
                    Loading ${this.symbol || ""}...
                </strong>

                <span>
                    ${this.timeframe.toUpperCase()} live market bars
                </span>
            </div>
        `;


        this.setText(
            "chartSymbol",
            this.symbol ||
            "---"
        );


        this.setText(
            "chartBarInfo",
            "Loading market data..."
        );


        this.setText(
            "chartFeed",
            "IEX"
        );

    },


    showEmpty() {

        const container =
            document.getElementById(
                "chartCanvas"
            );


        if (!container) {
            return;
        }


        container.innerHTML = `

            <div class="chart-message">
                <strong>
                    No chart bars available
                </strong>

                <span>
                    Try another timeframe.
                </span>
            </div>
        `;


        this.setText(
            "chartBarInfo",
            "No bars returned"
        );

    },


    showError(message) {

        const container =
            document.getElementById(
                "chartCanvas"
            );


        if (!container) {
            return;
        }


        container.innerHTML = `

            <div class="chart-message chart-error">
                <strong>
                    Chart unavailable
                </strong>

                <span>
                    ${this.escapeHTML(message)}
                </span>
            </div>
        `;


        this.setText(
            "chartBarInfo",
            "Market data unavailable"
        );

    },


    clear() {

        this.symbol =
            null;

        this.bars =
            [];


        const container =
            document.getElementById(
                "chartCanvas"
            );


        if (container) {

            container.innerHTML = `

                <div class="chart-message">

                    <strong>
                        LIVE CHART
                    </strong>

                    <span>
                        Select a ticker to load chart
                    </span>

                </div>
            `;

        }


        this.setText(
            "chartSymbol",
            "---"
        );


        this.setText(
            "chartBarInfo",
            "Select a ticker"
        );


        this.setText(
            "chartFeed",
            "IEX"
        );

    },


    /* =====================================================
       MATH
    ===================================================== */

    priceToY(
        price,
        minimum,
        maximum,
        top,
        bottom
    ) {

        const range =
            maximum -
            minimum;


        if (
            range <= 0
        ) {

            return (
                top +
                bottom
            ) / 2;

        }


        const ratio =
            (
                maximum -
                price
            ) /
            range;


        return (
            top +
            (
                ratio *
                (
                    bottom -
                    top
                )
            )
        );

    },


    /* =====================================================
       FORMATTERS
    ===================================================== */

    formatPrice(value) {

        const number =
            Number(value);


        if (
            !Number.isFinite(number)
        ) {

            return "---";

        }


        if (
            number < 1
        ) {

            return "$" +
                number.toFixed(4);

        }


        return "$" +
            number.toFixed(2);

    },


    formatAxisPrice(value) {

        const number =
            Number(value);


        if (
            number < 1
        ) {

            return number.toFixed(3);

        }


        return number.toFixed(2);

    },


    formatTime(timestamp) {

        const date =
            new Date(timestamp);


        if (
            this.timeframe === "1d"
        ) {

            return date
                .toLocaleDateString(
                    [],
                    {
                        month:
                            "short",

                        day:
                            "numeric"
                    }
                );

        }


        return date
            .toLocaleTimeString(
                [],
                {
                    hour:
                        "numeric",

                    minute:
                        "2-digit"
                }
            );

    },


    /* =====================================================
       HELPERS
    ===================================================== */

    svgElement(name) {

        return document
            .createElementNS(
                "http://www.w3.org/2000/svg",
                name
            );

    },


    setText(
        id,
        value
    ) {

        const element =
            document.getElementById(
                id
            );


        if (element) {

            element.textContent =
                value;

        }

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
