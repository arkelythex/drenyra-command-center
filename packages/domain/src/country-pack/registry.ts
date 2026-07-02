import type { CountryCode } from "../types/tax-identifier";
import { peruCountryPack } from "./peru";
import type { CountryPack } from "./types";

const packs: Partial<Record<CountryCode, CountryPack>> = {
	PE: peruCountryPack,
};

export function getCountryPack(code: CountryCode): CountryPack {
	const pack = packs[code];
	if (!pack) throw new Error(`No CountryPack registered for ${code}`);
	return pack;
}

export function registerCountryPack(pack: CountryPack): void {
	packs[pack.code] = pack;
}
