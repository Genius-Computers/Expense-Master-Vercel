-- Quick SQL to add financing types
-- Run this in NeonDB SQL Editor

-- Make sure tenant_id = 1 exists first
INSERT INTO tenants (id, name, is_active) 
VALUES (1, 'شركة التمويل الأولى', TRUE) 
ON CONFLICT (id) DO NOTHING;

-- Add financing types
INSERT INTO financing_types (tenant_id, name, is_active) VALUES 
(1, 'تمويل شخصي', TRUE),
(1, 'تمويل عقاري', TRUE),
(1, 'تمويل سيارات', TRUE)
ON CONFLICT DO NOTHING;

-- Verify they were added
SELECT id, name, is_active FROM financing_types WHERE tenant_id = 1;

