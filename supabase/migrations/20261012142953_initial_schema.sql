CREATE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
BEGIN
  NEW.updated_at := pg_catalog.now();
  RETURN NEW;
END;
$$;

CREATE TABLE public.sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text NOT NULL CHECK (btrim(name) <> ''),
  source_type text NOT NULL CHECK (btrim(source_type) <> ''),
  source_role text NOT NULL CHECK (source_role IN (
    'authoritative_reference',
    'rich_context_reference',
    'compact_data_reference',
    'current_candidate_reference',
    'current_game_observation',
    'other'
  )),
  base_url text,
  license_or_terms_url text,
  reuse_status text NOT NULL DEFAULT 'unconfirmed' CHECK (reuse_status IN ('unconfirmed', 'permitted', 'not-approved')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.source_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES public.sources(id) ON DELETE RESTRICT,
  source_url text NOT NULL CHECK (btrim(source_url) <> ''),
  retrieved_at timestamptz NOT NULL,
  source_updated_at timestamptz,
  etag text,
  last_modified text,
  content_hash text,
  parser_version text,
  storage_ref text,
  rights_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, source_id)
);

CREATE UNIQUE INDEX source_snapshots_source_hash_uq
  ON public.source_snapshots (source_id, content_hash)
  WHERE content_hash IS NOT NULL;

CREATE TABLE public.assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_type text NOT NULL CHECK (btrim(asset_type) <> ''),
  storage_path text NOT NULL CHECK (btrim(storage_path) <> ''),
  owner text NOT NULL CHECK (btrim(owner) <> ''),
  license_or_permission text NOT NULL CHECK (btrim(license_or_permission) <> ''),
  checksum text NOT NULL CHECK (btrim(checksum) <> ''),
  source_id uuid REFERENCES public.sources(id) ON DELETE RESTRICT,
  is_approved_for_public_use boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (storage_path)
);

CREATE TABLE public.maps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name_en text NOT NULL CHECK (btrim(name_en) <> ''),
  name_vi text NOT NULL CHECK (btrim(name_vi) <> ''),
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.map_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  map_id uuid NOT NULL REFERENCES public.maps(id) ON DELETE RESTRICT,
  version_key text NOT NULL CHECK (btrim(version_key) <> ''),
  width integer NOT NULL CHECK (width > 0),
  height integer NOT NULL CHECK (height > 0),
  coordinate_system text NOT NULL DEFAULT 'image_normalized' CHECK (btrim(coordinate_system) <> ''),
  transform_config jsonb CHECK (transform_config IS NULL OR jsonb_typeof(transform_config) = 'object'),
  basemap_asset_id uuid REFERENCES public.assets(id) ON DELETE RESTRICT,
  game_version text,
  effective_from date,
  effective_to date,
  verification_status text NOT NULL DEFAULT 'candidate' CHECK (verification_status IN ('candidate', 'reviewed', 'verified', 'disputed', 'stale')),
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (map_id, version_key),
  UNIQUE (id, map_id),
  CHECK (effective_from IS NULL OR effective_to IS NULL OR effective_to >= effective_from),
  CHECK (NOT is_published OR verification_status IN ('reviewed', 'verified'))
);

CREATE TABLE public.areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  map_version_id uuid NOT NULL REFERENCES public.map_versions(id) ON DELETE RESTRICT,
  parent_id uuid,
  slug text NOT NULL CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name_en text NOT NULL CHECK (btrim(name_en) <> ''),
  name_vi text NOT NULL CHECK (btrim(name_vi) <> ''),
  x_normalized numeric,
  y_normalized numeric,
  verification_status text NOT NULL DEFAULT 'candidate' CHECK (verification_status IN ('candidate', 'reviewed', 'verified', 'disputed', 'stale')),
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (map_version_id, slug),
  UNIQUE (map_version_id, id),
  FOREIGN KEY (map_version_id, parent_id) REFERENCES public.areas(map_version_id, id) ON DELETE RESTRICT,
  CHECK (parent_id IS NULL OR parent_id <> id),
  CHECK ((x_normalized IS NULL) = (y_normalized IS NULL)),
  CHECK (x_normalized IS NULL OR (x_normalized BETWEEN 0 AND 1 AND y_normalized BETWEEN 0 AND 1)),
  CHECK (NOT is_published OR verification_status IN ('reviewed', 'verified'))
);

CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES public.categories(id) ON DELETE RESTRICT,
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name_en text NOT NULL CHECK (btrim(name_en) <> ''),
  name_vi text NOT NULL CHECK (btrim(name_vi) <> ''),
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  CHECK (parent_id IS NULL OR parent_id <> id)
);

CREATE TABLE public.item_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en text NOT NULL CHECK (btrim(name_en) <> ''),
  name_vi text,
  catalog_category text NOT NULL CHECK (catalog_category IN ('container', 'access-card')),
  rarity text CHECK (rarity IS NULL OR rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary', 'special')),
  weight_kg numeric CHECK (weight_kg IS NULL OR weight_kg >= 0),
  description_vi text,
  description_en text,
  icon_asset_id uuid REFERENCES public.assets(id) ON DELETE RESTRICT,
  fallback_icon_ref text NOT NULL CHECK (
    btrim(fallback_icon_ref) <> ''
    AND position('://' IN fallback_icon_ref) = 0
    AND position('..' IN fallback_icon_ref) = 0
  ),
  verification_status text NOT NULL DEFAULT 'candidate' CHECK (verification_status IN ('candidate', 'reviewed', 'verified', 'disputed', 'stale')),
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (NOT is_published OR verification_status IN ('reviewed', 'verified'))
);

CREATE TABLE public.entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  entity_type text NOT NULL CHECK (entity_type IN ('inventory_item', 'loot_container', 'map_poi', 'extraction', 'spawn', 'other')),
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  name_en text NOT NULL CHECK (btrim(name_en) <> ''),
  name_vi text NOT NULL CHECK (btrim(name_vi) <> ''),
  description_en text,
  description_vi text,
  catalog_item_id uuid UNIQUE REFERENCES public.item_catalog(id) ON DELETE RESTRICT,
  verification_status text NOT NULL DEFAULT 'candidate' CHECK (verification_status IN ('candidate', 'reviewed', 'verified', 'disputed', 'stale')),
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (catalog_item_id IS NULL OR entity_type IN ('inventory_item', 'loot_container')),
  CHECK (NOT is_published OR verification_status IN ('reviewed', 'verified'))
);

CREATE TABLE public.entity_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
  locale text NOT NULL CHECK (locale IN ('vi', 'en', 'mixed')),
  alias text NOT NULL CHECK (btrim(alias) <> ''),
  normalized_alias text NOT NULL CHECK (btrim(normalized_alias) <> ''),
  alias_type text NOT NULL CHECK (btrim(alias_type) <> ''),
  weight smallint NOT NULL DEFAULT 0,
  verification_status text NOT NULL DEFAULT 'candidate' CHECK (verification_status IN ('candidate', 'reviewed', 'verified', 'disputed', 'stale')),
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entity_id, locale, normalized_alias),
  CHECK (NOT is_published OR verification_status IN ('reviewed', 'verified'))
);

