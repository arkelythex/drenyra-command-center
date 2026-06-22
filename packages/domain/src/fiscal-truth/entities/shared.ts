import { EVIDENCE_EDGE_KIND, TRUTH_EVENT_KIND } from "../constants";

export type TruthEventKind =
	(typeof TRUTH_EVENT_KIND)[keyof typeof TRUTH_EVENT_KIND];

export type EvidenceEdgeKind =
	(typeof EVIDENCE_EDGE_KIND)[keyof typeof EVIDENCE_EDGE_KIND];
