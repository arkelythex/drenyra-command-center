export interface DiffImpact {
	taxImpact?: {
		amount: number;
		currency: string;
		concept: string;
	};
	riskScore: number;
	confidence: number;
}
