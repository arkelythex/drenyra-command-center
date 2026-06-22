import { AlertTriangle, Camera, X } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { captureError } from "@/lib/monitoring";
import type {
	MobileInvoiceScannerProps,
	ScanResult,
} from "../mobile-scanner/mobile-scanner.types";
import {
	ScannerAlert,
	ScannerAlertDescription,
} from "../mobile-scanner/mobile-scanner-alert";
import { ScannerCameraView } from "../mobile-scanner/scanner-camera-view";
import { ScannerResultCard } from "../mobile-scanner/scanner-result-card";
import { generateMockScanResult } from "./scanner-utils";

export const MobileInvoiceScanner: React.FC<MobileInvoiceScannerProps> = ({
	onScanComplete,
	onClose,
}) => {
	const videoRef = useRef<HTMLVideoElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const streamRef = useRef<MediaStream | null>(null);

	const [isScanning, setIsScanning] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const [scanResult, setScanResult] = useState<ScanResult | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [hasCamera, setHasCamera] = useState<boolean | null>(null);
	const [facingMode, setFacingMode] = useState<"environment" | "user">(
		"environment",
	);
	const [flashlight, setFlashlight] = useState(false);

	useEffect(() => {
		const checkCamera = async () => {
			try {
				const devices = await navigator.mediaDevices.enumerateDevices();
				setHasCamera(devices.some((device) => device.kind === "videoinput"));
			} catch {
				setHasCamera(false);
				setError("No se pudo acceder a los dispositivos de cámara");
			}
		};

		void checkCamera();
	}, []);

	const stopCamera = useCallback(() => {
		if (streamRef.current) {
			streamRef.current.getTracks().forEach((track) => track.stop());
			streamRef.current = null;
		}

		if (videoRef.current) {
			videoRef.current.srcObject = null;
		}

		setIsScanning(false);
	}, []);

	const initializeCamera = useCallback(async () => {
		try {
			setError(null);

			const stream = await navigator.mediaDevices.getUserMedia({
				video: {
					facingMode,
					width: { ideal: 1920 },
					height: { ideal: 1080 },
				},
			});

			streamRef.current = stream;
			if (videoRef.current) {
				videoRef.current.srcObject = stream;
				await videoRef.current.play();
			}

			setIsScanning(true);
		} catch (cameraError) {
			captureError(
				cameraError instanceof Error
					? cameraError
					: new Error("Error accessing camera"),
				{
					source: "mobile-invoice-scanner.initialize-camera",
					facingMode,
				},
			);
			setError("No se pudo acceder a la cámara. Verifica los permisos.");
			setHasCamera(false);
		}
	}, [facingMode]);

	const toggleCamera = useCallback(() => {
		if (!isScanning) return;

		stopCamera();
		setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
		setTimeout(() => {
			void initializeCamera();
		}, 100);
	}, [initializeCamera, isScanning, stopCamera]);

	const toggleFlashlight = useCallback(() => {
		if (!streamRef.current) return;

		const videoTrack = streamRef.current.getVideoTracks()[0];
		const capabilities = videoTrack?.getCapabilities();

		if (!(capabilities as MediaTrackCapabilities & { torch?: boolean })?.torch)
			return;

		setFlashlight((prev) => {
			void videoTrack.applyConstraints({
				advanced: [{ torch: !prev } as MediaTrackConstraintSet],
			});
			return !prev;
		});
	}, []);

	const captureImage = useCallback(async () => {
		if (!videoRef.current || !canvasRef.current) return;

		setIsProcessing(true);

		try {
			const video = videoRef.current;
			const canvas = canvasRef.current;
			const context = canvas.getContext("2d");

			if (!context) throw new Error("Canvas context not available");

			canvas.width = video.videoWidth;
			canvas.height = video.videoHeight;
			context.drawImage(video, 0, 0, canvas.width, canvas.height);

			await new Promise((resolve) => setTimeout(resolve, 2000));

			setScanResult(generateMockScanResult());
			stopCamera();
		} catch (processingError) {
			captureError(
				processingError instanceof Error
					? processingError
					: new Error("Error processing image"),
				{
					source: "mobile-invoice-scanner.capture-image",
				},
			);
			setError("Error al procesar la imagen");
		} finally {
			setIsProcessing(false);
		}
	}, [stopCamera]);

	const handleScanComplete = useCallback(() => {
		if (scanResult && onScanComplete) {
			onScanComplete(scanResult);
		}
		setScanResult(null);
	}, [onScanComplete, scanResult]);

	useEffect(() => () => stopCamera(), [stopCamera]);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape" && onClose) onClose();
			if (event.key === " " && isScanning && !isProcessing) {
				event.preventDefault();
				void captureImage();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [captureImage, isProcessing, isScanning, onClose]);

	if (hasCamera === null) {
		return (
			<div className="flex min-h-[400px] items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
			</div>
		);
	}

	if (!hasCamera) {
		return (
			<Card className="p-6 text-center">
				<AlertTriangle className="mx-auto mb-4 h-12 w-12 text-yellow-500" />
				<h3 className="mb-2 text-lg font-semibold">Cámara no disponible</h3>
				<p className="mb-4 text-muted-foreground">
					No se pudo acceder a la cámara del dispositivo. Verifica que tengas
					permisos de cámara habilitados.
				</p>
				<Button onClick={() => window.location.reload()}>Reintentar</Button>
			</Card>
		);
	}

	return (
		<div className="relative flex h-full flex-col overflow-hidden bg-background text-foreground">
			<div className="z-10 flex items-center justify-between border-b border-border/60 bg-background/90 p-4 backdrop-blur-sm">
				<h2 className="text-lg font-semibold">Escanear Factura</h2>
				{onClose ? (
					<Button
						variant="ghost"
						size="sm"
						onClick={onClose}
						className="text-foreground transition-colors hover:bg-muted/70"
					>
						<X className="h-4 w-4" />
					</Button>
				) : null}
			</div>

			<div className="relative flex-1">
				{!isScanning && !scanResult ? (
					<div className="absolute inset-0 flex items-center justify-center bg-muted/30">
						<div className="text-center">
							<Camera className="mx-auto mb-4 h-16 w-16 text-muted-foreground/60" />
							<p className="mb-4 text-muted-foreground">
								Presiona iniciar para comenzar
							</p>
							<Button onClick={() => void initializeCamera()} size="lg">
								<Camera className="mr-2 h-4 w-4" />
								Iniciar Cámara
							</Button>
						</div>
					</div>
				) : null}

				{isScanning ? (
					<ScannerCameraView
						videoRef={videoRef}
						isProcessing={isProcessing}
						flashlight={flashlight}
						onToggleCamera={toggleCamera}
						onCaptureImage={() => void captureImage()}
						onToggleFlashlight={toggleFlashlight}
					/>
				) : null}

				{scanResult ? (
					<ScannerResultCard
						scanResult={scanResult}
						onRetry={() => {
							setScanResult(null);
							void initializeCamera();
						}}
						onConfirm={handleScanComplete}
					/>
				) : null}
			</div>

			{error ? (
				<div className="p-4">
					<ScannerAlert>
						<AlertTriangle className="h-4 w-4" />
						<ScannerAlertDescription>{error}</ScannerAlertDescription>
					</ScannerAlert>
				</div>
			) : null}

			<canvas ref={canvasRef} className="hidden" />

			<div className="absolute left-4 top-4 hidden max-w-xs rounded-lg border border-border/60 bg-background/85 p-3 text-sm text-foreground shadow-lg backdrop-blur-sm md:block">
				<p className="mb-1 font-semibold">Instrucciones:</p>
				<ul className="space-y-1 text-xs">
					<li>• Enfoca la factura en el recuadro</li>
					<li>• Presiona ESPACIO para capturar</li>
					<li>• Presiona ESC para salir</li>
				</ul>
			</div>
		</div>
	);
};
