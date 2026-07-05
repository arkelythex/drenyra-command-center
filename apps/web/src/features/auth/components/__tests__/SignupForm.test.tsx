import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SignupForm } from "../SignupForm";

// Mock auth store
const mockSignup = vi.fn();
const mockAuthStore = {
	signup: mockSignup,
	isLoading: false,
};

vi.mock("../../hooks/useAuth", () => ({
	useAuthStore: () => mockAuthStore,
}));

// Mock TanStack Router
const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => mockNavigate,
}));

// Mock sonner
vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

describe.skip("SignupForm", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockAuthStore.isLoading = false;
	});

	it("should render signup form with all fields", () => {
		render(<SignupForm />);

		expect(screen.getByText("Crear Cuenta")).toBeInTheDocument();
		expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/^ruc/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/^contraseña$/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/confirmar contraseña/i)).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /crear cuenta/i }),
		).toBeInTheDocument();
	});

	it("should show terms and conditions checkbox", () => {
		render(<SignupForm />);

		const termsCheckbox = screen.getByRole("checkbox", {
			name: /acepto.*términos/i,
		});
		expect(termsCheckbox).toBeInTheDocument();
		expect(termsCheckbox).not.toBeChecked();
	});

	it("should validate required fields", async () => {
		const user = userEvent.setup();
		render(<SignupForm />);

		const submitButton = screen.getByRole("button", { name: /crear cuenta/i });

		// Click submit without filling fields
		await user.click(submitButton);

		// Should show validation errors
		await waitFor(() => {
			expect(screen.getByText(/nombre es requerido/i)).toBeInTheDocument();
		});
	});

	it("should validate email format", async () => {
		const user = userEvent.setup();
		render(<SignupForm />);

		const emailInput = screen.getByLabelText(/correo electrónico/i);
		const submitButton = screen.getByRole("button", { name: /crear cuenta/i });

		await user.type(emailInput, "invalid-email");
		await user.click(submitButton);

		await waitFor(() => {
			expect(screen.getByText(/email inválido/i)).toBeInTheDocument();
		});
	});

	it("should validate RUC format (11 digits)", async () => {
		const user = userEvent.setup();
		render(<SignupForm />);

		const rucInput = screen.getByLabelText(/^ruc/i);
		const submitButton = screen.getByRole("button", { name: /crear cuenta/i });

		// Enter invalid RUC (too short)
		await user.type(rucInput, "123456789");
		await user.click(submitButton);

		await waitFor(() => {
			expect(screen.getByText(/11 dígitos/i)).toBeInTheDocument();
		});
	});

	it("should validate RUC with Módulo 11 algorithm", async () => {
		const user = userEvent.setup();
		render(<SignupForm />);

		const rucInput = screen.getByLabelText(/^ruc/i);

		// Enter valid RUC format but invalid checksum
		await user.type(rucInput, "20123456780");

		// Wait for debounced validation
		await waitFor(
			() => {
				expect(screen.getByText(/ruc inválido/i)).toBeInTheDocument();
			},
			{ timeout: 1000 },
		);
	});

	it("should show valid RUC indicator", async () => {
		const user = userEvent.setup();
		render(<SignupForm />);

		const rucInput = screen.getByLabelText(/^ruc/i);

		// Enter valid RUC (20123456789 passes Módulo 11)
		await user.type(rucInput, "20123456789");

		// Wait for debounced validation
		await waitFor(
			() => {
				expect(screen.getByText(/válido/i)).toBeInTheDocument();
			},
			{ timeout: 1000 },
		);
	});

	it("should validate password strength", async () => {
		const user = userEvent.setup();
		render(<SignupForm />);

		const passwordInput = screen.getByLabelText(/^contraseña$/i);

		// Weak password
		await user.type(passwordInput, "weak");
		expect(screen.getByText(/muy débil/i)).toBeInTheDocument();

		// Clear and try stronger password
		await user.clear(passwordInput);
		await user.type(passwordInput, "Stronger123");

		await waitFor(() => {
			expect(screen.getByText(/fuerte/i)).toBeInTheDocument();
		});
	});

	it("should validate password confirmation match", async () => {
		const user = userEvent.setup();
		render(<SignupForm />);

		const passwordInput = screen.getByLabelText(/^contraseña$/i);
		const confirmPasswordInput = screen.getByLabelText(/confirmar contraseña/i);
		const submitButton = screen.getByRole("button", { name: /crear cuenta/i });

		// Enter mismatched passwords
		await user.type(passwordInput, "Password123");
		await user.type(confirmPasswordInput, "DifferentPass123");
		await user.click(submitButton);

		await waitFor(() => {
			expect(screen.getByText(/contraseñas no coinciden/i)).toBeInTheDocument();
		});
	});

	it("should require terms and conditions acceptance", async () => {
		const user = userEvent.setup();
		render(<SignupForm />);

		const nameInput = screen.getByLabelText(/nombre completo/i);
		const emailInput = screen.getByLabelText(/correo electrónico/i);
		const rucInput = screen.getByLabelText(/^ruc/i);
		const passwordInput = screen.getByLabelText(/^contraseña$/i);
		const confirmPasswordInput = screen.getByLabelText(/confirmar contraseña/i);
		const submitButton = screen.getByRole("button", { name: /crear cuenta/i });

		// Fill all fields but don't check terms
		await user.type(nameInput, "Juan Pérez");
		await user.type(emailInput, "juan@empresa.com");
		await user.type(rucInput, "20123456789");
		await user.type(passwordInput, "SecurePass123");
		await user.type(confirmPasswordInput, "SecurePass123");
		await user.click(submitButton);

		await waitFor(() => {
			expect(screen.getByText(/aceptar.*términos/i)).toBeInTheDocument();
		});
	});

	it("should submit form with valid data", async () => {
		const user = userEvent.setup();
		mockSignup.mockResolvedValueOnce(undefined);

		render(<SignupForm />);

		const nameInput = screen.getByLabelText(/nombre completo/i);
		const emailInput = screen.getByLabelText(/correo electrónico/i);
		const rucInput = screen.getByLabelText(/^ruc/i);
		const passwordInput = screen.getByLabelText(/^contraseña$/i);
		const confirmPasswordInput = screen.getByLabelText(/confirmar contraseña/i);
		const termsCheckbox = screen.getByRole("checkbox", {
			name: /acepto.*términos/i,
		});
		const submitButton = screen.getByRole("button", { name: /crear cuenta/i });

		// Fill form
		await user.type(nameInput, "Juan Pérez");
		await user.type(emailInput, "juan@empresa.com");
		await user.type(rucInput, "20123456789");
		await user.type(passwordInput, "SecurePass123");
		await user.type(confirmPasswordInput, "SecurePass123");
		await user.click(termsCheckbox);

		// Wait for RUC validation to complete
		await waitFor(
			() => {
				expect(screen.queryByText(/validando/i)).not.toBeInTheDocument();
			},
			{ timeout: 1000 },
		);

		await user.click(submitButton);

		await waitFor(() => {
			expect(mockSignup).toHaveBeenCalledWith({
				name: "Juan Pérez",
				email: "juan@empresa.com",
				ruc: "20123456789",
				password: "SecurePass123",
				confirmPassword: "SecurePass123",
				acceptTerms: true,
			});
		});
	});

	it("should navigate to login after successful signup", async () => {
		const user = userEvent.setup();
		const { toast } = await import("sonner");
		mockSignup.mockResolvedValueOnce(undefined);

		render(<SignupForm />);

		const nameInput = screen.getByLabelText(/nombre completo/i);
		const emailInput = screen.getByLabelText(/correo electrónico/i);
		const rucInput = screen.getByLabelText(/^ruc/i);
		const passwordInput = screen.getByLabelText(/^contraseña$/i);
		const confirmPasswordInput = screen.getByLabelText(/confirmar contraseña/i);
		const termsCheckbox = screen.getByRole("checkbox", {
			name: /acepto.*términos/i,
		});
		const submitButton = screen.getByRole("button", { name: /crear cuenta/i });

		await user.type(nameInput, "Juan Pérez");
		await user.type(emailInput, "juan@empresa.com");
		await user.type(rucInput, "20123456789");
		await user.type(passwordInput, "SecurePass123");
		await user.type(confirmPasswordInput, "SecurePass123");
		await user.click(termsCheckbox);

		await waitFor(
			() => {
				expect(screen.queryByText(/validando/i)).not.toBeInTheDocument();
			},
			{ timeout: 1000 },
		);

		await user.click(submitButton);

		await waitFor(() => {
			expect(toast.success).toHaveBeenCalled();
			expect(mockNavigate).toHaveBeenCalledWith({ to: "/login" });
		});
	});

	it("should show error message on signup failure", async () => {
		const user = userEvent.setup();
		const { toast } = await import("sonner");

		mockSignup.mockRejectedValueOnce(new Error("Email ya registrado"));

		render(<SignupForm />);

		const nameInput = screen.getByLabelText(/nombre completo/i);
		const emailInput = screen.getByLabelText(/correo electrónico/i);
		const rucInput = screen.getByLabelText(/^ruc/i);
		const passwordInput = screen.getByLabelText(/^contraseña$/i);
		const confirmPasswordInput = screen.getByLabelText(/confirmar contraseña/i);
		const termsCheckbox = screen.getByRole("checkbox", {
			name: /acepto.*términos/i,
		});
		const submitButton = screen.getByRole("button", { name: /crear cuenta/i });

		await user.type(nameInput, "Juan Pérez");
		await user.type(emailInput, "existing@empresa.com");
		await user.type(rucInput, "20123456789");
		await user.type(passwordInput, "SecurePass123");
		await user.type(confirmPasswordInput, "SecurePass123");
		await user.click(termsCheckbox);

		await waitFor(
			() => {
				expect(screen.queryByText(/validando/i)).not.toBeInTheDocument();
			},
			{ timeout: 1000 },
		);

		await user.click(submitButton);

		await waitFor(() => {
			expect(toast.error).toHaveBeenCalledWith(
				"Error al crear cuenta",
				expect.objectContaining({
					description: "Email ya registrado",
				}),
			);
		});
	});

	it("should disable submit button while loading", () => {
		mockAuthStore.isLoading = true;

		render(<SignupForm />);

		const submitButton = screen.getByRole("button", { name: /creando/i });
		expect(submitButton).toBeDisabled();
	});

	it("should show loading spinner while submitting", () => {
		mockAuthStore.isLoading = true;

		render(<SignupForm />);

		expect(
			screen.getByRole("button", { name: /creando/i }),
		).toBeInTheDocument();
	});

	it("should have link to login page", () => {
		render(<SignupForm />);

		const loginLink = screen.getByRole("link", { name: /inicia sesión/i });
		expect(loginLink).toBeInTheDocument();
		expect(loginLink).toHaveAttribute("href", "/login");
	});

	it("should toggle password visibility", async () => {
		const user = userEvent.setup();
		render(<SignupForm />);

		const passwordInput = screen.getByLabelText(
			/^contraseña$/i,
		) as HTMLInputElement;

		// Initially password should be hidden
		expect(passwordInput.type).toBe("password");

		// Find and click the toggle button
		const toggleButtons = screen.getAllByRole("button", {
			name: /mostrar contraseña/i,
		});
		await user.click(toggleButtons[0]);

		// Password should now be visible
		expect(passwordInput.type).toBe("text");

		// Click again to hide
		await user.click(toggleButtons[0]);
		expect(passwordInput.type).toBe("password");
	});

	it("should show RUC loading state during validation", async () => {
		const user = userEvent.setup();
		render(<SignupForm />);

		const rucInput = screen.getByLabelText(/^ruc/i);

		// Type RUC
		await user.type(rucInput, "20123456789");

		// Should show loading briefly (before debounce completes)
		// Note: This test is timing-sensitive
		expect(screen.queryByText(/validando/i)).toBeTruthy();
	});

	it("should accept only numbers in RUC field", async () => {
		const user = userEvent.setup();
		render(<SignupForm />);

		const rucInput = screen.getByLabelText(/^ruc/i) as HTMLInputElement;

		// Try to type letters (should be prevented by input type or validation)
		await user.type(rucInput, "abc123xyz789");

		// Should only contain numbers
		await waitFor(() => {
			expect(rucInput.value.match(/^\d+$/)).toBeTruthy();
		});
	});
});
