import { PRECIOS_COPY } from "./precios";
import { CASOS_COPY } from "./casos-de-exito";
import { NOSOTROS_COPY } from "./nosotros";
import { closingCopy } from "./closing";
import { heroTrustCopy } from "./hero-trust";
import { navbarCopy } from "./navbar";
import { sectionsCopy } from "./sections";
import { DRENYRA_ENGINE_COPY } from "./drenyra-engine";
import { BRAND_HOME_COPY } from "./brand-home";
import { DEMO_COPY } from "./demo";
import { SEGURIDAD_COPY } from "./seguridad";
import { GOV_COPY } from "./gov";
import { GRID_COPY } from "./grid";

export const LANDING_COPY = {
	navbar: navbarCopy,
	...heroTrustCopy,
	...sectionsCopy,
	...closingCopy,
} as const;

export {
	PRECIOS_COPY,
	CASOS_COPY,
	NOSOTROS_COPY,
	DRENYRA_ENGINE_COPY,
	BRAND_HOME_COPY,
	DEMO_COPY,
	SEGURIDAD_COPY,
	GOV_COPY,
	GRID_COPY,
};
