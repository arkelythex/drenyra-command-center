import { BORDER_RADIUS, SHADOWS } from './core-tokens';

export const getColorEffect = (color: keyof typeof SHADOWS, intensity: number = 1) => {
  const shadow = SHADOWS[color];
  if (shadow?.includes('currentColor')) {
    return shadow;
  }
  return shadow?.replace(/(\d+\.?\d*)\)/, `${intensity})`) || SHADOWS.subtle;
};

export const getShadowForTheme = (
  variant: keyof typeof SHADOWS,
) => {
  return SHADOWS[variant];
};

export const getResponsiveBorderRadius = (size: keyof typeof BORDER_RADIUS) => {
  const responsiveMap: Record<keyof typeof BORDER_RADIUS, string> = {
    sm: 'rounded-[10px] sm:rounded-[10px]',
    md: 'rounded-[14px] sm:rounded-[14px]',
    lg: 'rounded-[18px] sm:rounded-[18px]',
    xl: 'rounded-[24px] sm:rounded-[24px]',
    pill: 'rounded-full sm:rounded-full',
    card: 'rounded-[18px] sm:rounded-[18px]',
    modal: 'rounded-[24px] sm:rounded-[24px]',
    overlay: 'rounded-[24px] sm:rounded-[24px]',
    button: 'rounded-[14px] sm:rounded-[14px]',
    input: 'rounded-[14px] sm:rounded-[14px]',
    badge: 'rounded-full sm:rounded-full',
    icon: 'rounded-[10px] sm:rounded-[10px]',
    avatar: 'rounded-[18px] sm:rounded-[18px]',
    dot: 'rounded-full sm:rounded-full',
    tooltip: 'rounded-[10px] sm:rounded-[10px]',
    dropdown: 'rounded-[14px] sm:rounded-[14px]',
    notification: 'rounded-[18px] sm:rounded-[18px]',
  };

  return responsiveMap[size];
};
