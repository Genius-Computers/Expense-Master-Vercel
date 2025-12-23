-- Create status history table for financing requests (PostgreSQL / Neon)
CREATE TABLE IF NOT EXISTS financing_request_status_history (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  request_id INTEGER NOT NULL REFERENCES financing_requests(id) ON DELETE CASCADE,
  old_status VARCHAR(20),
  new_status VARCHAR(20) NOT NULL,
  changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fr_status_history_request
  ON financing_request_status_history(request_id, created_at);


