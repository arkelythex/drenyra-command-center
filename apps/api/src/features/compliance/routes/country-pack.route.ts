import { Elysia } from "elysia";
import { z } from "zod";
import {
	DEFAULT_COUNTRY_CODE,
	getCountryPack,
	isCountryCode,
	LATAM_COUNTRY_PACKS,
} from "../../../lib/latam-country-packs";
import { fail, ok } from "../../shared/api-response";

/**
 * countryPackRoute const.
 *
 * @example
 * ```ts
 * console.log(countryPackRoute);
 * ```
 */
export const countryPackRoute = new Elysia()
	.get(
		"/country-packs",
		() =>
			ok({
				defaultCountryCode: DEFAULT_COUNTRY_CODE,
				supportedCountries: Object.keys(LATAM_COUNTRY_PACKS),
				packs: Object.values(LATAM_COUNTRY_PACKS),
			}),
		{
			detail: {
				tags: ["Compliance", "Localization"],
				summary: "List supported LATAM country packs",
				description:
					"Devuelve la configuración base de idioma fiscal y comandos sugeridos por país.",
			},
		},
	)
	.get(
		"/country-packs/:countryCode",
		({ params, set }) => {
			if (!isCountryCode(params.countryCode)) {
				set.status = 404;
				return fail("Country pack not supported", "COUNTRY_PACK_NOT_SUPPORTED");
			}

			return ok({
				defaultCountryCode: DEFAULT_COUNTRY_CODE,
				pack: getCountryPack(params.countryCode),
			});
		},
		{
			params: z.object({
				countryCode: z.string().min(2).max(2),
			}),
			detail: {
				tags: ["Compliance", "Localization"],
				summary: "Get one LATAM country pack",
				description:
					"Devuelve la configuración base de un país soportado para el asistente y el contexto fiscal.",
			},
		},
	);
