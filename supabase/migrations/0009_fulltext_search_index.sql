-- Full-text search index for mkt_listings
-- Enables efficient text search on title and description

ALTER TABLE mkt_listings
  ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('spanish', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('spanish', coalesce(description, '')), 'B')
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_mkt_listings_fts ON mkt_listings USING GIN (fts);
