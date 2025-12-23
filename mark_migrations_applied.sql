-- ============================================
-- Marcar migrations anteriores como aplicadas
-- ============================================
-- Este script marca as migrations 001-015 como aplicadas
-- já que foram executadas manualmente
INSERT INTO
  supabase_migrations.schema_migrations (version)
VALUES
  ('20240101000001'),
  ('20240101000002'),
  ('20240101000003'),
  ('20240101000004'),
  ('20240101000005'),
  ('20240101000006'),
  ('20240101000007'),
  ('20240101000008'),
  ('20240101000009'),
  ('20240101000010'),
  ('20240101000011'),
  ('20240101000012'),
  ('20240101000013'),
  ('20240101000014'),
  ('20240101000015'),
  ('20240101000016'),
  ('20240101000017') ON CONFLICT (version) DO NOTHING;