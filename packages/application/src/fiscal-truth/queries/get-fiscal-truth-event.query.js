export class GetFiscalTruthEventQuery {
	repository;
	constructor(repository) {
		this.repository = repository;
	}
	execute(input) {
		return this.repository.findByEventId(input.eventId, input.scope);
	}
}
//# sourceMappingURL=get-fiscal-truth-event.query.js.map
