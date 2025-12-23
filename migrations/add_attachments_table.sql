-- Attachments storage in NeonDB (PostgreSQL)
-- Stores uploaded files as BYTEA in DB and links them to financing requests.

CREATE TABLE IF NOT EXISTS attachments (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  request_id INTEGER NOT NULL REFERENCES financing_requests(id) ON DELETE CASCADE,
  attachment_type VARCHAR(50) NOT NULL,
  filename TEXT NOT NULL,
  content_type TEXT,
  data BYTEA NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_attachments_request
  ON attachments(request_id, created_at);

-- Add URL columns to financing_requests (if missing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='financing_requests' AND column_name='id_attachment_url'
  ) THEN
    ALTER TABLE financing_requests ADD COLUMN id_attachment_url TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='financing_requests' AND column_name='bank_statement_attachment_url'
  ) THEN
    ALTER TABLE financing_requests ADD COLUMN bank_statement_attachment_url TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='financing_requests' AND column_name='salary_attachment_url'
  ) THEN
    ALTER TABLE financing_requests ADD COLUMN salary_attachment_url TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='financing_requests' AND column_name='additional_attachment_url'
  ) THEN
    ALTER TABLE financing_requests ADD COLUMN additional_attachment_url TEXT;
  END IF;
END $$;


