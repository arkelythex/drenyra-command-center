-- Security Logs Migration
-- Creates tables for failed login attempts, access logs, and prompt guard audit
-- Run with: bun run db:migrate

-- Failed Login Attempts
CREATE TABLE IF NOT EXISTS failed_login_attempts (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  user_agent TEXT,
  reason VARCHAR(50) NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 1,
  locked_until TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_failed_login_email ON failed_login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_failed_login_ip ON failed_login_attempts(ip_address);

-- Access Logs
CREATE TABLE IF NOT EXISTS access_logs (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(36),
  user_email VARCHAR(255),
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  result VARCHAR(20) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  details TEXT,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_access_logs_user ON access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_action ON access_logs(action);
CREATE INDEX IF NOT EXISTS idx_access_logs_timestamp ON access_logs(timestamp);

-- Prompt Guard Audit
CREATE TABLE IF NOT EXISTS prompt_guard_audit (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(36),
  action VARCHAR(100) NOT NULL,
  prompt TEXT,
  allowed INTEGER NOT NULL,
  reason TEXT,
  blocked_keyword VARCHAR(50),
  requires_admin_override INTEGER NOT NULL DEFAULT 0,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prompt_guard_user ON prompt_guard_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_guard_allowed ON prompt_guard_audit(allowed);
