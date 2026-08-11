// ======================================================
// Intercambio de Láminas Mundial 2026
// app.js
// ======================================================

// ======================================================
// Importaciones de modelos
// ======================================================

import Album from "./model/album.js";
import AlbumState from "./model/albumState.js";
import TradePlanner from "./model/tradePlanner.js";
import {
    clearSharedTradeUrl,
    createSharedTradeUrl,
    readSharedTradeUrl
} from "./shareLink.js";

// ======================================================
// Versión
// ======================================================
import { VERSION } from "./version.js";

document.getElementById("version").textContent =
    `v${VERSION}`;

// ======================================================
// Variables globales
// ======================================================

let album = null;
let aProfileName = "";
let bProfileName = "";
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

const aIntercambialaminasId = document.getElementById("aIntercambialaminasId");
const bIntercambialaminasId = document.getElementById("bIntercambialaminasId");
const aImportedProfile = document.getElementById("aImportedProfile");
const bImportedProfile = document.getElementById("bImportedProfile");
const aImportButton =
    document.getElementById("aImportButton");

const bImportButton =
    document.getElementById("bImportButton");

const aFiguritas = document.getElementById("aFiguritas");
const bFiguritas = document.getElementById("bFiguritas");
const inputModes = document.querySelectorAll("input[name=inputMode]");
const shareInputs = [
    aMissing,
    aAvailable,
    bMissing,
    bAvailable,
    aFiguritas,
    bFiguritas
];

const calculateButton = document.getElementById("calculateButton");
const shareButton = document.getElementById("shareButton");

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

    aImportButton.addEventListener("click", () => importPerson("A")
    );

    bImportButton.addEventListener("click", () => importPerson("B")
    );
    calculateButton.addEventListener("click", calculate);
    shareButton.addEventListener("click", shareTrade);
    inputModes.forEach(radio =>
        radio.addEventListener("change", () => {
            updateInputMode();
            invalidateShare();
        })
    );
    shareInputs.forEach(input =>
        input.addEventListener("input", invalidateShare)
    );
    copyButtons.forEach(button =>
        button.addEventListener("click", () => copyResult(button))
    );

    updateInputMode();

    try {

        await loadCatalog();

        loadSharedTrade();

        console.log(`Catálogo cargado (${album.size} láminas)`);

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

    const catalog = await response.json();

    album = new Album(catalog);

}


// ======================================================
// Parser
// ======================================================