CREATE TABLE public.markers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  map_version_id uuid NOT NULL REFERENCES public.map_versions(id) ON DELETE RESTRICT,
  area_id uuid,
  entity_id uuid NOT NULL REFERENCES public.entities(id) ON DELETE RESTRICT,
  source_x numeric,
  source_y numeric,
  source_z numeric,
  source_coordinate_space text,
  map_x numeric,
  map_y numeric,
  x_normalized numeric NOT NULL CHECK (x_normalized BETWEEN 0 AND 1),
  y_normalized numeric NOT NULL CHECK (y_normalized BETWEEN 0 AND 1),
  floor_key text,
  is_random_spawn boolean,
  difficulties text[] NOT NULL DEFAULT '{}',
  conditions jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(conditions) = 'object'),
  notes_en text,
  notes_vi text,
  verification_status text NOT NULL DEFAULT 'candidate' CHECK (verification_status IN ('candidate', 'reviewed', 'verified', 'disputed', 'stale')),
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (map_version_id, id),
  FOREIGN KEY (map_version_id, area_id) REFERENCES public.areas(map_version_id, id) ON DELETE RESTRICT,
  CHECK ((source_x IS NULL) = (source_y IS NULL)),
  CHECK ((source_x IS NULL) = (source_coordinate_space IS NULL)),
  CHECK (source_x IS NULL OR (source_x > '-Infinity'::numeric AND source_x < 'Infinity'::numeric)),
  CHECK (source_y IS NULL OR (source_y > '-Infinity'::numeric AND source_y < 'Infinity'::numeric)),
  CHECK (source_z IS NULL OR (source_z > '-Infinity'::numeric AND source_z < 'Infinity'::numeric)),
  CHECK (NOT is_published OR verification_status IN ('reviewed', 'verified'))
);

CREATE TABLE public.marker_import_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  map_version_id uuid NOT NULL REFERENCES public.map_versions(id) ON DELETE RESTRICT,
  entity_id uuid REFERENCES public.entities(id) ON DELETE RESTRICT,
  source_id uuid NOT NULL REFERENCES public.sources(id) ON DELETE RESTRICT,
  source_snapshot_id uuid NOT NULL,
  source_external_id text CHECK (source_external_id IS NULL OR btrim(source_external_id) <> ''),
  source_record_fingerprint text CHECK (source_record_fingerprint IS NULL OR btrim(source_record_fingerprint) <> ''),
  source_key text NOT NULL CHECK (btrim(source_key) <> ''),
  coordinate_space text NOT NULL CHECK (btrim(coordinate_space) <> ''),
  source_x double precision NOT NULL CHECK (source_x > '-Infinity'::double precision AND source_x < 'Infinity'::double precision),
  source_y double precision NOT NULL CHECK (source_y > '-Infinity'::double precision AND source_y < 'Infinity'::double precision),
  source_z double precision CHECK (source_z IS NULL OR (source_z > '-Infinity'::double precision AND source_z < 'Infinity'::double precision)),
  candidate_x_normalized double precision NOT NULL CHECK (candidate_x_normalized > '-Infinity'::double precision AND candidate_x_normalized < 'Infinity'::double precision),
  candidate_y_normalized double precision NOT NULL CHECK (candidate_y_normalized > '-Infinity'::double precision AND candidate_y_normalized < 'Infinity'::double precision),
  within_local_crop boolean NOT NULL,
  source_record_name text,
  source_description text,
  source_claims_validated boolean,
  source_claims jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(source_claims) = 'object'),
  verification_status text NOT NULL DEFAULT 'candidate' CHECK (verification_status IN ('candidate', 'reviewed', 'verified', 'disputed', 'stale')),
  defer_reason text,
  promoted_marker_id uuid UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (source_snapshot_id, source_id) REFERENCES public.source_snapshots(id, source_id) ON DELETE RESTRICT,
  FOREIGN KEY (map_version_id, promoted_marker_id) REFERENCES public.markers(map_version_id, id) ON DELETE RESTRICT,
  CHECK (source_external_id IS NOT NULL OR source_record_fingerprint IS NOT NULL),
  CHECK (
    (within_local_crop AND candidate_x_normalized BETWEEN 0 AND 1 AND candidate_y_normalized BETWEEN 0 AND 1)
    OR
    (NOT within_local_crop AND (candidate_x_normalized < 0 OR candidate_x_normalized > 1 OR candidate_y_normalized < 0 OR candidate_y_normalized > 1))
  ),
  CHECK (promoted_marker_id IS NULL OR within_local_crop)
);

