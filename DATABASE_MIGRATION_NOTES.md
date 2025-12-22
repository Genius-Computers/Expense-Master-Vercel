# Database Migration Notes

## Summary
After updating the admin panel to match the updated build structure, there are some database schema differences that need to be addressed. The API has been updated to handle both old and new column names using `COALESCE`, so the system will work with the current database, but you should run the migration when ready.

## Current Status
✅ **API is compatible** - The API endpoints now handle both old and new column names:
- `bank_id` OR `selected_bank_id` → uses `COALESCE(fr.selected_bank_id, fr.bank_id)`
- `amount` OR `requested_amount` → uses `COALESCE(fr.requested_amount, fr.amount)`
- `duration` OR `duration_months` → uses `COALESCE(fr.duration_months, fr.duration)`

## Required Database Changes

### 1. financing_requests table
The updated build expects these columns:
- `selected_bank_id` (instead of or in addition to `bank_id`)
- `requested_amount` (instead of or in addition to `amount`)
- `duration_months` (instead of or in addition to `duration`)

### 2. Migration Script
A migration script has been created at: `migrations/add_financing_request_fields.sql`

**To run the migration:**
```sql
-- Connect to your NeonDB database and run:
\i migrations/add_financing_request_fields.sql
```

Or manually run the SQL commands from that file.

## What's Already Working
- ✅ API endpoints return data in the expected format: `{ success: true, data: [...] }`
- ✅ URL routing works for all admin pages
- ✅ Frontend matches the updated build structure
- ✅ API handles both old and new column names (backward compatible)

## When to Run Migration
Since you mentioned the database doesn't contain valuable data yet, you can:
1. **Option A**: Run the migration now to match the build exactly
2. **Option B**: Keep using the current schema - the API will handle the mapping

The system will work either way, but running the migration will make the code cleaner and match the expected structure exactly.

