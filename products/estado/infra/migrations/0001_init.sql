-- Audit log (append-only)
create table if not exists audit_events (
  id            uuid primary key,
  occurred_at   timestamptz not null,
  actor_type    text not null,
  actor_id      text,
  action        text not null,
  target_type   text not null,
  target_id     text,
  metadata      jsonb not null default '{}'
);

-- MVP-A: transparency
create table if not exists dataset_sources (
  id uuid primary key,
  kind text not null,
  url text,
  owner text,
  license text,
  created_at timestamptz not null
);

create table if not exists dataset_versions (
  id uuid primary key,
  source_id uuid not null references dataset_sources(id),
  checksum_sha256 text not null,
  ingested_at timestamptz not null
);

create table if not exists expense_records (
  id uuid primary key,
  version_id uuid not null references dataset_versions(id),
  entity text not null,
  category text not null,
  amount numeric(18,2) not null,
  occurred_on date,
  doc_ref text
);

-- MVP-B: reports
create table if not exists reports (
  id uuid primary key,
  status text not null,
  category text not null,
  description text not null,
  created_at timestamptz not null
);

create table if not exists evidence (
  id uuid primary key,
  report_id uuid not null references reports(id),
  storage_ref text not null,
  sha256 text not null,
  uploaded_at timestamptz not null
);

create table if not exists verification_cases (
  id uuid primary key,
  report_id uuid not null references reports(id),
  status text not null,
  assigned_to text,
  notes text,
  updated_at timestamptz not null
);

create table if not exists publications (
  id uuid primary key,
  report_id uuid not null references reports(id),
  public_text text not null,
  published_at timestamptz not null
);
