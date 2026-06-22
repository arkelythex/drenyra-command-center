const ARKELYTHEX_API_KEY = "ARKELYTHEX_API_KEY";
const ARKALYTHIX_API_KEY = "ARKALYTHIX_API_KEY";
export function getArkelythexApiKey(env = process.env) {
    const primary = env[ARKELYTHEX_API_KEY]?.trim();
    if (primary)
        return primary;
    const legacy = env[ARKALYTHIX_API_KEY]?.trim();
    return legacy === "" ? undefined : legacy;
}
export { ARKELYTHEX_API_KEY, ARKALYTHIX_API_KEY };
//# sourceMappingURL=env.js.map