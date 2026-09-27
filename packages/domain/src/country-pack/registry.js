import { chileCountryPack } from "./chile";
import { colombiaCountryPack } from "./colombia";
import { mexicoCountryPack } from "./mexico";
import { peruCountryPack } from "./peru";
const packs = {
    PE: peruCountryPack,
    MX: mexicoCountryPack,
    CL: chileCountryPack,
    CO: colombiaCountryPack,
};
export function getCountryPack(code) {
    const pack = packs[code];
    if (!pack)
        throw new Error(`No CountryPack registered for ${code}`);
    return pack;
}
export function registerCountryPack(pack) {
    packs[pack.code] = pack;
}
//# sourceMappingURL=registry.js.map