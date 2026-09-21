/* =========================================================
   PATTERN LIBRARY
   ========================================================= */

StockScanner.patterns = {

    patterns: [

        {
            name: "Breakout",

            description:
                "Price moves through an established resistance level with supporting volume.",

            confirmation:
                "Price holds above resistance and volume expands.",

            invalidation:
                "Price falls back below the breakout level."
        },


        {
            name: "Bull Flag",

            description:
                "Strong upward move followed by controlled consolidation.",

            confirmation:
                "Price breaks the flag resistance with renewed volume.",

            invalidation:
                "Price loses the consolidation support."
        },


        {
            name: "VWAP Reclaim",

            description:
                "Price moves from below VWAP to above it and begins holding.",

            confirmation:
                "Successful retest of VWAP with buying pressure.",

            invalidation:
                "Price loses VWAP again."
        },


        {
            name: "VWAP Rejection",

            description:
                "Price tests VWAP from below and sellers defend the level.",

            confirmation:
                "Price turns lower with increasing selling pressure.",

            invalidation:
                "Price reclaims and holds above VWAP."
        },


        {
            name: "Momentum Continuation",

            description:
                "A strong directional move continues after a short pause.",

            confirmation:
                "New high or low with sustained volume and momentum.",

            invalidation:
                "Momentum fades and price loses the continuation structure."
        }

    ],


    init() {

        const library =
            document.getElementById(
                "patternLibrary"
            );


        library.innerHTML = "";


        this.patterns.forEach(
            pattern => {

                const card =
                    document.createElement(
                        "section"
                    );


                card.className =
                    "setup-card";


                card.innerHTML = `

                    <div class="setup-name">
                        ${pattern.name}
                    </div>

                    <p>
                        ${pattern.description}
                    </p>

                    <div class="section-label">
                        CONFIRMATION
                    </div>

                    <p>
                        ${pattern.confirmation}
                    </p>

                    <div class="section-label">
                        INVALIDATION
                    </div>

                    <p>
                        ${pattern.invalidation}
                    </p>

                `;


                library.appendChild(card);

            }
        );

    }

};
