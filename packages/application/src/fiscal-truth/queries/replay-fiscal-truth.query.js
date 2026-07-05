export class ReplayFiscalTruthQuery {
	replayService;
	constructor(replayService) {
		this.replayService = replayService;
	}
	execute(input) {
		return this.replayService.execute(input);
	}
}
//# sourceMappingURL=replay-fiscal-truth.query.js.map
