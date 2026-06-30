import { z } from "zod";
export const CandidateResultSchema = z.object({
    candidateId: z.string(),
    candidateName: z.string(),
    party: z.string(),
    votes: z.number(),
    percentage: z.number(),
    isValid: z.boolean(),
});
export const ElectionMetadataSchema = z.object({
    totalPollingStations: z.number(),
    reportedPollingStations: z.number(),
    validVotes: z.number(),
    blankVotes: z.number(),
    nullVotes: z.number(),
});
export const ElectionResultsSchema = z.object({
    electionId: z.string(),
    electionName: z.string(),
    region: z.string(),
    totalVotes: z.number(),
    turnout: z.number(),
    results: z.array(CandidateResultSchema),
    metadata: ElectionMetadataSchema,
});
//# sourceMappingURL=ElectionResults.dto.js.map