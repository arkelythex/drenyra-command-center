import { Camera, Mail, Phone, Save, ShieldCheck, User } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	SettingSwitch,
	SettingsSection,
} from "@/features/settings/components/SettingsPrimitives";
import { SettingsShell } from "@/features/settings/components/SettingsShell";

export const ProfileView = () => {
	const [fullName, setFullName] = React.useState("");
	const [email, setEmail] = React.useState("");
	const [phone, setPhone] = React.useState("");
	const [position, setPosition] = React.useState("");
	const [cpcc, setCpcc] = React.useState("");

	const [showProfileInTeam, setShowProfileInTeam] = React.useState(true);
	const [allowMentions, setAllowMentions] = React.useState(true);

	return (
		<SettingsShell
			title="Mi Perfil"
			description="Administra datos personales, identidad profesional y visibilidad dentro del equipo."
			icon={User}
			badge="ACCOUNT PROFILE"
			actions={
				<Button className="text-xs font-black uppercase tracking-widest">
					<Save className="mr-2 h-4 w-4" />
					Guardar Perfil
				</Button>
			}
		>
			<SettingsSection
				title="Identidad"
				description="Tu presencia dentro del workspace y datos de contacto operativos."
			>
				<div className="flex flex-col gap-5 rounded-2xl border border-border/60 bg-background/40 p-4 sm:flex-row sm:items-center">
					<div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-border/70">
						<img
							src="https://ui-avatars.com/api/?name=Albert+Ferrer&background=0D1117&color=E6EDF3"
							alt="Avatar de perfil"
							className="h-full w-full object-cover"
						/>
						<button
							type="button"
							className="absolute bottom-1 right-1 rounded-lg border border-border/70 bg-background/90 p-1.5 text-muted-foreground hover:text-foreground"
							aria-label="Actualizar avatar"
						>
							<Camera className="h-4 w-4" />
						</button>
					</div>

					<div className="min-w-0">
						<p className="text-lg font-black uppercase tracking-tight text-foreground">
							{fullName}
						</p>
						<p className="text-sm font-semibold text-muted-foreground">
							{position}
						</p>
						<div className="mt-3 inline-flex rounded-full border border-[rgba(var(--premium-success-rgb),0.25)] bg-[rgba(var(--premium-success-rgb),0.10)] px-3 py-1 text-2xs font-black uppercase tracking-[0.2em] text-[var(--premium-success)]">
							Cuenta verificada
						</div>
					</div>
				</div>

				<div className="grid gap-4 md:grid-cols-2">
					<div>
						<label className="mb-2 block text-xs font-black uppercase tracking-[0.13em] text-muted-foreground">
							Nombre completo
						</label>
						<Input
							value={fullName}
							onChange={(event) => setFullName(event.target.value)}
						/>
					</div>

					<div>
						<label className="mb-2 block text-xs font-black uppercase tracking-[0.13em] text-muted-foreground">
							Cargo
						</label>
						<Input
							value={position}
							onChange={(event) => setPosition(event.target.value)}
						/>
					</div>

					<div>
						<label className="mb-2 block text-xs font-black uppercase tracking-[0.13em] text-muted-foreground">
							Email
						</label>
						<div className="relative">
							<Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								value={email}
								onChange={(event) => setEmail(event.target.value)}
								className="pl-10"
							/>
						</div>
					</div>

					<div>
						<label className="mb-2 block text-xs font-black uppercase tracking-[0.13em] text-muted-foreground">
							Teléfono
						</label>
						<div className="relative">
							<Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								value={phone}
								onChange={(event) => setPhone(event.target.value)}
								className="pl-10"
							/>
						</div>
					</div>
				</div>
			</SettingsSection>

			<SettingsSection
				title="Perfil Profesional"
				description="Datos usados en trazabilidad de acciones y cumplimiento interno."
			>
				<div className="grid gap-4 md:grid-cols-2">
					<div>
						<label className="mb-2 block text-xs font-black uppercase tracking-[0.13em] text-muted-foreground">
							Registro CPCC
						</label>
						<Input
							value={cpcc}
							onChange={(event) => setCpcc(event.target.value)}
							className="font-mono"
						/>
					</div>

					<div>
						<label className="mb-2 block text-xs font-black uppercase tracking-[0.13em] text-muted-foreground">
							Organización
						</label>
						<Input
							value="Drenyra Consulting SAC"
							readOnly
							className="opacity-80"
						/>
					</div>
				</div>

				<div className="rounded-2xl border border-border/60 bg-background/50 p-4">
					<div className="flex items-start gap-3">
						<ShieldCheck className="mt-0.5 h-4 w-4 text-[var(--premium-success)]" />
						<div>
							<p className="text-sm font-bold text-foreground">
								Firma profesional validada
							</p>
							<p className="text-xs text-muted-foreground">
								Tu identidad contable está habilitada para aprobaciones y
								reportes auditables.
							</p>
						</div>
					</div>
				</div>
			</SettingsSection>

			<SettingsSection
				title="Visibilidad y Colaboración"
				description="Controla cómo te ven otros miembros del equipo en el workspace."
			>
				<div className="space-y-3 rounded-2xl border border-border/60 bg-background/40 p-4">
					<div className="flex items-center justify-between gap-4">
						<div>
							<p className="text-sm font-bold text-foreground">
								Mostrar perfil en directorio interno
							</p>
							<p className="text-xs text-muted-foreground">
								Permite que el equipo vea tu cargo y datos de contacto.
							</p>
						</div>
						<SettingSwitch
							checked={showProfileInTeam}
							onCheckedChange={setShowProfileInTeam}
							label="Mostrar perfil en directorio"
						/>
					</div>

					<div className="flex items-center justify-between gap-4">
						<div>
							<p className="text-sm font-bold text-foreground">
								Permitir menciones en tareas
							</p>
							<p className="text-xs text-muted-foreground">
								Recibirás notificaciones cuando te asignen revisiones o cierres.
							</p>
						</div>
						<SettingSwitch
							checked={allowMentions}
							onCheckedChange={setAllowMentions}
							label="Permitir menciones"
						/>
					</div>
				</div>
			</SettingsSection>
		</SettingsShell>
	);
};
