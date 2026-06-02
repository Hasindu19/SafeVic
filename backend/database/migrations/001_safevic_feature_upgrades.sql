-- SafeVic feature upgrade migration.
-- This script is additive and may be run more than once.

BEGIN;

ALTER TABLE reports
ADD COLUMN IF NOT EXISTS severity VARCHAR(20) DEFAULT 'medium';

ALTER TABLE reports
ADD COLUMN IF NOT EXISTS image_url TEXT;

CREATE TABLE IF NOT EXISTS user_alert_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    radius_km INTEGER DEFAULT 5,
    alerts_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS push_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    platform VARCHAR(50) DEFAULT 'android',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS report_status_history (
    id SERIAL PRIMARY KEY,
    report_id INTEGER REFERENCES reports(id) ON DELETE CASCADE,
    old_status VARCHAR(30),
    new_status VARCHAR(30) NOT NULL,
    changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

UPDATE reports SET severity = 'medium' WHERE severity IS NULL;
UPDATE reports SET status = 'pending' WHERE status IS NULL;

CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_severity ON reports(severity);
CREATE INDEX IF NOT EXISTS idx_reports_suburb ON reports(suburb);
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_status_history_report_id ON report_status_history(report_id);

-- Required by PUT /api/alert-preferences/me ON CONFLICT (user_id).
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_alert_preferences_user_id_unique
ON user_alert_preferences(user_id);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'reports_severity_check'
          AND conrelid = 'reports'::regclass
    ) THEN
        ALTER TABLE reports
        ADD CONSTRAINT reports_severity_check
        CHECK (severity IN ('low', 'medium', 'high', 'critical')) NOT VALID;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'reports_status_check'
          AND conrelid = 'reports'::regclass
    ) THEN
        ALTER TABLE reports
        ADD CONSTRAINT reports_status_check
        CHECK (status IN ('pending', 'under_review', 'resolved')) NOT VALID;
    END IF;
END $$;

COMMIT;
