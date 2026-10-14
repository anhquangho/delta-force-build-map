BEGIN;
SELECT plan(49);

SELECT has_table('public', 'sources', 'sources exists');
SELECT has_table('public', 'source_snapshots', 'source_snapshots exists');
SELECT has_table('public', 'assets', 'assets exists');
SELECT has_table('public', 'maps', 'maps exists');
SELECT has_table('public', 'map_versions', 'map_versions exists');
SELECT has_table('public', 'areas', 'areas exists');
SELECT has_table('public', 'categories', 'categories exists');
SELECT has_table('public', 'item_catalog', 'item_catalog exists');
SELECT has_table('public', 'entities', 'entities exists');
SELECT has_table('public', 'entity_aliases', 'entity_aliases exists');
SELECT has_table('public', 'markers', 'markers exists');
SELECT has_table('public', 'marker_import_candidates', 'marker_import_candidates exists');
SELECT has_table('public', 'entity_relations', 'entity_relations exists');
SELECT has_table('public', 'record_sources', 'record_sources exists');
SELECT has_table('public', 'reviews', 'reviews exists');
SELECT has_table('public', 'import_runs', 'import_runs exists');

SELECT is(
  (SELECT count(*)::integer FROM pg_catalog.pg_class WHERE relnamespace = 'public'::regnamespace AND relrowsecurity AND relname = ANY (ARRAY[
    'sources', 'source_snapshots', 'assets', 'maps', 'map_versions', 'areas', 'categories', 'item_catalog', 'entities', 'entity_aliases', 'markers', 'marker_import_candidates', 'entity_relations', 'record_sources', 'reviews', 'import_runs'
  ])),
  16,
  'RLS is enabled on every application table'
);
SELECT is(
  (SELECT count(*)::integer FROM pg_catalog.pg_policies WHERE schemaname = 'public' AND tablename = ANY (ARRAY[
    'sources', 'source_snapshots', 'assets', 'maps', 'map_versions', 'areas', 'categories', 'item_catalog', 'entities', 'entity_aliases', 'markers', 'marker_import_candidates', 'entity_relations', 'record_sources', 'reviews', 'import_runs'
  ])),
  0,
  'no public or authenticated policies are present'
);
SELECT ok(NOT has_table_privilege('anon', 'public.markers', 'select'), 'anon has no marker select grant');
SELECT ok(NOT has_table_privilege('authenticated', 'public.marker_import_candidates', 'insert'), 'authenticated has no candidate insert grant');

INSERT INTO public.sources (id, slug, name, source_type, source_role, reuse_status)
VALUES
  ('10000000-0000-4000-8000-000000000001', 'synthetic-source', 'Synthetic source', 'synthetic fixture', 'current_game_observation', 'unconfirmed'),
  ('10000000-0000-4000-8000-000000000002', 'synthetic-other-source', 'Synthetic other source', 'synthetic fixture', 'other', 'unconfirmed');

INSERT INTO public.source_snapshots (id, source_id, source_url, retrieved_at, content_hash)
VALUES ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'synthetic:fixture', now(), 'synthetic-hash');

INSERT INTO public.maps (id, slug, name_en, name_vi)
VALUES ('30000000-0000-4000-8000-000000000001', 'synthetic-map', 'Synthetic Map', 'Bản đồ tổng hợp');