CREATE TABLE public.entity_relations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_entity_id uuid NOT NULL REFERENCES public.entities(id) ON DELETE RESTRICT,
  relation_type text NOT NULL CHECK (relation_type IN ('unlocks', 'located_in', 'contains', 'may_contain', 'near', 'requires', 'related_to')),
  to_entity_id uuid NOT NULL REFERENCES public.entities(id) ON DELETE RESTRICT,
  map_version_id uuid REFERENCES public.map_versions(id) ON DELETE RESTRICT,
  confidence numeric CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1),
  notes text,
  verification_status text NOT NULL DEFAULT 'candidate' CHECK (verification_status IN ('candidate', 'reviewed', 'verified', 'disputed', 'stale')),
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (from_entity_id <> to_entity_id),
  CHECK (NOT is_published OR verification_status IN ('reviewed', 'verified'))
);

CREATE UNIQUE INDEX entity_relations_global_uq
  ON public.entity_relations (from_entity_id, relation_type, to_entity_id)
  WHERE map_version_id IS NULL;

CREATE UNIQUE INDEX entity_relations_map_version_uq
  ON public.entity_relations (from_entity_id, relation_type, to_entity_id, map_version_id)
  WHERE map_version_id IS NOT NULL;

CREATE TABLE public.record_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_type text NOT NULL CHECK (record_type IN ('entity', 'entity_alias', 'marker', 'marker_import_candidate', 'entity_relation', 'item_catalog', 'asset')),
  record_id uuid NOT NULL,
  map_version_id uuid REFERENCES public.map_versions(id) ON DELETE RESTRICT,
  field_name text,
  source_id uuid NOT NULL REFERENCES public.sources(id) ON DELETE RESTRICT,
  source_snapshot_id uuid,
  source_external_id text,
  source_record_fingerprint text,
  source_url text,
  source_updated_at timestamptz,
  retrieved_at timestamptz NOT NULL DEFAULT now(),
  source_claims_validated boolean,
  claim_value jsonb,
  review_notes text,
  FOREIGN KEY (source_snapshot_id, source_id) REFERENCES public.source_snapshots(id, source_id) ON DELETE RESTRICT,
  CHECK (source_external_id IS NULL OR btrim(source_external_id) <> ''),
  CHECK (source_record_fingerprint IS NULL OR btrim(source_record_fingerprint) <> ''),
  CHECK (record_type NOT IN ('marker', 'marker_import_candidate') OR map_version_id IS NOT NULL)
);

CREATE UNIQUE INDEX record_sources_target_source_uq
  ON public.record_sources (record_type, record_id, source_id, coalesce(field_name, ''), coalesce(source_external_id, source_record_fingerprint, ''));

CREATE UNIQUE INDEX record_sources_map_external_id_uq
  ON public.record_sources (record_type, source_id, map_version_id, source_external_id)
  WHERE record_type IN ('marker', 'marker_import_candidate') AND source_external_id IS NOT NULL;

CREATE UNIQUE INDEX record_sources_map_fingerprint_uq
  ON public.record_sources (record_type, source_id, map_version_id, source_record_fingerprint)
  WHERE record_type IN ('marker', 'marker_import_candidate') AND source_record_fingerprint IS NOT NULL;

CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_type text NOT NULL CHECK (record_type IN ('map_version', 'area', 'entity', 'entity_alias', 'marker', 'marker_import_candidate', 'entity_relation', 'item_catalog', 'asset')),
  record_id uuid NOT NULL,
  reviewer_id uuid,
  outcome text NOT NULL CHECK (outcome IN ('pending', 'accepted', 'rejected', 'needs_changes')),
  reviewed_at timestamptz NOT NULL,
  game_version text,
  evidence_summary text NOT NULL CHECK (btrim(evidence_summary) <> ''),
  notes text
);

CREATE TABLE public.import_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES public.sources(id) ON DELETE RESTRICT,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  parser_version text NOT NULL CHECK (btrim(parser_version) <> ''),
  status text NOT NULL CHECK (status IN ('running', 'succeeded', 'failed', 'cancelled')),
  snapshot_id uuid,
  candidate_count integer NOT NULL DEFAULT 0 CHECK (candidate_count >= 0),
  changed_count integer NOT NULL DEFAULT 0 CHECK (changed_count >= 0),
  error_summary text,
  FOREIGN KEY (snapshot_id, source_id) REFERENCES public.source_snapshots(id, source_id) ON DELETE RESTRICT,
  CHECK (finished_at IS NULL OR finished_at >= started_at)
);

