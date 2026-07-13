// ======================================================
// Intercambio de Láminas Mundial 2026
// app.js
// ======================================================

// ======================================================
// Variables globales
// ======================================================

let catalog = null;
let universe = [];
let universeSet = new Set();

const stickerTokenRegex = /^([A-Za-z0-9-]+)(?:\((\d+)\))?$/;


// ======================================================
// Referencias HTML
// ======================================================

const aMissing = document.getElementById("aMissing");
const aAvailable = document.getElementById("aAvailable");

const bMissing = document.getElementById("bMissing");
const bAvailable = document.getElementById("bAvailable");

const calculateButton = document.getElementById("calculateButton");

const resultADirect = document.getElementById("resultADirect");
const resultBDirect = document.getElementById("resultBDirect");
const resultAMatch = document.getElementById("resultAMatch");
const resultBMatch = document.getElementById("resultBMatch");

const titleADirect = document.getElementById("titleADirect");
const titleBDirect = document.getElementById("titleBDirect");
const titleAMatch = document.getElementById("titleAMatch");
const titleBMatch = document.getElementById("titleBMatch");


// ======================================================
// Inicio
// ======================================================

window.addEventListener("DOMContentLoaded", initialize);

async function initialize() {

    try {

        await loadCatalog();

        calculateButton.addEventListener("click", calculate);

        console.log(`Catálogo cargado (${universe.length} láminas)`);

    }
    catch (error) {

        alert(error.message);

    }

}


// ======================================================
// Catálogo
// ======================================================

async function loadCatalog() {

    const response = await fetch("mundial-2026.json");

    if (!response.ok) {
        throw new Error("No fue posible cargar mundial-2026.json");
    }

    catalog = await response.json();

    buildUniverse();

}

function buildUniverse() {

    universe = [];

    for (const [group, numbers] of Object.entries(catalog.groups)) {

        for (const number of numbers) {

            universe.push(`${group}${number}`);

        }

    }

    for (const item of catalog.CC) {

        universe.push(item.name);

    }

    universeSet = new Set(universe);

}


// ======================================================
// Parser
// ======================================================

function normalizeStickerCode(code) {

    code = code.trim().toUpperCase();

    // Aceptar "0" como "FWC0"
    if (code === "0") {
        return "FWC0";
    }

    return code;

}

function expandStickerToken(token) {

    const match = token.match(stickerTokenRegex);

    if (!match) {

        throw new Error(`Código inválido: ${token}`);

    }

    const code = normalizeStickerCode(match[1]);
    const count = parseInt(match[2] || "1");

    return Array(count).fill(code);

}


function parseTokenList(text) {

    const stickers = [];

    const tokens = text
        .split(",")
        .map(t => t.trim())
        .filter(Boolean);

    for (const token of tokens) {

        const expanded = expandStickerToken(token);

        for (const sticker of expanded) {

            if (!universeSet.has(sticker)) {

                throw new Error(`La lámina ${sticker} no existe.`);

            }

            stickers.push(sticker);

        }

    }

    return stickers;

}


// ======================================================
// Utilidades
// ======================================================

function buildCounter(list) {

    const counter = new Map();

    for (const sticker of list) {

        counter.set(
            sticker,
            (counter.get(sticker) || 0) + 1
        );

    }

    return counter;

}


function filterUniverse(predicate) {

    return universe.filter(predicate);

}


function formatList(list) {

    if (list.length === 0) {
        return "-";
    }

    return list.join(", ");

}


// ======================================================
// Modelo
// ======================================================

function createTradeState(name, missingList, availableCounter) {

    const missing = new Set(missingList);

    const repeated = new Set();

    for (const [sticker, count] of availableCounter) {

        if (count >= 2) {

            repeated.add(sticker);

        }

    }

    const offerable = new Set(
        availableCounter.keys()
    );

    const owned = new Set(universe);

    for (const sticker of missing) {

        owned.delete(sticker);

    }

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

// ======================================================
// Algoritmo
// ======================================================

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


// ======================================================
// Interfaz
// ======================================================

function clearResults() {

    resultADirect.textContent = "-";
    resultBDirect.textContent = "-";
    resultAMatch.textContent = "-";
    resultBMatch.textContent = "-";

}


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

        console.log(plan);

        titleADirect.textContent =
            `A puede cambiarle ${plan.directFromA.length} láminas a B`;

        titleBDirect.textContent =
            `B puede cambiarle ${plan.directFromB.length} láminas a A`;

        titleAMatch.textContent =
            `A necesita ${plan.repeatedBAgainstAUnique.length} repetidas dobles de B`;

        titleBMatch.textContent =
            `B necesita ${plan.repeatedAAgainstBUnique.length} repetidas dobles de A`;

        resultADirect.textContent =
            formatList(plan.directFromA);

        resultBDirect.textContent =
            formatList(plan.directFromB);

        resultAMatch.textContent =
            formatList(plan.repeatedBAgainstAUnique);

        resultBMatch.textContent =
            formatList(plan.repeatedAAgainstBUnique);

    }
    catch (error) {

        clearResults();

        titleADirect.textContent = "A puede cambiarle a B";
        titleBDirect.textContent = "B puede cambiarle a A";
        titleAMatch.textContent = "A necesita repetidas dobles de B";
        titleBMatch.textContent = "B necesita repetidas dobles de A";

        alert(error.message);

        console.error(error);

    }

}