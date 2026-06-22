import {
	createFileRoute,
	lazyRouteComponent,
	Outlet,
	useLocation,
} from "@tanstack/react-router";

const OnboardingWizard = lazyRouteComponent(
	() => import("../features/onboarding/components/OnboardingWizard"),
	"OnboardingWizard",
);

export const Route = createFileRoute("/onboarding")({
	component: OnboardingRoute,
});

function OnboardingRoute() {
	const location = useLocation();

	if (location.pathname !== "/onboarding") {
		return <Outlet />;
	}

	return <OnboardingWizard />;
}
