-- Deterministic local seed for contributor onboarding.

insert into dataset_sources (id, kind, url, owner, license, created_at)
values
  ('11111111-1111-1111-1111-111111111111', 'open_data', 'https://example.gob.pe/opendata/gastos.csv', 'Municipio Demo', 'open', now())
on conflict (id) do nothing;

insert into dataset_versions (id, source_id, checksum_sha256, ingested_at)
values
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'demo-seed-checksum', now())
on conflict (id) do nothing;

insert into expense_records (id, version_id, entity, category, amount, occurred_on, doc_ref)
values
  ('33333333-3333-3333-3333-333333333331', '22222222-2222-2222-2222-222222222222', 'Municipio Demo', 'infraestructura', 1250.75, '2026-02-01', 'DOC-001'),
  ('33333333-3333-3333-3333-333333333332', '22222222-2222-2222-2222-222222222222', 'Municipio Demo', 'servicios', 320.50, '2026-02-02', 'DOC-002'),
  ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'Municipio Demo', 'rrhh', 2100.00, '2026-02-03', 'DOC-003')
on conflict (id) do nothing;

insert into reports (id, status, category, description, created_at)
values
  ('44444444-4444-4444-4444-444444444444', 'PUBLISHED', 'OBRAS', 'Reporte demo seed', now())
on conflict (id) do nothing;

insert into publications (id, report_id, public_text, published_at)
values
  ('55555555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444', 'Reporte seed publicado (redactado)', now())
on conflict (id) do nothing;

insert into audit_events (id, occurred_at, actor_type, actor_id, action, target_type, target_id, metadata)
values
  ('66666666-6666-6666-6666-666666666666', now(), 'system', null, 'seed_import', 'dataset_version', '22222222-2222-2222-2222-222222222222', '{"source":"infra/seeds/001_demo.sql"}'::jsonb)
on conflict (id) do nothing;
