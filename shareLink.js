const SHARE_VERSION = "3";
const LEGACY_SHARE_VERSION = "1";
const PROFILE_IDS_KEY = "p";

const STICKER_NUMBER_TO_TOKEN = [
    "Z",
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T"
];

const STICKER_TOKEN_TO_NUMBER = new Map(
    STICKER_NUMBER_TO_TOKEN.map((token, number) => [token, number])
);

export function createSharedTradeUrl(trade, album) {
    const url = new URL(window.location.href);
    const profileIds = encodeProfileIds(trade.aProfileId, trade.bProfileId);
    const aMissing = encodeStickerList(trade.aMissing, album);
    const aAvailable = encodeStickerList(trade.aAvailable, album);
    const bMissing = encodeStickerList(trade.bMissing, album);
    const bAvailable = encodeStickerList(trade.bAvailable, album);

    const compact = [
        `share=3${profileIds ? `&${PROFILE_IDS_KEY}=${profileIds}` : ""}`,
        `%a&${aMissing}&${aAvailable}`,
        `%b&${bMissing}&${bAvailable}`
    ].join("");

    url.hash = compact;
    return url.toString();
}

export function readSharedTradeUrl(album) {
    const rawHash = window.location.hash.slice(1);

    if (!rawHash) {
        return null;
    }

    if (rawHash.includes("%a&") || rawHash.includes("%b&")) {
        return readCompactTradeUrl(rawHash, album);
    }

    const params = new URLSearchParams(rawHash);
    const version = params.get("share");

    if (version === SHARE_VERSION) {
        const required = ["am", "ao", "bm", "bo"];

        if (!required.every(key => params.has(key))) {
            throw new Error("El enlace compartido está incompleto.");
        }

        const [aProfileId = "", bProfileId = ""] = decodeProfileIds(
            params.get(PROFILE_IDS_KEY)
        );

        return {
            mode: "manual",
            aMissing: decodeStickerList(params.get("am"), album),
            aAvailable: decodeStickerList(params.get("ao"), album),
            bMissing: decodeStickerList(params.get("bm"), album),
            bAvailable: decodeStickerList(params.get("bo"), album),
            aProfileId,
            bProfileId,
            aProfileName: "",
            bProfileName: ""
        };
    }

    if (version !== LEGACY_SHARE_VERSION) {
        return null;
    }

    const mode = params.get("mode");

    if (mode === "figuritas") {
        if (!params.has("a") || !params.has("b")) {
            throw new Error("El enlace compartido de Figuritas App está incompleto.");
        }

        return {
            mode,
            aFiguritas: params.get("a"),
            bFiguritas: params.get("b"),
            aProfileId: "",
            bProfileId: "",
            aProfileName: params.get("an") || "",
            bProfileName: params.get("bn") || ""
        };
    }

    if (mode === "manual") {
        const required = ["am", "ao", "bm", "bo"];

        if (!required.every(key => params.has(key))) {
            throw new Error("El enlace compartido está incompleto.");
        }

        return {
            mode,
            aMissing: params.get("am"),
            aAvailable: params.get("ao"),
            bMissing: params.get("bm"),
            bAvailable: params.get("bo"),
            aProfileId: "",
            bProfileId: "",
            aProfileName: params.get("an") || "",
            bProfileName: params.get("bn") || ""
        };
    }

    throw new Error("El enlace compartido usa un formato no compatible.");
}

function readCompactTradeUrl(rawHash, album) {
    const [meta, ...sections] = rawHash.split("%");
    const params = new URLSearchParams(meta);
    const version = params.get("share");

    if (version !== SHARE_VERSION) {
        throw new Error("El enlace compartido usa un formato no compatible.");
    }

    const data = {};

    for (const section of sections) {
        const [key, ...values] = section.split("&");

        if (!key || values.length === 0) {
            continue;
        }

        data[key] = values;
    }

    const hasListA = Array.isArray(data.a) && data.a.length >= 2;
    const hasListB = Array.isArray(data.b) && data.b.length >= 2;

    if (!hasListA || !hasListB) {
        throw new Error("El enlace compartido está incompleto.");
    }

    const [aProfileId = "", bProfileId = ""] = decodeProfileIds(
        params.get(PROFILE_IDS_KEY)
    );

    return {
        mode: "manual",
        aMissing: decodeStickerList(data.a[0], album),
        aAvailable: decodeStickerList(data.a[1], album),
        bMissing: decodeStickerList(data.b[0], album),
        bAvailable: decodeStickerList(data.b[1], album),
        aProfileId,
        bProfileId,
        aProfileName: "",
        bProfileName: ""
    };
}

function encodeStickerList(stickers, album) {
    const codec = buildCompactCodec(album);
    const grouped = new Map();

    for (const sticker of stickers) {
        const location = codec.codeToLocation.get(sticker);

        if (!location) {
            throw new Error(`No se puede compartir la lámina ${sticker}.`);
        }

        const groupCounter = grouped.get(location.groupId) || new Map();

        groupCounter.set(
            location.token,
            (groupCounter.get(location.token) || 0) + 1
        );

        grouped.set(location.groupId, groupCounter);
    }

    return [...grouped.entries()]
        .sort(([left], [right]) => left - right)
        .map(([groupId, stickerCounter]) => {
            const body = [...stickerCounter.entries()]
                .sort(([left], [right]) => left - right)
                .map(([token, amount]) => (
                    amount > 1 ? `${token}${amount}` : token
                ))
                .join("");

            return `${groupId}.${body}`;
        })
        .join("|");
}

