export class GetElectionResults {
    electionRepo;
    actRepo;
    constructor(electionRepo, actRepo) {
        this.electionRepo = electionRepo;
        this.actRepo = actRepo;
    }
    async execute(input) {
        const election = await this.electionRepo.findById(input.electionId);
        if (!election) {
            throw new Error(`Election not found: ${input.electionId}`);
        }
        const allActs = [];
        for (const stationId of election.pollingStationIds) {
            const stationActs = await this.actRepo.findByStation(stationId);
            for (const act of stationActs) {
                allActs.push({
                    stationId: act.stationId,
                    tallies: act.voteTallies,
                });
            }
        }
        const candidateTotals = new Map();
        for (const act of allActs) {
            for (const [candidateId, votes] of act.tallies) {
                candidateTotals.set(candidateId, (candidateTotals.get(candidateId) ?? 0) + votes);
            }
        }
        const totalVotes = Array.from(candidateTotals.values()).reduce((a, b) => a + b, 0);
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
        const validVotes = totalVotes;
        const blankVotes = 0;
        const nullVotes = 0;
        const turnout = input.registeredVoters && input.registeredVoters > 0
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
//# sourceMappingURL=GetElectionResults.js.map