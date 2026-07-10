// =====================================
// Variables globales
// =====================================

let catalog = [];
let universe = [];
let universeSet = new Set();


// =====================================
// Referencias HTML
// =====================================

const aMissing = document.getElementById("aMissing");
const aAvailable = document.getElementById("aAvailable");

const bMissing = document.getElementById("bMissing");
const bAvailable = document.getElementById("bAvailable");

const calculateButton = document.getElementById("calculateButton");

const resultADirect = document.getElementById("resultADirect");
const resultBDirect = document.getElementById("resultBDirect");

const resultAMatch = document.getElementById("resultAMatch");
const resultBMatch = document.getElementById("resultBMatch");


// =====================================
// Inicialización
// =====================================

window.addEventListener("DOMContentLoaded", initialize);


async function initialize() {

    await loadCatalog();

    calculateButton.addEventListener("click", calculate);

    console.log(`Catálogo cargado (${universe.length} láminas)`);

}


// =====================================
// Catálogo
// =====================================

async function loadCatalog() {

    const response = await fetch("mundial-2026.json");

    const data = await response.json();

    buildUniverse(data);

}


function buildUniverse(data) {

    catalog = data;

    universe = [];

    // grupos normales

    for (const [group, numbers] of Object.entries(data.groups)) {

        numbers.forEach(number => {

            universe.push(`${group}${number}`);

        });

    }

    // CC

    data.CC.forEach(item => {

        universe.push(item.name);

    });

    universeSet = new Set(universe);

}

// =====================================
// Parser
// =====================================

const stickerTokenRegex = /^([A-Za-z0-9-]+)(?:\((\d+)\))?$/;


/**
 * Convierte:
 * RSA3 -> ["RSA3"]
 * RSA3(3) -> ["RSA3","RSA3","RSA3"]
 */
function expandStickerToken(token) {

    const match = token.match(stickerTokenRegex);

    if (!match) {
        throw new Error(`Código inválido: ${token}`);
    }

    const code = match[1];
    const count = parseInt(match[2] || "1", 10);

    return Array(count).fill(code);

}


/**
 * Convierte un textarea en una lista expandida.
 */
function parseTokenList(text) {

    const result = [];

    const tokens = text
        .split(",")
        .map(t => t.trim())
        .filter(t => t.length);

    for (const token of tokens) {

        const expanded = expandStickerToken(token);

        for (const sticker of expanded) {

            if (!universeSet.has(sticker)) {
                throw new Error(`La lámina ${sticker} no existe.`);
            }

            result.push(sticker);

        }

    }

    return result;

}

// =====================================
// Utilidades
// =====================================

function filterUniverse(predicate) {
    return universe.filter(predicate);
}

function buildCounter(list) {

    const counter = new Map();

    for (const item of list) {
        counter.set(item, (counter.get(item) || 0) + 1);
    }

    return counter;
}


// =====================================
// Cálculo principal
// =====================================

function calculate() {

    try {

        const personA = createTradeState(
            "A",
            parseTokenList(aMissing.value),
            buildCounter(
                parseTokenList(aAvailable.value)
            )
        );

        const personB = createTradeState(
            "B",
            parseTokenList(bMissing.value),
            buildCounter(
                parseTokenList(bAvailable.value)
            )
        );

        const plan = buildTradePlan(personA, personB);

        resultADirect.textContent =
            plan.directFromA.join(", ");

        resultBDirect.textContent =
            plan.directFromB.join(", ");

        resultAMatch.textContent =
            plan.repeatedBAgainstAUnique.join(", ");

        resultBMatch.textContent =
            plan.repeatedAAgainstBUnique.join(", ");

    }
    catch(error) {

        alert(error.message);

    }

}

// =====================================
// Modelo de datos
// =====================================

function createTradeState(name, missingList, availableCounter) {

    const missing = new Set(missingList);

    // Láminas repetidas (2 o más)
    const repeated = new Set();

    for (const [sticker, count] of availableCounter) {
        if (count >= 2) {
            repeated.add(sticker);
        }
    }

    // Todo lo que ofrece (al menos una disponible)
    const offerable = new Set(availableCounter.keys());

    // Todas las que posee
    const owned = new Set(universe);

    for (const sticker of missing) {
        owned.delete(sticker);
    }

    // Poseídas excluyendo las repetidas
    const ownedWithoutRepeats = new Set(owned);

    for (const sticker of repeated) {
        ownedWithoutRepeats.delete(sticker);
    }

    return {
        name,
        missing,
        available: availableCounter,
        repeated,
        offerable,
        owned,
        ownedWithoutRepeats
    };

}

// =====================================
// Operaciones sobre Set
// =====================================

function intersection(a, b) {

    const result = new Set();

    for (const value of a) {
        if (b.has(value)) {
            result.add(value);
        }
    }

    return result;

}

function difference(a, b) {

    const result = new Set();

    for (const value of a) {
        if (!b.has(value)) {
            result.add(value);
        }
    }

    return result;

}

function sortByAlbum(items) {

    return [...items].sort(
        (a, b) =>
            universe.indexOf(a) -
            universe.indexOf(b)
    );

}

// =====================================
// Algoritmo principal
// =====================================

function buildTradePlan(personA, personB) {

    const directFromA = filterUniverse(code =>
        personA.offerable.has(code) &&
        personB.missing.has(code)
    );

    const directFromB = filterUniverse(code =>
        personB.offerable.has(code) &&
        personA.missing.has(code)
    );

    const repeatedAAgainstBUnique = filterUniverse(code =>
        personA.repeated.has(code) &&
        personB.ownedWithoutRepeats.has(code)
    );

    const repeatedBAgainstAUnique = filterUniverse(code =>
        personB.repeated.has(code) &&
        personA.ownedWithoutRepeats.has(code)
    );

    return {
        directFromA,
        directFromB,
        repeatedAAgainstBUnique,
        repeatedBAgainstAUnique
    };

}