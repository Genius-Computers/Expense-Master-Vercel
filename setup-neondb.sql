-- ============================================
-- Complete NeonDB Database Setup
-- Run this entire script in NeonDB SQL Editor
-- ============================================

-- 1. Create Tenants table
CREATE TABLE IF NOT EXISTS tenants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    role VARCHAR(20) DEFAULT 'employee' CHECK (role IN ('superadmin', 'admin', 'employee')),
    role_id INTEGER DEFAULT 3, -- 1=superadmin, 3=employee, 4=company admin, 5=supervisor
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create Banks table
CREATE TABLE IF NOT EXISTS banks (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    bank_code VARCHAR(50),
    logo_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create Financing Types table
CREATE TABLE IF NOT EXISTS financing_types (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create Rates table
CREATE TABLE IF NOT EXISTS rates (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    bank_id INTEGER NOT NULL REFERENCES banks(id) ON DELETE CASCADE,
    financing_type_id INTEGER NOT NULL REFERENCES financing_types(id) ON DELETE CASCADE,
    rate DECIMAL(5,2) NOT NULL,
    min_amount DECIMAL(12,2) DEFAULT 0,
    max_amount DECIMAL(12,2) DEFAULT 0,
    min_salary DECIMAL(12,2) DEFAULT 0,
    max_salary DECIMAL(12,2) DEFAULT 0,
    min_duration INTEGER DEFAULT 0,
    max_duration INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Create Customers table
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    national_id VARCHAR(50),
    birthdate DATE,
    employment_type VARCHAR(100),
    employer_name VARCHAR(255),
    job_title VARCHAR(255),
    work_start_date DATE,
    city VARCHAR(100),
    monthly_salary DECIMAL(12,2),
    monthly_obligations DECIMAL(12,2),
    financing_amount DECIMAL(12,2),
    financing_type_name VARCHAR(255),
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Create Financing Requests table (with updated build fields)
CREATE TABLE IF NOT EXISTS financing_requests (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    bank_id INTEGER REFERENCES banks(id) ON DELETE SET NULL,
    selected_bank_id INTEGER REFERENCES banks(id) ON DELETE SET NULL,
    financing_type_id INTEGER REFERENCES financing_types(id) ON DELETE SET NULL,
    amount DECIMAL(12,2),
    requested_amount DECIMAL(12,2) NOT NULL,
    duration INTEGER,
    duration_months INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'completed')),
    monthly_payment DECIMAL(12,2),
    monthly_obligations DECIMAL(12,2),
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Create Payments table
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(100),
    receipt_number VARCHAR(100),
    notes TEXT,
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INSERT SAMPLE DATA
-- ============================================

-- Insert default tenant
INSERT INTO tenants (id, name, is_active) 
VALUES (1, 'شركة التمويل الأولى', TRUE) 
ON CONFLICT (id) DO NOTHING;

-- Insert default users
INSERT INTO users (tenant_id, username, password, full_name, role, role_id, email) VALUES 
(1, 'superadmin', 'SuperAdmin@2025', 'المدير العام', 'superadmin', 1, 'superadmin@tamweel.sa'),
(1, 'admin', 'Admin@2025', 'مدير النظام', 'admin', 4, 'admin@tamweel.sa'),
(1, 'employee1', 'Employee1@2025', 'موظف 1', 'employee', 3, 'employee1@tamweel.sa')
ON CONFLICT (username) DO NOTHING;

-- Insert sample banks
INSERT INTO banks (tenant_id, name, bank_code, is_active) VALUES 
(1, 'بنك الراجحي', 'RJHI', TRUE),
(1, 'البنك الأهلي', 'NCB', TRUE),
(1, 'بنك الرياض', 'RIBL', TRUE),
(1, 'بنك ساب', 'SABB', TRUE)
ON CONFLICT DO NOTHING;

-- Insert financing types
INSERT INTO financing_types (tenant_id, name, is_active) VALUES 
(1, 'تمويل شخصي', TRUE),
(1, 'تمويل عقاري', TRUE),
(1, 'تمويل سيارات', TRUE)
ON CONFLICT DO NOTHING;

-- Insert sample rates
INSERT INTO rates (tenant_id, bank_id, financing_type_id, rate, min_amount, max_amount, min_salary, max_salary, min_duration, max_duration) VALUES 
(1, 1, 1, 5.50, 10000, 500000, 5000, 50000, 12, 60),
(1, 2, 1, 5.75, 10000, 500000, 5000, 50000, 12, 60),
(1, 1, 2, 4.50, 100000, 2000000, 10000, 100000, 60, 300),
(1, 3, 3, 6.00, 20000, 300000, 6000, 60000, 12, 84)
ON CONFLICT DO NOTHING;

-- ============================================
-- VERIFY SETUP
-- ============================================

-- Check tables were created
SELECT 'Tables created successfully!' as status;

-- Count records
SELECT 
    (SELECT COUNT(*) FROM tenants) as tenants_count,
    (SELECT COUNT(*) FROM users) as users_count,
    (SELECT COUNT(*) FROM banks) as banks_count,
    (SELECT COUNT(*) FROM financing_types) as financing_types_count,
    (SELECT COUNT(*) FROM rates) as rates_count;

