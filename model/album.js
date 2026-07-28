// ======================================================
// Album
// ======================================================

export default class Album {

    constructor(catalog) {

        this.catalog = catalog;

        this.stickers = [];
        this.index = new Map();

        this.#buildIndex();

    }

    #buildIndex() {

        let i = 0;

        for (const [group, numbers] of Object.entries(this.catalog.groups)) {

            for (const number of numbers) {

                const code = `${group}${number}`;

                this.stickers.push(code);
                this.index.set(code, i++);

            }

        }

        for (const item of this.catalog.CC) {

            this.stickers.push(item.name);
            this.index.set(item.name, i++);

        }

    }

    has(code) {

        return this.index.has(code);

    }

    getIndex(code) {

        return this.index.get(code);

    }

    getCode(index) {

        return this.stickers[index];

    }

    get size() {

        return this.stickers.length;

    }

    *codes() {

        yield* this.stickers;

    }

}