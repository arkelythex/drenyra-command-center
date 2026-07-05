import type { CountryCode } from "../types/tax-identifier";
import { chileCountryPack } from "./chile";
import { colombiaCountryPack } from "./colombia";
import { mexicoCountryPack } from "./mexico";
import { peruCountryPack } from "./peru";
import type { CountryPack } from "./types";

const packs: Partial<Record<CountryCode, CountryPack>> = {
	PE: peruCountryPack,
	MX: mexicoCountryPack,
	CL: chileCountryPack,
	CO: colombiaCountryPack,
};

export function getCountryPack(code: CountryCode): CountryPack {
	const pack = packs[code];
	if (!pack) throw new Error(`No CountryPack registered for ${code}`);
	return pack;
}

export function registerCountryPack(pack: CountryPack): void {
	packs[pack.code] = pack;
}
