import Album from "./model/album.js";
import { VERSION } from "./version.js";

const API = "https://api.intercambialaminas.com";
const COLLECTION_ID = 2633;
const tokenPattern = /^([A-Za-z0-9-]+)(?:\((\d+)\))?$/;
let album = null;

const baseMissing = document.getElementById("calculatorBaseMissing");
const baseAvailable = document.getElementById("calculatorBaseAvailable");
const figuritasInput = document.getElementById("calculatorFiguritasInput");
const intercambialaminasMode = document.getElementById("calculatorIntercambialaminasMode");
const figuritasMode = document.getElementById("calculatorFiguritasMode");
const operandMissing = document.getElementById("calculatorOperandMissing");
const operandAvailable = document.getElementById("calculatorOperandAvailable");
const profileId = document.getElementById("calculatorIntercambialaminasId");
const resultMissing = document.getElementById("calculatorResultMissing");
const resultAvailable = document.getElementById("calculatorResultAvailable");
const figuritasResult = document.getElementById("calculatorFiguritasResult");
const resultTitle = document.getElementById("calculatorResultTitle");
const copyMissingButton = document.getElementById("calculatorCopyMissing");
const copyAvailableButton = document.getElementById("calculatorCopyAvailable");
const copyFiguritasButton = document.getElementById("calculatorCopyFiguritas");
const translateButton = document.getElementById("calculatorTranslateButton");
const baseModes = document.querySelectorAll("input[name=calculatorBaseMode]");

document.getElementById("version").textContent = `v${VERSION}`;
window.addEventListener("DOMContentLoaded", initialize);

async function initialize() {
    document.getElementById("calculatorImportButton").addEventListener("click", importBase);
    document.getElementById("calculatorAddButton").addEventListener("click", () => operate(1, "Suma de colecciones"));
    document.getElementById("calculatorSubtractButton").addEventListener("click", () => operate(-1, "Resta de colecciones"));
    document.getElementById("calculatorTranslateButton").addEventListener("click", translateBase);
    copyMissingButton.addEventListener("click", () => copyText(resultMissing.value, copyMissingButton, "Copiar faltantes"));
    copyAvailableButton.addEventListener("click", () => copyText(resultAvailable.value, copyAvailableButton, "Copiar repetidas"));
    copyFiguritasButton.addEventListener("click", () => copyText(figuritasResult.value, copyFiguritasButton, "Copiar exportación"));
    baseModes.forEach(mode => mode.addEventListener("change", updateBaseMode));
    updateBaseMode();

    try {
        const response = await fetch("mundial-2026.json");
        if (!response.ok) throw new Error("No fue posible cargar mundial-2026.json");
        album = new Album(await response.json());
    } catch (error) {
        alert(error.message);
    }
}

function normalize(code) {
    const value = code.trim().toUpperCase();
    return value === "0" ? "FWC0" : value;
}

function parseList(text) {
    if (!album) throw new Error("El catálogo aún se está cargando.");
    const counter = new Map();
    for (const token of text.split(",").map(value => value.trim()).filter(Boolean)) {
        const match = token.match(tokenPattern);
        if (!match) throw new Error(`Código inválido: ${token}`);
        const code = normalize(match[1]);
        if (!album.has(code)) throw new Error(`La lámina ${code} no existe.`);
        const amount = Number.parseInt(match[2] || "1", 10);
        counter.set(code, (counter.get(code) || 0) + amount);
    }
    return counter;
}

function readCollection(missing, available) {
    return { missing: parseList(missing.value), available: parseList(available.value) };
}

function getBaseMode() {
    return document.querySelector("input[name=calculatorBaseMode]:checked").value;
}

function updateBaseMode() {
    const figuritas = getBaseMode() === "figuritas";
    intercambialaminasMode.hidden = figuritas;
    figuritasMode.hidden = !figuritas;
    translateButton.textContent = figuritas
        ? "Convertir a IntercambiaLáminas"
        : "Convertir a Figuritas App";
}

function parseFiguritasExport(text) {
    const sections = { missing: [], available: [] };
    let currentSection = null;

    for (const rawLine of text.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line) continue;
        if (/^Me faltan$/i.test(line)) { currentSection = "missing"; continue; }
        if (/^Repetidas$/i.test(line)) { currentSection = "available"; continue; }
        if (!currentSection) continue;

        const match = line.match(/^([A-Za-z]{2,3})\b[^:]*:\s*(.+)$/);
        if (!match) continue;
        const group = match[1].toUpperCase();
        for (const token of match[2].split(",").map(value => value.trim()).filter(Boolean)) {
            const number = token.match(/^(\d+)(?:\((\d+)\))?$/);
            if (!number) throw new Error(`Formato inválido en Figuritas App: ${line}`);
            const code = group === "CC" ? `CC${number[1]}-LAM` : `${group}${number[1]}`;
            sections[currentSection].push(number[2] ? `${code}(${number[2]})` : code);
        }
    }

    return {
        missing: parseList(sections.missing.join(",")),
        available: parseList(sections.available.join(","))
    };
}

