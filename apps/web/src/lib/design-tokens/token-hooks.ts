import {
	BLUR,
	BORDER_RADIUS,
	OPACITY,
	SHADOWS,
	SPACING,
	TRANSITIONS,
	Z_INDEX,
} from "./core-tokens";
import { ANIMATIONS, MOTION_VARIANTS } from "./motion-tokens";
import { DIMENSIONS, TYPOGRAPHY } from "./scale-tokens";
import { tokensToClasses } from "./token-helpers";
import {
	BACKDROP_BLUR,
	COLORS,
	GLASS_EFFECTS,
	GRADIENTS,
	INTERACTIONS,
} from "./visual-tokens";

export const useDesignTokens = () => {
	return {
		borderRadius: BORDER_RADIUS,
		shadows: SHADOWS,
		zIndex: Z_INDEX,
		blur: BLUR,
		spacing: SPACING,
		transitions: TRANSITIONS,
		opacity: OPACITY,
		gradients: GRADIENTS,
		backdropBlur: BACKDROP_BLUR,
		glassEffects: GLASS_EFFECTS,
		animations: ANIMATIONS,
		motionVariants: MOTION_VARIANTS,
		typography: TYPOGRAPHY,
		dimensions: DIMENSIONS,
		colors: COLORS,
		interactions: INTERACTIONS,
		helpers: tokensToClasses,
	};
};
