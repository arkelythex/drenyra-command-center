export function normalizeJson(data) {
    if (data === null || data === undefined)
        return "null";
    if (typeof data !== "object")
        return JSON.stringify(data);
    if (Array.isArray(data)) {
        return `[${data.map((item) => normalizeJson(item)).join(",")}]`;
    }
    const sorted = Object.keys(data)
        .sort()
        .reduce((acc, key) => {
        acc[key] = data[key];
        return acc;
    }, {});
    const pairs = Object.entries(sorted).map(([k, v]) => `"${k}":${normalizeJson(v)}`);
    return `{${pairs.join(",")}}`;
}
//# sourceMappingURL=normalize-json.js.map