# SafeVic Database Migrations

Database migrations update an existing SafeVic database without deleting current
users or incident reports.

## Run The Feature Upgrade Migration

From the project root:

```bash
psql -U postgres -d safevic_db -f backend/database/migrations/001_safevic_feature_upgrades.sql
```

The migration is idempotent and can be run again safely. It creates missing
tables, columns, indexes, and constraints, and fills null report status and
severity values with their defaults.

## Verify The Database

Open `psql` connected to `safevic_db`, then inspect the report table and table
list:

```sql
\d reports
\dt
```

Expected new columns:

- `reports.severity`
- `reports.image_url`

Expected new tables:

- `user_alert_preferences`
- `push_tokens`
- `report_status_history`

The check constraints accept the following values for newly inserted or
updated reports:

- `severity`: `low`, `medium`, `high`, `critical`
- `status`: `pending`, `under_review`, `resolved`
