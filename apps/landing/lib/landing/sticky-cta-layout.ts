export const LANDING_BASE_SHELL_CLASS =
	"container mx-auto w-full max-w-7xl px-4 sm:px-6" as const;

export const LANDING_STICKY_ALIGNED_SHELL_CLASS =
	`${LANDING_BASE_SHELL_CLASS} min-[1440px]:max-w-[min(80rem,max(24rem,calc(100vw-36rem)))]` as const;
