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

// Hooks
export { useAuthSession } from "./hooks/useAuthSession";
export { useAuthStore } from "./hooks/useAuth";

// Schemas
export {
	forgotPasswordSchema,
	type ForgotPasswordFormData,
} from "./schemas/forgot-password.schema";
export {
	resetPasswordSchema,
	type ResetPasswordFormData,
} from "./schemas/reset-password.schema";

// Types
export type {
	UserCompanyAccess,
	User,
	Session,
	AuthState,
	LoginCredentials,
	RegisterData,
} from "./types/auth.types";

// Utils
export { getInitials, getAvatarColor } from "./utils/avatar.utils";
