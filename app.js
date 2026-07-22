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

const personasSection = document.querySelector(".personas");
const figuritasMode = document.getElementById("figuritasMode");
const intercambialaminasMode = document.getElementById("intercambialaminasMode");

const aIntercambialaminasId = document.getElementById("aIntercambialaminasId");
const bIntercambialaminasId = document.getElementById("bIntercambialaminasId");

const aFiguritas = document.getElementById("aFiguritas");
const bFiguritas = document.getElementById("bFiguritas");
const inputModes = document.querySelectorAll("input[name=inputMode]");

const calculateButton = document.getElementById("calculateButton");

const resultADirect = document.getElementById("resultADirect");
const resultBDirect = document.getElementById("resultBDirect");
const resultAMatch = document.getElementById("resultAMatch");
const resultBMatch = document.getElementById("resultBMatch");

const titleADirect = document.getElementById("titleADirect");
const titleBDirect = document.getElementById("titleBDirect");
const titleAMatch = document.getElementById("titleAMatch");
const titleBMatch = document.getElementById("titleBMatch");
const copyButtons = document.querySelectorAll(".copy-result");

const calculationStatus = document.getElementById("calculationStatus");

const INTERCAMBIALAMINAS_API = "https://api.intercambialaminas.com";
const WORLD_CUP_2026_COLLECTION_ID = 2633;


// ======================================================
// Inicio
// ======================================================

window.addEventListener("DOMContentLoaded", initialize);

async function initialize() {

    calculateButton.addEventListener("click", calculate);
    inputModes.forEach(radio =>
        radio.addEventListener("change", updateInputMode)
    );
    copyButtons.forEach(button =>
        button.addEventListener("click", () => copyResult(button))
    );

    updateInputMode();

    try {

        await loadCatalog();

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

    console.log("Antes:", code);

    code = code.trim().toUpperCase();

    if (code === "0") {
        return "FWC0";
    }

    console.log("Después:", code);

    return code;

}

function expandStickerToken(token) {

    const match = token.match(stickerTokenRegex);

    if (!match) {
        throw new Error(`Código inválido: ${token}`);
    }

    const code = normalizeStickerCode(match[1]);
    const count = parseInt(match[2] || "1", 10);

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

function parseFiguritasExport(text) {

    const sections = {
        missing: [],
        available: []
    };

    let currentSection = null;

    for (const rawLine of text.split(/\r?\n/)) {

        const line = rawLine.trim();

        if (!line) {
            continue;
        }

        if (/^Me faltan$/i.test(line)) {
            currentSection = "missing";
            continue;
        }

        if (/^Repetidas$/i.test(line)) {
            currentSection = "available";
            continue;
        }

        if (!currentSection) {
            continue;
        }

        const match = line.match(/^([A-Za-z]{2,3})\b[^:]*:\s*(.+)$/);

        if (!match) {
            continue;
        }

        const group = match[1].toUpperCase();
        const tokens = match[2]
            .split(",")
            .map(token => token.trim())
            .filter(Boolean);

        for (const token of tokens) {

            const numberMatch = token.match(/^(\d+)(?:\((\d+)\))?$/);

            if (!numberMatch) {
                throw new Error(
                    `Formato inválido en Figuritas App: ${line}`
                );
            }

            const code = group === "CC"
                ? `CC${numberMatch[1]}-LAM`
                : `${group}${numberMatch[1]}`;

            const count = numberMatch[2];

            sections[currentSection].push(
                count ? `${code}(${count})` : code
            );

        }

    }

    if (sections.missing.length === 0) {
        throw new Error(
            "No se encontraron láminas en la sección 'Me faltan'."
        );
    }

    if (sections.available.length === 0) {
        throw new Error(
            "No se encontraron láminas en la sección 'Repetidas'."
        );
    }

    return {
        missingText: sections.missing.join(","),
        availableText: sections.available.join(",")
    };

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


function formatList(list, counter = null, quantityThreshold = 2) {

    if (list.length === 0) {
        return "-";
    }

    return list
        .map(code => {

            const count = counter ? counter.get(code) : 0;

            return count >= quantityThreshold
                ? `${code}(${count})`
                : code;

        })
        .join(", ");

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

function getInputMode() {

    return document.querySelector(
        "input[name=inputMode]:checked"
    ).value;

}

function updateInputMode() {

    const figuritas = getInputMode() === "figuritas";

    personasSection.hidden = figuritas;
    figuritasMode.hidden = !figuritas;

}

function clearResults() {

    resultADirect.textContent = "-";
    resultBDirect.textContent = "-";
    resultAMatch.textContent = "-";
    resultBMatch.textContent = "-";

    updateCopyButtons();

}

function updateCopyButtons() {

    copyButtons.forEach(button => {

        const result = document.getElementById(
            button.dataset.resultId
        );

        button.disabled = result.textContent.trim() === "-";
        button.textContent = "Copiar resultado";

    });

}

async function copyResult(button) {

    const result = document.getElementById(
        button.dataset.resultId
    );

    const text = result.textContent.trim();

    if (!text || text === "-") {
        return;
    }

    try {

        await copyText(text);

        button.textContent = "Â¡Copiado!";

        window.setTimeout(() => {
            button.textContent = "Copiar resultado";
        }, 2000);

    }
    catch (error) {

        alert("No fue posible copiar el resultado.");
        console.error(error);

    }

}

async function copyText(text) {

    if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return;
    }

    const temporaryInput = document.createElement("textarea");

    temporaryInput.value = text;
    temporaryInput.setAttribute("readonly", "");
    temporaryInput.style.position = "fixed";
    temporaryInput.style.opacity = "0";

    document.body.appendChild(temporaryInput);
    temporaryInput.select();

    const copied = document.execCommand("copy");

    temporaryInput.remove();

    if (!copied) {
        throw new Error("Clipboard API no disponible.");
    }

}


function calculate() {

    try {

        let personA;
        let personB;

        if (getInputMode() === "manual") {

            personA = createTradeState(
                "A",
                parseTokenList(aMissing.value),
                buildCounter(
                    parseTokenList(aAvailable.value)
                )
            );

            personB = createTradeState(
                "B",
                parseTokenList(bMissing.value),
                buildCounter(
                    parseTokenList(bAvailable.value)
                )
            );

        }
        else {

            const dataA = parseFiguritasExport(aFiguritas.value);
            const dataB = parseFiguritasExport(bFiguritas.value);

            personA = createTradeState(
                "A",
                parseTokenList(dataA.missingText),
                buildCounter(
                    parseTokenList(dataA.availableText)
                )
            );

            personB = createTradeState(
                "B",
                parseTokenList(dataB.missingText),
                buildCounter(
                    parseTokenList(dataB.availableText)
                )
            );

        }

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
            formatList(
                plan.directFromA,
                personA.available
            );

        resultBDirect.textContent =
            formatList(
                plan.directFromB,
                personB.available
            );

        resultAMatch.textContent =
            formatList(
                plan.repeatedBAgainstAUnique,
                personB.available,
                3
            );

        resultBMatch.textContent =
            formatList(
                plan.repeatedAAgainstBUnique,
                personA.available,
                3
            );

        updateCopyButtons();

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
