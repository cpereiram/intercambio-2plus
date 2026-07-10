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

function buildCounter(list) {

    const counter = new Map();

    for (const item of list) {

        counter.set(
            item,
            (counter.get(item) || 0) + 1
        );

    }

    return counter;

}


// =====================================
// Cálculo principal
// =====================================

function calculate() {

    try {

        const faltantesA = parseTokenList(aMissing.value);

        const repetidasA = buildCounter(
            parseTokenList(aAvailable.value)
        );

        console.log(faltantesA);

        console.log(repetidasA);

    }
    catch(error) {

        alert(error.message);

    }

}