function normalizeStickerCode(code) {

    code = code.trim().toUpperCase();

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

            if (!album.has(sticker)) {

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
// Intercambialaminas ID api parsing
// ======================================================

function parseIntercambialaminasUserId(value) {

    const match = value.trim().match(/(?:\/user\/)?(\d+)(?:\/?(?:\?.*)?)?$/i);

    if (!match) {
        throw new Error("Ingresa un ID de usuario válido o el enlace de su perfil.");
    }

    return match[1];

}

async function fetchIntercambialaminasJson(path) {

    let response;

    try {
        response = await fetch(`${INTERCAMBIALAMINAS_API}${path}`, {
            headers: { Accept: "application/json" }
        });
    }
    catch (error) {
        throw new Error(
            "No fue posible conectar con Intercambialaminas.com. " +
            "Revisa tu conexión e inténtalo nuevamente."
        );
    }

    if (!response.ok) {
        throw new Error(
            `Intercambialaminas.com no pudo obtener los datos (HTTP ${response.status}).`
        );
    }

    return response.json();

}

function getExternalItemCount(item) {

    const count = Number(item?.quantity ?? item?.count ?? item?.amount ?? 1);

    return Number.isInteger(count) && count > 0 ? count : 1;

}

function findStickerCodeInExternalItem(item) {

    if (typeof item === "string") {
        const normalized = normalizeStickerCode(item);
        return album.has(normalized) ? normalized : null;
    }

    if (!item || typeof item !== "object") {
        return null;
    }

    const directCode = item.code ?? item.stickerCode ?? item.itemCode;

    if (directCode) {
        const normalized = normalizeStickerCode(String(directCode));

        if (album.has(normalized)) {
            return normalized;
        }
    }

    const group = item.group ?? item.prefix ?? item.countryCode;
    const number = item.number ?? item.itemNumber;

    if (group !== undefined && number !== undefined) {
        const normalized = normalizeStickerCode(`${group}${number}`);

        if (album.has(normalized)) {
            return normalized;
        }
    }

    for (const value of Object.values(item)) {
        if (typeof value === "string") {
            const normalized = normalizeStickerCode(value);

            if (album.has(normalized)) {
                return normalized;
            }
        }
    }

    return null;

}

function externalListToStickers(items) {

    if (!Array.isArray(items)) {
        return [];
    }

    const stickers = [];

    for (const item of items) {
        const code = findStickerCodeInExternalItem(item);

        if (code) {
            stickers.push(...Array(getExternalItemCount(item)).fill(code));
        }
    }

    return stickers;

}


async function loadIntercambialaminasLists(value) {

    const userId =
        parseIntercambialaminasUserId(value);

    const [result, profileResult] = await Promise.all([
        fetchIntercambialaminasJson(
            `/v2/users/${userId}/collections/${WORLD_CUP_2026_COLLECTION_ID}?include=publisher`
        ),
        fetchIntercambialaminasJson(`/v2/users/${userId}`)
    ]);

    const data = result.data;

    const missing =
        externalListToStickers(data.wishlist);

    const available =
        externalListToStickers(data.tradelist);

    return {
        missing,
        available,
        profileName: getProfileName(profileResult.data)
    };

}

function getProfileName(data) {

    const profile =
        data.user ?? data.profile ?? data.owner ?? data.user_profile ?? {};

    const candidates = [
        data.displayName,
        data.display_name,
        profile.name,
        profile.full_name,
        profile.display_name,
        data.user_name,
        data.username,
        data.name
    ];

    return candidates.find(value =>
        typeof value === "string" && value.trim()
    )?.trim() || "";

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


function formatList(indices, person, quantityThreshold = 2) {

    if (indices.length === 0) {
        return "-";
    }

    return indices
        .map(index => {

            const code = album.getCode(index);
            const count = person.getOfferByIndex(index);

            return count >= quantityThreshold
                ? `${code}(${count})`
                : code;

        })
        .join(", ");

}

function hasMissingStickers(person) {

    for (const entry of person.entries()) {
        if (entry.missing > 0) {
            return true;
        }
    }

    return false;

}

function hasDoubleOffers(person) {

    for (const entry of person.entries()) {
        if (entry.offer >= 2) {
            return true;
        }
    }

    return false;

}

function setResult(result, text, copyable = false) {

    result.textContent = text;
    result.dataset.copyable = String(copyable);

}

function formatDirectResult(indices, donor, recipient) {

    if (!hasMissingStickers(recipient)) {
        return `${recipient.name} no tiene láminas faltantes. ` +
            "Si ya completó el álbum, sus repetidas aún pueden ayudar a la otra persona.";
    }

    return formatList(indices, donor);

}

function formatDoubleResult(indices, donor) {

    if (!hasDoubleOffers(donor)) {
        return `${donor.name} no tiene repetidas con cantidad 2 o más. ` +
            "Agrega la frecuencia, por ejemplo ARG3(2), para buscar este tipo de match.";
    }

    return formatList(indices, donor, 3);

}

function pluralize(quantity, singular, plural) {

    return quantity === 1 ? singular : plural;

}

function formatStickerList(list) {

    const counter =
        buildCounter(list);

    return [...counter.entries()]
        .map(([code, count]) =>

            count > 1
                ? `${code}(${count})`
                : code

        )
        .join(", ");

}

// ======================================================
// Modelo
// ======================================================

function createAlbumState(name, missingList, availableCounter) {

    const person = new AlbumState(album, name);

    // Láminas buscadas
    for (const sticker of missingList) {
        person.addMissing(sticker);
    }

    // Láminas ofrecidas
    for (const [sticker, count] of availableCounter) {
        person.addOffer(sticker, count);
    }

    return person;

}


// ======================================================
// Interfaz
// ======================================================

function getInputMode() {

    return document.querySelector(
        "input[name=inputMode]:checked"
    ).value;

}

async function importPerson(letter) {

    try {

        if (!album) {
            throw new Error(
                "El catálogo aún se está cargando. Inténtalo nuevamente en unos segundos."
            );
        }

        const idInput =
            letter === "A"
                ? aIntercambialaminasId
                : bIntercambialaminasId;

        const missingBox =
            letter === "A"
                ? aMissing
                : bMissing;

        const availableBox =
            letter === "A"
                ? aAvailable
                : bAvailable;

        const data =
            await loadIntercambialaminasLists(
                idInput.value
            );

        missingBox.value =
            formatStickerList(data.missing);

        availableBox.value =
            formatStickerList(data.available);

        if (letter === "A") {
            aProfileName = data.profileName;
        }
        else {
            bProfileName = data.profileName;
        }

        updateImportedProfileLabels();

        invalidateShare();

    }

    catch(error){

        alert(error.message);

    }

}

function updateInputMode() {

    const mode = getInputMode();

    personasSection.hidden = mode !== "manual";

    figuritasMode.hidden =
        mode !== "figuritas";

}

function loadSharedTrade() {

    try {

        const trade = readSharedTradeUrl();

        if (!trade) {
            return;
        }

        document.querySelector(
            `input[name=inputMode][value=${trade.mode}]`
        ).checked = true;

        if (trade.mode === "figuritas") {
            aFiguritas.value = trade.aFiguritas;
            bFiguritas.value = trade.bFiguritas;
        }
        else {
            aMissing.value = trade.aMissing;
            aAvailable.value = trade.aAvailable;
            bMissing.value = trade.bMissing;
            bAvailable.value = trade.bAvailable;
        }

        updateInputMode();
        aProfileName = trade.aProfileName;
        bProfileName = trade.bProfileName;
        updateImportedProfileLabels();
        clearSharedTradeUrl();
        calculate();

    }
    catch (error) {

        clearSharedTradeUrl();
        alert(error.message);
        console.error(error);

    }

}

function clearResults() {

    setResult(resultADirect, "-");
    setResult(resultBDirect, "-");
    setResult(resultAMatch, "-");
    setResult(resultBMatch, "-");

    updateCopyButtons();
    shareButton.disabled = true;

}

function updateCopyButtons() {

    copyButtons.forEach(button => {

        const result = document.getElementById(
            button.dataset.resultId
        );

        button.disabled = result.dataset.copyable !== "true";
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

        button.textContent = "¡Copiado!";

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

function invalidateShare() {

    shareButton.disabled = true;
    shareButton.textContent = "Copiar enlace del intercambio";

}

function updateImportedProfileLabels() {

    const profiles = [
        [aImportedProfile, aProfileName],
        [bImportedProfile, bProfileName]
    ];

    for (const [element, profileName] of profiles) {
        element.hidden = !profileName;
        element.textContent = profileName
            ? ` - Perfil importado: ${profileName}`
            : "";
    }

}

async function shareTrade() {

    try {

        const mode = getInputMode();
        const link = createSharedTradeUrl({
            mode,
            aMissing: aMissing.value,
            aAvailable: aAvailable.value,
            bMissing: bMissing.value,
            bAvailable: bAvailable.value,
            aFiguritas: aFiguritas.value,
            bFiguritas: bFiguritas.value,
            aProfileName,
            bProfileName
        });

        await copyText(link);

        shareButton.textContent = "¡Enlace copiado!";

        window.setTimeout(() => {
            shareButton.textContent = "Copiar enlace del intercambio";
        }, 2000);

    }
    catch (error) {

        alert("No fue posible copiar el enlace del intercambio.");
        console.error(error);

    }

}


async function calculate() {

    try {

        let personA;
        let personB;
        const mode = getInputMode();

        if (mode === "manual") {

            personA = createAlbumState(
                "A",
                parseTokenList(aMissing.value),
                buildCounter(
                    parseTokenList(aAvailable.value)
                )
            );

            personB = createAlbumState(
                "B",
                parseTokenList(bMissing.value),
                buildCounter(
                    parseTokenList(bAvailable.value)
                )
            );

        }
        else if (mode === "figuritas") {

            const dataA = parseFiguritasExport(aFiguritas.value);
            const dataB = parseFiguritasExport(bFiguritas.value);

            personA = createAlbumState(
                "A",
                parseTokenList(dataA.missingText),
                buildCounter(
                    parseTokenList(dataA.availableText)
                )
            );

            personB = createAlbumState(
                "B",
                parseTokenList(dataB.missingText),
                buildCounter(
                    parseTokenList(dataB.availableText)
                )
            );

        }

        const plan = TradePlanner.calculate(personA, personB);

        console.log(plan);

        titleADirect.textContent =
            `A puede cambiarle ${plan.directFromA.length} ${
                pluralize(plan.directFromA.length, "lámina", "láminas")
            } a B`;

        titleBDirect.textContent =
            `B puede cambiarle ${plan.directFromB.length} ${
                pluralize(plan.directFromB.length, "lámina", "láminas")
            } a A`;

        titleAMatch.textContent =
            `A necesita ${plan.doublesFromB.length} ${
                pluralize(plan.doublesFromB.length, "repetida doble", "repetidas dobles")
            } de B`;

        titleBMatch.textContent =
            `B necesita ${plan.doublesFromA.length} ${
                pluralize(plan.doublesFromA.length, "repetida doble", "repetidas dobles")
            } de A`;

        setResult(
            resultADirect,
            formatDirectResult(plan.directFromA, personA, personB),
            plan.directFromA.length > 0
        );

        setResult(
            resultBDirect,
            formatDirectResult(plan.directFromB, personB, personA),
            plan.directFromB.length > 0
        );

        setResult(
            resultAMatch,
            formatDoubleResult(plan.doublesFromB, personB),
            plan.doublesFromB.length > 0
        );

        setResult(
            resultBMatch,
            formatDoubleResult(plan.doublesFromA, personA),
            plan.doublesFromA.length > 0
        );

        updateCopyButtons();
        shareButton.disabled = false;

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
