import { Camera, Flashlight, RotateCcw } from "lucide-react";
import type React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ScannerCameraViewProps {
	videoRef: React.RefObject<HTMLVideoElement | null>;
	isProcessing: boolean;
	flashlight: boolean;
	onToggleCamera: () => void;
	onCaptureImage: () => void;
	onToggleFlashlight: () => void;
}

export const ScannerCameraView = ({
	videoRef,
	isProcessing,
	flashlight,
	onToggleCamera,
	onCaptureImage,
	onToggleFlashlight,
}: ScannerCameraViewProps) => (
	<>
		<video
			ref={videoRef}
			autoPlay
			playsInline
			muted
			className="h-full w-full object-cover"
		/>

		<div className="pointer-events-none absolute inset-0">
			<div className="absolute left-8 top-8 h-16 w-16 rounded-tl-lg border-l-4 border-t-4 border-white" />
			<div className="absolute right-8 top-8 h-16 w-16 rounded-tr-lg border-r-4 border-t-4 border-white" />
			<div className="absolute bottom-8 left-8 h-16 w-16 rounded-bl-lg border-b-4 border-l-4 border-white" />
			<div className="absolute bottom-8 right-8 h-16 w-16 rounded-br-lg border-b-4 border-r-4 border-white" />

			<div className="absolute left-1/2 top-1/2 h-32 w-48 -translate-x-1/2 -translate-y-1/2 rounded-lg border-2 border-dashed border-background/70" />

			{isProcessing ? (
				<div className="absolute inset-0 flex items-center justify-center bg-[var(--surface-1)]/80">
					<div className="text-center">
						<div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-background" />
						<p className="text-background">Procesando factura...</p>
					</div>
				</div>
			) : null}
		</div>

		<div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/85 via-background/35 to-transparent p-6">
			<div className="flex items-center justify-center gap-4">
				<Button
					variant="secondary"
					size="lg"
					onClick={onToggleCamera}
					className="min-h-[44px] min-w-[44px] rounded-full border-background/30 bg-background/20 text-background  transition-[background-color,border-color,color] hover:bg-background/30"
				>
					<RotateCcw className="h-5 w-5" />
				</Button>

				<Button
					onClick={onCaptureImage}
					disabled={isProcessing}
					size="lg"
					className="min-h-[64px] min-w-[64px] rounded-full bg-background text-foreground shadow-lg transition-[background-color,box-shadow,transform] hover:bg-background/90 hover:shadow-xl disabled:opacity-50"
				>
					<Camera className="h-6 w-6" />
				</Button>

				<Button
					variant="secondary"
					size="lg"
					onClick={onToggleFlashlight}
					className={cn(
						"min-h-[44px] min-w-[44px] rounded-full border-background/30 bg-background/20 text-background  transition-[background-color,border-color,color] hover:bg-background/30",
						flashlight &&
							"border-yellow-500/30 bg-yellow-500/20 text-yellow-50",
					)}
				>
					<Flashlight className="h-5 w-5" />
				</Button>
			</div>
		</div>
	</>
);
