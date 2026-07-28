// ======================================================
// Album State
// ======================================================

export default class AlbumState {

    constructor(album, name = "") {

        this.album = album;
        this.name = name;

        // Cantidad de láminas buscadas
        this.missing = new Uint8Array(album.size);

        // Cantidad de láminas ofrecidas (repetidas)
        this.offer = new Uint8Array(album.size);

    }

    // ======================================================
    // Missing
    // ======================================================

    addMissing(code, amount = 1) {

        const index = this.album.getIndex(code);

        this.missing[index] += amount;

    }

    removeMissing(code, amount = 1) {

        const index = this.album.getIndex(code);

        this.missing[index] = Math.max(
            0,
            this.missing[index] - amount
        );

    }

    getMissing(code) {

        return this.missing[
            this.album.getIndex(code)
        ];

    }

    addMissingByIndex(index, amount = 1) {

        this.missing[index] += amount;

    }

    removeMissingByIndex(index, amount = 1) {

        this.missing[index] = Math.max(
            0,
            this.missing[index] - amount
        );

    }

    getMissingByIndex(index) {

        return this.missing[index];

    }

    // ======================================================
    // Offer
    // ======================================================

    addOffer(code, amount = 1) {

        const index = this.album.getIndex(code);

        this.offer[index] += amount;

    }

    removeOffer(code, amount = 1) {

        const index = this.album.getIndex(code);

        this.offer[index] = Math.max(
            0,
            this.offer[index] - amount
        );

    }

    getOffer(code) {

        return this.offer[
            this.album.getIndex(code)
        ];

    }

    addOfferByIndex(index, amount = 1) {

    this.offer[index] += amount;

}

removeOfferByIndex(index, amount = 1) {

        this.offer[index] = Math.max(
            0,
            this.offer[index] - amount
        );

    }

    getOfferByIndex(index) {

        return this.offer[index];

    }

    // ======================================================
    // Estado
    // ======================================================

    isMissing(index) {

        return this.missing[index] > 0;

    }

    isOffered(index) {

        return this.offer[index] > 0;

    }

    isDouble(index) {

        return this.offer[index] >= 2;

    }

    isStuck(index) {

        return !this.isMissing(index)
            && !this.isOffered(index);

    }

    // ======================================================
    // Utilidades
    // ======================================================

    clear() {

        this.missing.fill(0);
        this.offer.fill(0);

    }

    *entries() {

        for (let i = 0; i < this.album.size; i++) {

            yield {
                index: i,
                code: this.album.getCode(i),
                missing: this.missing[i],
                offer: this.offer[i]
            };

        }

    }

}