const SHARE_VERSION = "1";

export function createSharedTradeUrl(trade) {
    const url = new URL(window.location.href);
    const params = new URLSearchParams();

    params.set("share", SHARE_VERSION);
    params.set("mode", trade.mode);

    if (trade.aProfileName) params.set("an", trade.aProfileName);
    if (trade.bProfileName) params.set("bn", trade.bProfileName);

    if (trade.mode === "figuritas") {
        params.set("a", trade.aFiguritas);
        params.set("b", trade.bFiguritas);
    } else {
        params.set("am", trade.aMissing);
        params.set("ao", trade.aAvailable);
        params.set("bm", trade.bMissing);
        params.set("bo", trade.bAvailable);
    }

    url.hash = params.toString();
    return url.toString();
}

export function readSharedTradeUrl() {
    const params = new URLSearchParams(window.location.hash.slice(1));

    if (params.get("share") !== SHARE_VERSION) {
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
            aProfileName: params.get("an") || "",
            bProfileName: params.get("bn") || ""
        };
    }

    throw new Error("El enlace compartido usa un formato no compatible.");
}

export function clearSharedTradeUrl() {
    if (!window.location.hash) {
        return;
    }

    const url = new URL(window.location.href);
    url.hash = "";
    window.history.replaceState(window.history.state, "", url);
}
