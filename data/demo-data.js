/* =========================================================
   STOCK SCANNER — DEMO DATA
   Temporary data layer. Live APIs will replace this later.
   ========================================================= */

window.StockScanner = window.StockScanner || {};

StockScanner.data = {

    marketPulse: {
        SPY:  {
            price: 668.42,
            change: 0.74
        },

        QQQ:  {
            price: 607.18,
            change: 1.03
        },

        IWM:  {
            price: 246.31,
            change: -0.22
        },

        VIX:  {
            price: 15.82,
            change: -3.14
        },

        advanceDecline: "3,421 / 2,107",

        leadingSector: "Technology"
    },


    stocks: [

        {
            symbol: "NVDA",
            company: "NVIDIA Corporation",

            price: 184.72,
            change: 4.82,

            volume: 68400000,
            relativeVolume: 2.8,

            vwap: 181.42,

            momentum: "STRONG",
            volatility: "HIGH",

            setup: "Breakout",
            setupStatus: "CONFIRMED",

            catalyst: "AI / Semiconductor momentum",

            whyNow: [
                "Price cleared intraday resistance.",
                "Relative volume expanded above 2.5×.",
                "Price is holding above VWAP.",
                "Momentum accelerated after consolidation."
            ],

            trade: {
                entry: "$184.50 – $185.10",
                stop: "$181.90",
                target1: "$189.00",
                target2: "$193.50",
                riskReward: "1 : 2.6"
            }
        },


        {
            symbol: "AMD",
            company: "Advanced Micro Devices",

            price: 216.38,
            change: 3.14,

            volume: 42100000,
            relativeVolume: 2.1,

            vwap: 212.76,

            momentum: "STRONG",
            volatility: "HIGH",

            setup: "Bull Flag",
            setupStatus: "DEVELOPING",

            catalyst: "Semiconductor strength",

            whyNow: [
                "Strong morning impulse.",
                "Volume contracted during consolidation.",
                "Price remains above VWAP.",
                "Potential continuation structure developing."
            ],

            trade: {
                entry: "$216.50+ confirmation",
                stop: "$212.80",
                target1: "$221.00",
                target2: "$226.00",
                riskReward: "1 : 2.4"
            }
        },


        {
            symbol: "PLTR",
            company: "Palantir Technologies",

            price: 171.64,
            change: 6.72,

            volume: 55700000,
            relativeVolume: 3.6,

            vwap: 166.93,

            momentum: "VERY STRONG",
            volatility: "HIGH",

            setup: "Momentum Continuation",
            setupStatus: "CONFIRMED",

            catalyst: "Unusual volume / AI momentum",

            whyNow: [
                "Relative volume crossed 3×.",
                "Price broke morning high.",
                "Volume accelerated into breakout.",
                "Price remains extended above VWAP."
            ],

            trade: {
                entry: "$170.80 – $172.00",
                stop: "$166.75",
                target1: "$176.50",
                target2: "$181.00",
                riskReward: "1 : 2.1"
            }
        },


        {
            symbol: "TSLA",
            company: "Tesla, Inc.",

            price: 438.27,
            change: -2.41,

            volume: 73600000,
            relativeVolume: 1.9,

            vwap: 443.16,

            momentum: "WEAK",
            volatility: "VERY HIGH",

            setup: "VWAP Rejection",
            setupStatus: "DEVELOPING",

            catalyst: "Heavy trading activity",

            whyNow: [
                "Price rejected VWAP.",
                "Selling volume increased.",
                "Intraday support is being tested.",
                "Momentum remains below neutral."
            ],

            trade: {
                entry: "$437.80 breakdown",
                stop: "$443.50",
                target1: "$431.00",
                target2: "$424.00",
                riskReward: "1 : 2.3"
            }
        },


        {
            symbol: "SOFI",
            company: "SoFi Technologies",

            price: 28.46,
            change: 2.88,

            volume: 31800000,
            relativeVolume: 2.4,

            vwap: 27.91,

            momentum: "STRONG",
            volatility: "MEDIUM",

            setup: "Resistance Break",
            setupStatus: "DEVELOPING",

            catalyst: "Financial technology momentum",

            whyNow: [
                "Price is testing multi-hour resistance.",
                "Relative volume is above normal.",
                "VWAP is acting as intraday support.",
                "Higher lows are forming."
            ],

            trade: {
                entry: "$28.55+",
                stop: "$27.80",
                target1: "$29.75",
                target2: "$31.10",
                riskReward: "1 : 2.5"
            }
        }

    ],


    news: [

        {
            type: "market",
            ticker: "MARKET",
            time: "10:42",
            headline: "Technology stocks lead broad market activity",
            summary:
                "Semiconductor and artificial-intelligence names are showing elevated trading activity in the demo market feed."
        },

        {
            type: "stocks",
            ticker: "NVDA",
            time: "10:38",
            headline: "NVDA pushes through intraday resistance",
            summary:
                "Volume expanded as shares moved above the morning trading range."
        },

        {
            type: "business",
            ticker: "AMD",
            time: "10:31",
            headline: "Semiconductor group remains active",
            summary:
                "Several large semiconductor names are trading with above-average volume."
        },

        {
            type: "stocks",
            ticker: "PLTR",
            time: "10:24",
            headline: "PLTR appears among high-relative-volume names",
            summary:
                "Shares are showing strong momentum with elevated relative volume."
        },

        {
            type: "market",
            ticker: "MARKET",
            time: "10:18",
            headline: "Market breadth remains positive",
            summary:
                "Advancing issues currently outnumber declining issues in the simulated feed."
        },

        {
            type: "stocks",
            ticker: "TSLA",
            time: "10:11",
            headline: "TSLA trades below VWAP after early volatility",
            summary:
                "Shares remain active while sellers defend the intraday VWAP area."
        },

        {
            type: "business",
            ticker: "SOFI",
            time: "10:04",
            headline: "Fintech names attract increased trading volume",
            summary:
                "Several financial-technology stocks are seeing stronger-than-normal activity."
        }

    ],


    watchlists: {

        main: [
            "NVDA",
            "PLTR"
        ],

        momentum: [
            "AMD",
            "SOFI"
        ],

        swing: [
            "TSLA"
        ]

    }

};
