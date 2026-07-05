import { useState } from "react";
import { toast } from "sonner";

export const useDashboardActions = () => {
	const [showScanner, setShowScanner] = useState(false);
	const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

	const handleAction = (action: string) => {
		switch (action) {
			case "scan-invoice":
				setShowScanner(true);
				break;
			case "command-palette":
				window.dispatchEvent(new CustomEvent("open-command-palette"));
				break;
			case "invite-user":
				setIsInviteModalOpen(true);
				break;
			case "shortcuts":
				toast("⌨️ Atajos Rápidos", {
					description: "⌘K: Comandos Globales • ⌘B: Sidebar • ⌘F: Modo Zen",
					duration: 5000,
				});
				break;
			case "quick-analysis":
				toast.info("🚀 Iniciando análisis inteligente de anomalías...");
				break;
			case "new-transaction":
				toast.success("💰 Panel de transacción listo");
				break;
			case "settings":
				toast("⚙️ Configuración próximamente");
				break;
			case "reports":
				toast("📊 Reportes avanzados en desarrollo");
				break;
		}
	};

	return {
		showScanner,
		setShowScanner,
		isInviteModalOpen,
		setIsInviteModalOpen,
		handleAction,
	};
};
