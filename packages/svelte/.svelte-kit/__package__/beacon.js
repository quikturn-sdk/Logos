import { BASE_URL } from "@quikturn/logos";
const fired = new Set();
export function fireBeacon(token) {
    if (typeof window === "undefined")
        return;
    if (!token || token.startsWith("sk_"))
        return;
    if (fired.has(token))
        return;
    fired.add(token);
    const img = new Image();
    img.src = `${BASE_URL}/_beacon?token=${token}&page=${encodeURIComponent(location.href)}`;
}
/** @internal */
export function _resetBeacon() {
    fired.clear();
}