INSERT INTO public.map_versions (id, map_id, version_key, width, height)
VALUES ('40000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 'synthetic-v1', 1000, 1000);

INSERT INTO public.categories (id, slug, name_en, name_vi)
VALUES
  ('50000000-0000-4000-8000-000000000001', 'container', 'Container', 'Đồ chứa'),
  ('50000000-0000-4000-8000-000000000002', 'access', 'Access', 'Truy cập'),
  ('50000000-0000-4000-8000-000000000003', 'location', 'Location', 'Địa điểm');

INSERT INTO public.item_catalog (id, name_en, name_vi, catalog_category, fallback_icon_ref)
VALUES ('60000000-0000-4000-8000-000000000001', 'Synthetic Keycard', 'Thẻ khóa tổng hợp', 'access-card', 'icons/access-card.svg');

INSERT INTO public.entities (id, slug, entity_type, category_id, name_en, name_vi, catalog_item_id)
VALUES
  ('70000000-0000-4000-8000-000000000001', 'synthetic-container', 'loot_container', '50000000-0000-4000-8000-000000000001', 'Synthetic Container', 'Đồ chứa tổng hợp', NULL),
  ('70000000-0000-4000-8000-000000000002', 'synthetic-keycard', 'inventory_item', '50000000-0000-4000-8000-000000000002', 'Synthetic Keycard', 'Thẻ khóa tổng hợp', '60000000-0000-4000-8000-000000000001'),
  ('70000000-0000-4000-8000-000000000003', 'synthetic-poi', 'map_poi', '50000000-0000-4000-8000-000000000003', 'Synthetic POI', 'POI tổng hợp', NULL);

INSERT INTO public.markers (id, map_version_id, entity_id, source_x, source_y, source_coordinate_space, x_normalized, y_normalized)
VALUES ('80000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000003', 100, 200, 'synthetic-coordinate-space', 0.5, 0.5);

INSERT INTO public.record_sources (record_type, record_id, map_version_id, source_id, source_snapshot_id, source_external_id, source_claims_validated, claim_value)
VALUES ('marker', '80000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'synthetic-marker-1', true, '{"randomSpawn":false}'::jsonb);

INSERT INTO public.entity_aliases (id, entity_id, locale, alias, normalized_alias, alias_type)
VALUES ('a0000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000003', 'en', 'synthetic poi', 'synthetic poi', 'test');

SELECT is((SELECT verification_status FROM public.markers WHERE id = '80000000-0000-4000-8000-000000000001'), 'candidate', 'source validation does not promote project verification');
SELECT is((SELECT is_published FROM public.markers WHERE id = '80000000-0000-4000-8000-000000000001'), false, 'markers default unpublished');
SELECT is((SELECT source_claims_validated FROM public.record_sources WHERE source_external_id = 'synthetic-marker-1'), true, 'upstream validation remains a separate source claim');
SELECT is((SELECT catalog_item_id FROM public.entities WHERE id = '70000000-0000-4000-8000-000000000002'), '60000000-0000-4000-8000-000000000001'::uuid, 'inventory entity links to an item catalog row');
SELECT is((SELECT is_published FROM public.item_catalog WHERE id = '60000000-0000-4000-8000-000000000001'), false, 'item catalog defaults unpublished');
SELECT is((SELECT entity_type FROM public.entities WHERE id = '70000000-0000-4000-8000-000000000002'), 'inventory_item', 'inventory item semantics are distinct');
SELECT is((SELECT entity_type FROM public.entities WHERE id = '70000000-0000-4000-8000-000000000003'), 'map_poi', 'POI semantics are distinct');

SELECT lives_ok(
  $$INSERT INTO public.marker_import_candidates (id, map_version_id, source_id, source_snapshot_id, source_external_id, source_key, coordinate_space, source_x, source_y, candidate_x_normalized, candidate_y_normalized, within_local_crop, source_claims_validated, source_claims, defer_reason)
    VALUES ('90000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'synthetic-outside-1', 'synthetic_unmapped', 'synthetic-coordinate-space', 4000, 200, 1.25, 0.5, false, true, '{"randomSpawn":false}'::jsonb, 'synthetic out-of-crop point')$$,
  'out-of-crop source candidate is retained without clamping'
);
SELECT is((SELECT candidate_x_normalized FROM public.marker_import_candidates WHERE source_external_id = 'synthetic-outside-1'), 1.25::double precision, 'out-of-crop candidate coordinate is preserved');
SELECT is((SELECT within_local_crop FROM public.marker_import_candidates WHERE source_external_id = 'synthetic-outside-1'), false, 'out-of-crop candidate is marked invisible');
SELECT ok((SELECT promoted_marker_id IS NULL FROM public.marker_import_candidates WHERE source_external_id = 'synthetic-outside-1'), 'out-of-crop candidate is not a canonical marker');

SELECT throws_ok(
  $$INSERT INTO public.markers (id, map_version_id, entity_id, x_normalized, y_normalized)
    VALUES ('80000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000003', 1.01, 0.5)$$,
  '23514', NULL, 'canonical marker rejects normalized coordinates outside 0..1'
);
SELECT throws_ok(
  $$INSERT INTO public.markers (id, map_version_id, entity_id, x_normalized, y_normalized)
    VALUES ('80000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000000', 0.5, 0.5)$$,
  '23503', NULL, 'marker entity foreign key is enforced'
);
SELECT throws_ok(
  $$INSERT INTO public.entity_aliases (id, entity_id, locale, alias, normalized_alias, alias_type)
    VALUES ('a0000000-0000-4000-8000-000000000002', '70000000-0000-4000-8000-000000000003', 'en', 'synthetic poi', 'synthetic poi', 'test')$$,
  '23505', NULL, 'duplicate alias identity is rejected'
);
SELECT throws_ok(
  $$INSERT INTO public.marker_import_candidates (id, map_version_id, source_id, source_snapshot_id, source_external_id, source_key, coordinate_space, source_x, source_y, candidate_x_normalized, candidate_y_normalized, within_local_crop)
    VALUES ('90000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'synthetic-bad-crop-1', 'synthetic_unmapped', 'synthetic-coordinate-space', 100, 200, 1.25, 0.5, true)$$,
  '23514', NULL, 'candidate crop flag must match its unclamped projection'
);
SELECT throws_ok(
  $$INSERT INTO public.marker_import_candidates (id, map_version_id, source_id, source_snapshot_id, source_external_id, source_key, coordinate_space, source_x, source_y, candidate_x_normalized, candidate_y_normalized, within_local_crop)
    VALUES ('90000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'synthetic-outside-1', 'synthetic_unmapped', 'synthetic-coordinate-space', 4100, 200, 1.28, 0.5, false)$$,
  '23505', NULL, 'source external ID is unique within a map version'
);
SELECT throws_ok(
  $$INSERT INTO public.entity_relations (id, from_entity_id, relation_type, to_entity_id, map_version_id)
    VALUES ('b0000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000002', 'unlocks', '00000000-0000-4000-8000-000000000000', '40000000-0000-4000-8000-000000000001')$$,
  '23503', NULL, 'relationship entity foreign key is enforced'
);
SELECT throws_ok(
  $$INSERT INTO public.marker_import_candidates (id, map_version_id, source_id, source_snapshot_id, source_external_id, source_key, coordinate_space, source_x, source_y, candidate_x_normalized, candidate_y_normalized, within_local_crop)
    VALUES ('90000000-0000-4000-8000-000000000004', '40000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', 'synthetic-mismatched-snapshot', 'synthetic_unmapped', 'synthetic-coordinate-space', 100, 200, 0.5, 0.5, true)$$,
  '23503', NULL, 'snapshot must belong to the referenced source'
);
SELECT throws_ok(
  $$INSERT INTO public.entities (id, slug, entity_type, category_id, name_en, name_vi)
    VALUES ('70000000-0000-4000-8000-000000000004', 'synthetic-poi', 'map_poi', '50000000-0000-4000-8000-000000000003', 'Duplicate slug', 'Slug trùng')$$,
  '23505', NULL, 'project entity slug is unique'
);
SELECT throws_ok(
  $$INSERT INTO public.entities (id, slug, entity_type, category_id, name_en, name_vi)
    VALUES ('70000000-0000-4000-8000-000000000005', 'synthetic-invalid-kind', 'vehicle', '50000000-0000-4000-8000-000000000003', 'Invalid kind', 'Loại sai')$$,
  '23514', NULL, 'entity semantic type is constrained'
);
SELECT throws_ok(
  $$INSERT INTO public.markers (id, map_version_id, entity_id, x_normalized, y_normalized)
    VALUES ('80000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000000', '70000000-0000-4000-8000-000000000003', 0.5, 0.5)$$,
  '23503', NULL, 'marker map version foreign key is enforced'
);
SELECT throws_ok(
  $$INSERT INTO public.marker_import_candidates (id, map_version_id, source_id, source_snapshot_id, source_key, coordinate_space, source_x, source_y, candidate_x_normalized, candidate_y_normalized, within_local_crop)
    VALUES ('90000000-0000-4000-8000-000000000005', '40000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'missing-id', 'synthetic-coordinate-space', 100, 200, 0.5, 0.5, true)$$,
  '23514', NULL, 'source candidate requires an external id or source fingerprint'
);
SELECT throws_ok(
  $$INSERT INTO public.markers (id, map_version_id, entity_id, x_normalized, y_normalized, verification_status, is_published)
    VALUES ('80000000-0000-4000-8000-000000000005', '40000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000003', 0.5, 0.5, 'candidate', true)$$,
  '23514', NULL, 'candidate marker cannot be published'
);
SELECT throws_ok(
  $$INSERT INTO public.map_versions (id, map_id, version_key, width, height)
    VALUES ('40000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000001', 'synthetic-v1', 1000, 1000)$$,
  '23505', NULL, 'map version key is unique within its map'
);
SELECT lives_ok(
  $$INSERT INTO public.marker_import_candidates (id, map_version_id, source_id, source_snapshot_id, source_record_fingerprint, source_key, coordinate_space, source_x, source_y, candidate_x_normalized, candidate_y_normalized, within_local_crop)
    VALUES ('90000000-0000-4000-8000-000000000006', '40000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'synthetic-fingerprint-1', 'synthetic_observation', 'synthetic-coordinate-space', 100, 200, 0.25, 0.25, true)$$,
  'a source fingerprint can identify records without upstream IDs'
);
SELECT is((SELECT count(*)::integer FROM public.marker_import_candidates WHERE source_record_fingerprint = 'synthetic-fingerprint-1'), 1, 'source fingerprint is stored as provenance');
SELECT throws_ok(
  $$INSERT INTO public.marker_import_candidates (id, map_version_id, source_id, source_snapshot_id, source_record_fingerprint, source_key, coordinate_space, source_x, source_y, candidate_x_normalized, candidate_y_normalized, within_local_crop)
    VALUES ('90000000-0000-4000-8000-000000000007', '40000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'synthetic-fingerprint-1', 'synthetic_observation', 'synthetic-coordinate-space', 101, 201, 0.26, 0.26, true)$$,
  '23505', NULL, 'source fingerprint is unique within a map version'
);

SET LOCAL ROLE anon;
SELECT throws_ok($$SELECT id FROM public.markers$$, '42501', NULL, 'anon cannot read marker rows');
SELECT throws_ok($$INSERT INTO public.entities (slug, entity_type, category_id, name_en, name_vi) VALUES ('anon-attempt', 'other', '50000000-0000-4000-8000-000000000003', 'Anon', 'Anon')$$, '42501', NULL, 'anon cannot write entity rows');
RESET ROLE;

SELECT * FROM finish();
ROLLBACK;
