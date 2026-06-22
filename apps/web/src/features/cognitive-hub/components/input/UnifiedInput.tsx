import { useCallback, useEffect, useId, useState } from "react";
import { useActiveCompanyContext } from "@/lib/use-active-company-context";
import { getCountryPack } from "@/lib/latam-country-packs";
import { useAccountingJobRuns } from "../../hooks/useAccountingJobRuns";
import { useAccountingJobsCatalog } from "../../hooks/useAccountingJobsCatalog";
import { useCountryPackCatalog } from "../../hooks/useCountryPackCatalog";
import { useCommandSuggestions } from "../../hooks/useCommandSuggestions";
import { usePromptInput } from "../../hooks/usePromptInput";
import { useVoiceIntelligence } from "../../hooks/useVoiceIntelligence";
import { cn } from "@/lib/utils";
import { PromptComposerSupport } from "./prompt-composer-support";
import {
	buildQuickCommands,
	buildQuickCommandsFromJobs,
	getQuickCommands,
} from "./quick-commands";

interface UnifiedInputProps {
	onSend: (content: string, files?: File[]) => void;
	disabled?: boolean;
	onCommandModeChange?: (isActive: boolean) => void;
	onChatBackdropChange?: (active: boolean) => void;
}

export const UnifiedInput = ({
	onSend,
	disabled,
	onCommandModeChange,
	onChatBackdropChange,
}: UnifiedInputProps) => {
	const [value, setValue] = useState("");
	const { companyContext } = useActiveCompanyContext();
	const { data: countryPackCatalog } = useCountryPackCatalog();
	const { data: accountingJobsCatalog } = useAccountingJobsCatalog(
		companyContext.countryCode,
	);
	const { createJobRun, updateJobRunStatus, executeJobRun } =
		useAccountingJobRuns();
	const canonicalCountryPack = countryPackCatalog?.packs.find(
		(candidate) => candidate.code === companyContext.countryCode,
	);
	const countryPack =
		canonicalCountryPack ?? getCountryPack(companyContext.countryCode);
	const quickCommands = accountingJobsCatalog?.jobs?.length
		? buildQuickCommandsFromJobs(accountingJobsCatalog.jobs)
		: canonicalCountryPack
			? buildQuickCommands(countryPack.assistantQuickActions)
			: getQuickCommands(companyContext.countryCode);
	const { isRecording, amplitude, startRecording, stopRecording } =
		useVoiceIntelligence();
	const {
		suggestions,
		selectedIndex,
		clearSuggestions,
		handleKeyDown,
		setSelectedIndex,
		takeSelectedCommand,
	} = useCommandSuggestions(value);
	const {
		files,
		isDragging,
		fileInputRef,
		clearFiles,
		handleDragLeave,
		handleDragOver,
		handleDrop,
		handleInputChange,
		openFilePicker,
		removeFileAt,
		isCommandPaletteActive,
		shouldDimChatBackdrop,
		handleBlur,
		handleFocus,
		handleSend,
		handleSubmit,
	} = usePromptInput({
		value,
		disabled,
		isRecording,
		suggestionsCount: suggestions.length,
		onSend,
		onAfterSend: () => {
			setValue("");
			clearFiles();
			clearSuggestions();
		},
		onCommandModeChange,
		takeSelectedCommand,
	});

	useEffect(() => {
		onChatBackdropChange?.(shouldDimChatBackdrop);
	}, [shouldDimChatBackdrop, onChatBackdropChange]);

	useEffect(() => {
		return () => {
			onChatBackdropChange?.(false);
		};
	}, [onChatBackdropChange]);
	const suggestionListId = useId();
	const handleQuickCommand = useCallback(
		(command: string) => {
			const matchedJob = accountingJobsCatalog?.jobs.find(
				(job) => job.prompt === command,
			);

			if (matchedJob) {
				void (async () => {
					try {
						const createdRun = await createJobRun({
							job: matchedJob,
							promptOverride: command,
							summary: `${matchedJob.title} solicitado desde el asistente`,
							inputPayload: {
								source: "assistant-quick-command",
								countryCode: companyContext.countryCode,
							},
						});

						if (!createdRun.approvalRequired) {
							await updateJobRunStatus({
								runId: createdRun.id,
								status: "RUNNING",
								summary: `${createdRun.jobTitle} en ejecución`,
								resultPayload: {
									trigger: "assistant-quick-command",
									status: "accepted",
								},
								evidencePayload: {
									source: "assistant-quick-command",
									prompt: command,
								},
							});

							if (matchedJob.id === "prepare-sire") {
								await executeJobRun({
									runId: createdRun.id,
								});
							}
						}
					} catch {
						// The assistant should still continue even if control-plane persistence fails.
					}
				})();
			}

			handleSend(command);
		},
		[
			accountingJobsCatalog,
			companyContext.countryCode,
			createJobRun,
			executeJobRun,
			handleSend,
			updateJobRunStatus,
		],
	);

	return (
		<div className={cn("mx-auto w-full max-w-4xl px-1 sm:px-0")}>
			<PromptComposerSupport
				amplitude={amplitude}
				disabled={disabled}
				placeholder={countryPack.assistantPlaceholder}
				commandHint={countryPack.commandHint}
				quickCommands={quickCommands}
				files={files}
				fileInputRef={fileInputRef}
				isCommandPaletteActive={isCommandPaletteActive}
				isDragging={isDragging}
				isRecording={isRecording}
				selectedIndex={selectedIndex}
				suggestionListId={suggestionListId}
				suggestions={suggestions}
				value={value}
				onBlur={handleBlur}
				onChangeValue={setValue}
				onDragLeave={handleDragLeave}
				onDragOver={handleDragOver}
				onDrop={handleDrop}
				onFileInputChange={handleInputChange}
				onFocus={handleFocus}
				onKeyDown={handleKeyDown}
				onOpenFilePicker={openFilePicker}
				onQuickCommand={handleQuickCommand}
				onRemoveFile={removeFileAt}
				onSelectSuggestion={handleSend}
				onStartRecording={startRecording}
				onStopRecording={stopRecording}
				onSubmit={handleSubmit}
				onSuggestionHover={setSelectedIndex}
			/>
		</div>
	);
};
