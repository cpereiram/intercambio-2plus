// ======================================================
// Trade Planner
// ======================================================

export default class TradePlanner {

    static calculate(personA, personB) {

        const album = personA.album;

        if (album !== personB.album) {
            throw new Error("Ambas personas deben pertenecer al mismo álbum.");
        }

        const result = {

            directFromA: [],
            directFromB: [],

            doublesFromA: [],
            doublesFromB: []

        };

        for (let i = 0; i < album.size; i++) {

            const aMissing = personA.getMissingByIndex(i);
            const aOffer   = personA.getOfferByIndex(i);

            const bMissing = personB.getMissingByIndex(i);
            const bOffer   = personB.getOfferByIndex(i);

            // ----------------------------
            // Intercambio directo
            // ----------------------------

            if (aOffer > 0 && bMissing > 0) {

                result.directFromA.push(i);

            }

            if (bOffer > 0 && aMissing > 0) {

                result.directFromB.push(i);

            }

            // ----------------------------
            // Repetidas dobles
            // ----------------------------

            const bStuck = (bMissing === 0 && bOffer === 0);

            if (aOffer >= 2 && bStuck) {

                result.doublesFromA.push(i);

            }

            const aStuck = (aMissing === 0 && aOffer === 0);

            if (bOffer >= 2 && aStuck) {

                result.doublesFromB.push(i);

            }

        }

        return result;

    }

}