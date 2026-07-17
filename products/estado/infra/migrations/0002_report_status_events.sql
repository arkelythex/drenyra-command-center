create table if not exists report_status_events (
  id uuid primary key,
  report_id uuid not null references reports(id) on delete cascade,
  from_status text not null,
  to_status text not null,
  action text not null,
  occurred_at timestamptz not null
);

create index if not exists idx_report_status_events_report_id_occurred_at
  on report_status_events(report_id, occurred_at);

create index if not exists idx_report_status_events_to_status_occurred_at
  on report_status_events(to_status, occurred_at);