function decodeStickerList(value, album) {
    if (!value) {
        return [];
    }

    if (value.includes("~")) {
        return decodeLegacyStickerList(value, album);
    }

    const codec = buildCompactCodec(album);
    const stickers = [];

    for (const entry of value.split("|")) {
        if (!entry) {
            continue;
        }

        const dotIndex = entry.indexOf(".");

        if (dotIndex <= 0 || dotIndex === entry.length - 1) {
            throw new Error("El enlace compartido contiene datos inválidos.");
        }

        const groupId = entry.slice(0, dotIndex);
        const body = entry.slice(dotIndex + 1);
        const group = codec.idToGroup.get(groupId);

        if (!group) {
            throw new Error("El enlace compartido contiene datos inválidos.");
        }

        let position = 0;

        while (position < body.length) {
            const token = body[position];

            if (!STICKER_TOKEN_TO_NUMBER.has(token)) {
                throw new Error("El enlace compartido contiene datos inválidos.");
            }

            position += 1;

            let amount = 1;

            if (position < body.length && /[0-9]/.test(body[position])) {
                const start = position;

                while (position < body.length && /[0-9]/.test(body[position])) {
                    position += 1;
                }

                const amountText = body.slice(start, position);

                if (!amountText) {
                    throw new Error("El enlace compartido contiene datos inválidos.");
                }

                amount = Number.parseInt(amountText, 10);
            }

            const code = buildStickerCode(group, STICKER_TOKEN_TO_NUMBER.get(token));

            if (
                !Number.isSafeInteger(amount) ||
                amount < 1 ||
                amount > 255 ||
                !album.has(code)
            ) {
                throw new Error("El enlace compartido contiene datos inválidos.");
            }

            stickers.push(...Array(amount).fill(code));
        }
    }

    return stickers;
}

function decodeLegacyStickerList(value, album) {
    const codec = buildCompactCodec(album);
    const stickers = [];

    for (const entry of value.split("/")) {
        if (!entry) {
            continue;
        }

        const colonIndex = entry.indexOf(":");

        if (colonIndex <= 0 || colonIndex === entry.length - 1) {
            throw new Error("El enlace compartido contiene datos inválidos.");
        }

        const groupId = entry.slice(0, colonIndex);
        const body = entry.slice(colonIndex + 1);
        const group = codec.idToGroup.get(groupId);

        if (!group) {
            throw new Error("El enlace compartido contiene datos inválidos.");
        }

        let position = 0;

        while (position < body.length) {
            const token = body[position];

            if (!STICKER_TOKEN_TO_NUMBER.has(token)) {
                throw new Error("El enlace compartido contiene datos inválidos.");
            }

            position += 1;

            let amount = 1;

            if (body[position] === "~") {
                position += 1;

                const start = position;

                while (position < body.length && /[0-9a-z]/.test(body[position])) {
                    position += 1;
                }

                const amountText = body.slice(start, position);

                if (!amountText) {
                    throw new Error("El enlace compartido contiene datos inválidos.");
                }

                amount = Number.parseInt(amountText, 36);
            }

            const code = buildStickerCode(group, STICKER_TOKEN_TO_NUMBER.get(token));

            if (
                !Number.isSafeInteger(amount) ||
                amount < 1 ||
                amount > 255 ||
                !album.has(code)
            ) {
                throw new Error("El enlace compartido contiene datos inválidos.");
            }

            stickers.push(...Array(amount).fill(code));
        }
    }

    return stickers;
}

function buildCompactCodec(album) {
    const codeToLocation = new Map();
    const idToGroup = new Map();

    let groupIndex = 0;

    for (const [group, numbers] of Object.entries(album.catalog.groups)) {
        const groupId = groupIndex.toString(10).padStart(2, "0");

        idToGroup.set(groupId, group);

        for (const number of numbers) {
            codeToLocation.set(`${group}${number}`, {
                groupId,
                token: encodeStickerNumber(number)
            });
        }

        groupIndex += 1;
    }

    if (Array.isArray(album.catalog.CC) && album.catalog.CC.length > 0) {
        const groupId = groupIndex.toString(10).padStart(2, "0");

        idToGroup.set(groupId, "CC");

        for (const item of album.catalog.CC) {
            const match = item.name.match(/^CC(\d+)-LAM$/);

            if (!match) {
                throw new Error(`No se puede compartir la lámina ${item.name}.`);
            }

            codeToLocation.set(item.name, {
                groupId,
                token: encodeStickerNumber(Number.parseInt(match[1], 10))
            });
        }
    }

    return {
        codeToLocation,
        idToGroup
    };
}

function buildStickerCode(group, number) {
    return group === "CC"
        ? `CC${number}-LAM`
        : `${group}${number}`;
}

function encodeStickerNumber(number) {
    if (!Number.isInteger(number) || number < 0 || number >= STICKER_NUMBER_TO_TOKEN.length) {
        throw new Error(`No se puede compartir la lámina ${number}.`);
    }

    return STICKER_NUMBER_TO_TOKEN[number];
}

function encodeProfileIds(aProfileId, bProfileId) {
    const left = normalizeProfileId(aProfileId);
    const right = normalizeProfileId(bProfileId);

    if (!left && !right) {
        return "";
    }

    return `${left}.${right}`;
}

function decodeProfileIds(value) {
    if (!value) {
        return ["", ""];
    }

    const [left = "", right = ""] = value.split(".");

    return [left, right];
}

function normalizeProfileId(value) {
    return typeof value === "string"
        ? value.trim()
        : String(value || "").trim();
}

export function clearSharedTradeUrl() {
    if (!window.location.hash) {
        return;
    }

    const url = new URL(window.location.href);
    url.hash = "";
    window.history.replaceState(window.history.state, "", url);
}
