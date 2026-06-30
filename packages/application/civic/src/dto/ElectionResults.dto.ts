/**
 * ElectionResults DTO — Aggregated election results
 */
import { z } from "zod";

export const CandidateResultSchema = z.object({
	candidateId: z.string(),
	candidateName: z.string(),
	party: z.string(),
	votes: z.number(),
	percentage: z.number(),
	isValid: z.boolean(),
});

export type CandidateResultDTO = z.infer<typeof CandidateResultSchema>;

export const ElectionMetadataSchema = z.object({
	totalPollingStations: z.number(),
	reportedPollingStations: z.number(),
	validVotes: z.number(),
	blankVotes: z.number(),
	nullVotes: z.number(),
});

export type ElectionMetadataDTO = z.infer<typeof ElectionMetadataSchema>;

export const ElectionResultsSchema = z.object({
	electionId: z.string(),
	electionName: z.string(),
	region: z.string(),
	totalVotes: z.number(),
	turnout: z.number(),
	results: z.array(CandidateResultSchema),
	metadata: ElectionMetadataSchema,
});

export type ElectionResultsDTO = z.infer<typeof ElectionResultsSchema>;