function readBaseCollection() {
    return getBaseMode() === "figuritas"
        ? parseFiguritasExport(figuritasInput.value)
        : readCollection(baseMissing, baseAvailable);
}

function applyCounter(base, operand, multiplier) {
    const result = new Map(base);
    for (const [code, amount] of operand) {
        const total = (result.get(code) || 0) + amount * multiplier;
        if (total > 0) result.set(code, total);
        else result.delete(code);
    }
    return result;
}

function formatCounter(counter) {
    return [...counter.entries()]
        .map(([code, amount]) => amount > 1 ? `${code}(${amount})` : code)
        .join(", ");
}

function operate(multiplier, title) {
    try {
        const base = readBaseCollection();
        const operand = readCollection(operandMissing, operandAvailable);
        resultMissing.value = formatCounter(applyCounter(base.missing, operand.missing, multiplier));
        resultAvailable.value = formatCounter(applyCounter(base.available, operand.available, multiplier));
        resultTitle.textContent = title;
        updateIntercambialaminasCopyButtons();
    } catch (error) {
        alert(error.message);
    }
}

function toFiguritasGroup(code) {
    const cc = code.match(/^CC(\d+)-LAM$/);
    if (cc) return { group: "CC", number: cc[1] };
    const match = code.match(/^([A-Z]{2,3})(\d+)$/);
    if (!match) throw new Error(`No se puede convertir ${code} a Figuritas App.`);
    return { group: match[1], number: match[2] };
}

function formatFiguritasSection(title, counter) {
    const groups = new Map();
    for (const [code, amount] of counter) {
        const { group, number } = toFiguritasGroup(code);
        if (!groups.has(group)) groups.set(group, []);
        groups.get(group).push(amount > 1 ? `${number}(${amount})` : number);
    }
    return [title, ...[...groups.entries()].map(([group, values]) => `${group}: ${values.join(", ")}`)].join("\n");
}

function translateBase() {
    try {
        const base = readBaseCollection();
        if (getBaseMode() === "figuritas") {
            resultMissing.value = formatCounter(base.missing);
            resultAvailable.value = formatCounter(base.available);
            resultTitle.textContent = "Lista para IntercambiaLáminas";
            updateIntercambialaminasCopyButtons();
            return;
        }
        figuritasResult.value = [
            "Figuritas App - Lista",
            formatFiguritasSection("Me faltan", base.missing),
            "",
            formatFiguritasSection("Repetidas", base.available)
        ].join("\n");
        copyFiguritasButton.disabled = false;
    } catch (error) {
        alert(error.message);
    }
}

function parseUserId(value) {
    const match = value.trim().match(/(?:\/user\/)?(\d+)(?:\/?(?:\?.*)?)?$/i);
    if (!match) throw new Error("Ingresa un ID de usuario válido o el enlace de su perfil.");
    return match[1];
}

async function importBase() {
    try {
        if (!album) throw new Error("El catálogo aún se está cargando. Inténtalo nuevamente en unos segundos.");
        const userId = parseUserId(profileId.value);
        const response = await fetch(`${API}/v2/users/${userId}/collections/${COLLECTION_ID}?include=publisher`, { headers: { Accept: "application/json" } });
        if (!response.ok) throw new Error(`IntercambiaLáminas no pudo obtener los datos (HTTP ${response.status}).`);
        const data = (await response.json()).data;
        baseMissing.value = formatCounter(externalListToCounter(data.wishlist));
        baseAvailable.value = formatCounter(externalListToCounter(data.tradelist));
    } catch (error) {
        alert(error.message);
    }
}

function externalListToCounter(items) {
    const counter = new Map();
    for (const item of Array.isArray(items) ? items : []) {
        const code = externalCode(item);
        if (!code) continue;
        const candidate = Number(item?.quantity ?? item?.count ?? item?.amount ?? 1);
        const amount = Number.isInteger(candidate) && candidate > 0 ? candidate : 1;
        counter.set(code, (counter.get(code) || 0) + amount);
    }
    return counter;
}

function externalCode(item) {
    if (typeof item === "string") {
        const code = normalize(item);
        return album.has(code) ? code : null;
    }
    if (!item || typeof item !== "object") return null;
    const direct = item.code ?? item.stickerCode ?? item.itemCode;
    if (direct) {
        const code = normalize(String(direct));
        if (album.has(code)) return code;
    }
    if (item.group !== undefined && item.number !== undefined) {
        const code = normalize(`${item.group}${item.number}`);
        if (album.has(code)) return code;
    }
    for (const value of Object.values(item)) {
        if (typeof value === "string") {
            const code = normalize(value);
            if (album.has(code)) return code;
        }
    }
    return null;
}

function updateIntercambialaminasCopyButtons() {
    copyMissingButton.disabled = !resultMissing.value.trim();
    copyAvailableButton.disabled = !resultAvailable.value.trim();
}

async function copyText(text, button, originalLabel) {
    if (!text.trim()) return;
    try {
        if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
        else throw new Error("Clipboard API no disponible.");
        button.textContent = "¡Copiado!";
        window.setTimeout(() => { button.textContent = originalLabel; }, 2000);
    } catch (error) {
        alert("No fue posible copiar el resultado.");
    }
}
