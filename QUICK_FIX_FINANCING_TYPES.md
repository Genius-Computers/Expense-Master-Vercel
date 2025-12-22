# Quick Fix: Add Financing Types

The calculator needs financing types in the database. Here are **two ways** to add them:

## Option 1: Quick SQL (Recommended)

Run this in your **NeonDB SQL Editor**:

```sql
-- Make sure tenant exists
INSERT INTO tenants (id, name, is_active) 
VALUES (1, 'شركة التمويل الأولى', TRUE) 
ON CONFLICT (id) DO NOTHING;

-- Add financing types
INSERT INTO financing_types (tenant_id, name, is_active) VALUES 
(1, 'تمويل شخصي', TRUE),
(1, 'تمويل عقاري', TRUE),
(1, 'تمويل سيارات', TRUE)
ON CONFLICT DO NOTHING;
```

## Option 2: Through Admin Panel (After adding POST endpoint)

1. Log in to admin panel: `/admin/dashboard`
2. Go to "نسب التمويل" (Rates) section
3. Click "إضافة نسبة جديدة"
4. The financing types dropdown should populate (if types exist)

**Note**: The POST endpoint for adding financing types has been added to `/api/financing-types`, but you'll need to add a UI button in the admin panel to use it, or use the SQL method above.

## Verify

After running the SQL, check if it worked:

```sql
SELECT id, name, is_active FROM financing_types WHERE tenant_id = 1;
```

You should see 3 rows:
- تمويل شخصي
- تمويل عقاري  
- تمويل سيارات

Then refresh the calculator page - the dropdown should be populated!

