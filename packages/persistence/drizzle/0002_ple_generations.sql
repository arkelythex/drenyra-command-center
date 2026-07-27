-- =============================================================================
-- PLE Generations — Migration
-- =============================================================================
-- Change: drenyra-reporting-financials
-- Phase: 1 — PLE Compliance & Foundation
-- Type: Additive only
-- =============================================================================

CREATE TABLE IF NOT EXISTS ple_generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,

    -- Book identification
    book_type VARCHAR(20) NOT NULL,              -- LE-DIARIO, LE-MAYOR, LE-COMPRAS, LE-VENTAS
    period VARCHAR(7) NOT NULL,                  -- YYYY-MM
    ruc VARCHAR(11) NOT NULL,

    -- Status lifecycle
    status VARCHAR(20) NOT NULL DEFAULT 'generated', -- generated, validated, validation_failed, filed

    -- Content (only stored when validated)
    file_content TEXT,
    file_size_bytes INTEGER,

    -- CDR hash
    cdr_hash VARCHAR(64),

    -- SUNAT response (filed only)
    sunat_response JSONB,

    -- Error tracking
    validation_errors JSONB,

    -- Metadata
    generated_by UUID,
    generated_at TIMESTAMP DEFAULT now() NOT NULL,
    validated_at TIMESTAMP,
    filed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT now() NOT NULL,
    updated_at TIMESTAMP DEFAULT now() NOT NULL
);

-- Unique constraint: one generation per company/book/period
CREATE UNIQUE INDEX IF NOT EXISTS ple_generations_book_period_ruc_uniq
    ON ple_generations(company_id, book_type, period);

-- Index for listing by company
CREATE INDEX IF NOT EXISTS idx_ple_generations_company_book_period
    ON ple_generations(company_id, book_type, period);

-- Index for status queries
CREATE INDEX IF NOT EXISTS idx_ple_generations_status
    ON ple_generations(status);

-- =============================================================================
-- Report Generation Log
-- =============================================================================
CREATE TABLE IF NOT EXISTS report_generation_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    report_type VARCHAR(50) NOT NULL,
    format VARCHAR(10) NOT NULL DEFAULT 'txt',
    status VARCHAR(20) NOT NULL DEFAULT 'generated',
    file_size INTEGER,
    generated_by UUID,
    generated_at TIMESTAMP DEFAULT now() NOT NULL,
    created_at TIMESTAMP DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rgl_company_type
    ON report_generation_log(company_id, report_type);

CREATE INDEX IF NOT EXISTS idx_rgl_generated_at
    ON report_generation_log(generated_at);

-- =============================================================================
-- ROLLBACK (reference only)
-- =============================================================================
/*
DROP INDEX IF EXISTS idx_rgl_generated_at;
DROP INDEX IF EXISTS idx_rgl_company_type;
DROP TABLE IF EXISTS report_generation_log;

DROP INDEX IF EXISTS idx_ple_generations_status;
DROP INDEX IF EXISTS idx_ple_generations_company_book_period;
DROP INDEX IF EXISTS ple_generations_book_period_ruc_uniq;
DROP TABLE IF EXISTS ple_generations;
*/