CREATE INDEX map_versions_map_id_idx ON public.map_versions (map_id);
CREATE INDEX areas_map_version_idx ON public.areas (map_version_id);
CREATE INDEX areas_parent_idx ON public.areas (map_version_id, parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX entities_category_idx ON public.entities (category_id);
CREATE INDEX entities_type_idx ON public.entities (entity_type);
CREATE INDEX entity_aliases_normalized_idx ON public.entity_aliases (normalized_alias);
CREATE INDEX markers_map_entity_idx ON public.markers (map_version_id, entity_id);
CREATE INDEX markers_map_area_idx ON public.markers (map_version_id, area_id) WHERE area_id IS NOT NULL;
CREATE INDEX markers_published_map_entity_idx ON public.markers (map_version_id, entity_id) WHERE is_published;
CREATE INDEX marker_candidates_map_crop_idx ON public.marker_import_candidates (map_version_id, within_local_crop);
CREATE UNIQUE INDEX marker_import_candidates_external_id_uq
  ON public.marker_import_candidates (map_version_id, source_id, source_external_id)
  WHERE source_external_id IS NOT NULL;
CREATE UNIQUE INDEX marker_import_candidates_fingerprint_uq
  ON public.marker_import_candidates (map_version_id, source_id, source_record_fingerprint)
  WHERE source_record_fingerprint IS NOT NULL;
CREATE INDEX entity_relations_from_idx ON public.entity_relations (from_entity_id, relation_type);
CREATE INDEX entity_relations_to_idx ON public.entity_relations (to_entity_id, relation_type);
CREATE INDEX record_sources_target_idx ON public.record_sources (record_type, record_id);
CREATE INDEX record_sources_external_id_idx ON public.record_sources (source_id, source_external_id) WHERE source_external_id IS NOT NULL;
CREATE INDEX reviews_target_idx ON public.reviews (record_type, record_id, reviewed_at DESC);
CREATE INDEX import_runs_source_started_idx ON public.import_runs (source_id, started_at DESC);

CREATE TRIGGER sources_set_updated_at BEFORE UPDATE ON public.sources
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER maps_set_updated_at BEFORE UPDATE ON public.maps
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER map_versions_set_updated_at BEFORE UPDATE ON public.map_versions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER areas_set_updated_at BEFORE UPDATE ON public.areas
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER item_catalog_set_updated_at BEFORE UPDATE ON public.item_catalog
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER entities_set_updated_at BEFORE UPDATE ON public.entities
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER markers_set_updated_at BEFORE UPDATE ON public.markers
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER marker_import_candidates_set_updated_at BEFORE UPDATE ON public.marker_import_candidates
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER entity_relations_set_updated_at BEFORE UPDATE ON public.entity_relations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.map_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entity_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.markers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marker_import_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entity_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.record_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_runs ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE
  public.sources,
  public.source_snapshots,
  public.assets,
  public.maps,
  public.map_versions,
  public.areas,
  public.categories,
  public.item_catalog,
  public.entities,
  public.entity_aliases,
  public.markers,
  public.marker_import_candidates,
  public.entity_relations,
  public.record_sources,
  public.reviews,
  public.import_runs
FROM PUBLIC;

DO $$
DECLARE
  client_role text;
BEGIN
  FOREACH client_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = client_role) THEN
      EXECUTE format(
        'REVOKE ALL PRIVILEGES ON TABLE public.sources, public.source_snapshots, public.assets, public.maps, public.map_versions, public.areas, public.categories, public.item_catalog, public.entities, public.entity_aliases, public.markers, public.marker_import_candidates, public.entity_relations, public.record_sources, public.reviews, public.import_runs FROM %I',
        client_role
      );
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL PRIVILEGES ON TABLES FROM %I', client_role);
    END IF;
  END LOOP;
END;
$$;

