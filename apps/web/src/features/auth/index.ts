// Components
export { AuthLayout } from "./components/AuthLayout";
export { AuthPage } from "./components/AuthPage";
export { AuthStatus } from "./components/AuthStatus";
export { EmailVerificationBanner } from "./components/EmailVerificationBanner";
export { ForgotPasswordForm } from "./components/ForgotPasswordForm";
export { LoginForm } from "./components/LoginForm";
export { ProtectedRoute } from "./components/ProtectedRoute";
export { ResetPasswordForm } from "./components/ResetPasswordForm";
export { SessionExpiryNotification } from "./components/SessionExpiryNotification";
export { SignupForm } from "./components/SignupForm";
export { UserMenu } from "./components/UserMenu";
export { VerifyEmailPage } from "./components/VerifyEmailPage";
export { useAuthStore } from "./hooks/useAuth";
// Hooks
export { useAuthSession } from "./hooks/useAuthSession";

// Schemas
export {
	type ForgotPasswordFormData,
	forgotPasswordSchema,
} from "./schemas/forgot-password.schema";
export {
	type ResetPasswordFormData,
	resetPasswordSchema,
} from "./schemas/reset-password.schema";

// Types
export type {
	AuthState,
	LoginCredentials,
	RegisterData,
	Session,
	User,
	UserCompanyAccess,
} from "./types/auth.types";

// Utils
export { getAvatarColor, getInitials } from "./utils/avatar.utils";
