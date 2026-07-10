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
// Cálculo principal
// =====================================

function calculate() {

    console.clear();

    console.log("Calculando...");

    console.log(aMissing.value);

}