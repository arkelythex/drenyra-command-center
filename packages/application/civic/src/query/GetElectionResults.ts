/**
 * GetElectionResults — Query handler
 *
 * Aggregates election results per candidate/party across all polling stations.
 */
import type {
	ElectionRepository,
	ElectoralActRepository,
} from "@arkelythex/domain-civic";
import type { ElectionResultsDTO } from "../dto";

export interface GetElectionResultsInput {
	electionId: string;
	registeredVoters?: number;
}

export class GetElectionResults {
	constructor(
		private readonly electionRepo: ElectionRepository,
		private readonly actRepo: ElectoralActRepository,
	) {}

	async execute(input: GetElectionResultsInput): Promise<ElectionResultsDTO> {
		const election = await this.electionRepo.findById(input.electionId);
		if (!election) {
			throw new Error(`Election not found: ${input.electionId}`);
		}

		// Collect all acts for this election
		const allActs: Array<{ stationId: string; tallies: Map<string, number> }> =
			[];

		for (const stationId of election.pollingStationIds) {
			const stationActs = await this.actRepo.findByStation(stationId);
			for (const act of stationActs) {
				allActs.push({
					stationId: act.stationId,
					tallies: act.voteTallies,
				});
			}
		}

		// Aggregate votes per candidate
		const candidateTotals = new Map<string, number>();
		for (const act of allActs) {
			for (const [candidateId, votes] of act.tallies) {
				candidateTotals.set(
					candidateId,
					(candidateTotals.get(candidateId) ?? 0) + (votes as number),
				);
			}
		}

		const totalVotes = Array.from(candidateTotals.values()).reduce(
			(a, b) => a + b,
			0,
		);

		// Build results
		const results = Array.from(candidateTotals.entries())
			.map(([candidateId, votes]) => ({
				candidateId,
				candidateName: candidateId,
				party: "unknown",
				votes,
				percentage: totalVotes > 0 ? (votes / totalVotes) * 100 : 0,
				isValid: true,
			}))
			.sort((a, b) => b.votes - a.votes);

		const reportedPollingStations = allActs.length;
		const totalPollingStations = election.pollingStationIds.length;

		// Estimate blank/null votes (not tracked per-station in current model)
		const validVotes = totalVotes;
		const blankVotes = 0;
		const nullVotes = 0;

		const turnout =
			input.registeredVoters && input.registeredVoters > 0
				? totalVotes / input.registeredVoters
				: 0;

		return {
			electionId: election.id,
			electionName: election.name,
			region: election.region,
			totalVotes,
			turnout,
			results,
			metadata: {
				totalPollingStations,
				reportedPollingStations,
				validVotes,
				blankVotes,
				nullVotes,
			},
		};
	}
}
