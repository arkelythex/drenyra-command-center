DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'fiscal_evidence_edges_from_node_id_fiscal_evidence_nodes_node_id_fk'
			AND conrelid = 'fiscal_evidence_edges'::regclass
	) THEN
		ALTER TABLE "fiscal_evidence_edges"
		ADD CONSTRAINT "fiscal_evidence_edges_from_node_id_fiscal_evidence_nodes_node_id_fk"
		FOREIGN KEY ("from_node_id")
		REFERENCES "fiscal_evidence_nodes"("node_id");
	END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'fiscal_evidence_edges_to_node_id_fiscal_evidence_nodes_node_id_fk'
			AND conrelid = 'fiscal_evidence_edges'::regclass
	) THEN
		ALTER TABLE "fiscal_evidence_edges"
		ADD CONSTRAINT "fiscal_evidence_edges_to_node_id_fiscal_evidence_nodes_node_id_fk"
		FOREIGN KEY ("to_node_id")
		REFERENCES "fiscal_evidence_nodes"("node_id");
	END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'fiscal_truth_events_evidence_root_node_id_fiscal_evidence_nodes_node_id_fk'
			AND conrelid = 'fiscal_truth_events'::regclass
	) THEN
		ALTER TABLE "fiscal_truth_events"
		ADD CONSTRAINT "fiscal_truth_events_evidence_root_node_id_fiscal_evidence_nodes_node_id_fk"
		FOREIGN KEY ("evidence_root_node_id")
		REFERENCES "fiscal_evidence_nodes"("node_id");
	END IF;
END $$;
