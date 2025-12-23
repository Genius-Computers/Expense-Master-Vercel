-- PostgreSQL Schema for NeonDB
-- Run this in NeonDB SQL Editor

-- Create Tenants table
CREATE TABLE IF NOT EXISTS tenants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    role VARCHAR(20) DEFAULT 'employee' CHECK (role IN ('superadmin', 'admin', 'employee')),
    role_id INTEGER DEFAULT 3,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Banks table
CREATE TABLE IF NOT EXISTS banks (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Financing Types table
CREATE TABLE IF NOT EXISTS financing_types (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Rates table
CREATE TABLE IF NOT EXISTS rates (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    bank_id INTEGER NOT NULL REFERENCES banks(id) ON DELETE CASCADE,
    financing_type_id INTEGER NOT NULL REFERENCES financing_types(id) ON DELETE CASCADE,
    rate DECIMAL(5,2) NOT NULL,
    min_amount DECIMAL(12,2) DEFAULT 0,
    max_amount DECIMAL(12,2) DEFAULT 0,
    min_duration INTEGER DEFAULT 0,
    max_duration INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Customers table
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
    financing_duration_months INTEGER,
    best_bank_id INTEGER REFERENCES banks(id) ON DELETE SET NULL,
    best_rate DECIMAL(6,3),
    monthly_payment DECIMAL(12,2),
    total_payment DECIMAL(12,2),
    calculation_date TIMESTAMP,
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Financing Requests table
CREATE TABLE IF NOT EXISTS financing_requests (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    bank_id INTEGER REFERENCES banks(id) ON DELETE SET NULL,
    selected_bank_id INTEGER REFERENCES banks(id) ON DELETE SET NULL,
    financing_type_id INTEGER REFERENCES financing_types(id) ON DELETE SET NULL,
    amount DECIMAL(12,2),
    requested_amount DECIMAL(12,2),
    duration INTEGER,
    duration_months INTEGER,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'completed')),
    salary_at_request DECIMAL(12,2),
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    monthly_payment DECIMAL(12,2),
    id_attachment_url TEXT,
    bank_statement_attachment_url TEXT,
    salary_attachment_url TEXT,
    additional_attachment_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Financing Request Status History (Timeline)
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

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Payments table
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

-- Create Packages table
CREATE TABLE IF NOT EXISTS packages (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    package_name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(12,2) NOT NULL DEFAULT 0,
    duration_months INTEGER NOT NULL DEFAULT 1,
    max_calculations INTEGER,
    max_users INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    package_id INTEGER REFERENCES packages(id) ON DELETE SET NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO tenants (name, is_active) VALUES ('شركة التمويل الأولى', TRUE) ON CONFLICT DO NOTHING;

INSERT INTO users (tenant_id, username, password, full_name, role) VALUES 
(1, 'superadmin', 'SuperAdmin@2025', 'المدير العام', 'superadmin'),
(1, 'admin', 'Admin@2025', 'مدير النظام', 'admin'),
(1, 'admin1', 'Admin1@2025', 'موظف 1', 'employee')
ON CONFLICT (username) DO NOTHING;

INSERT INTO banks (tenant_id, name) VALUES 
(1, 'بنك الراجحي'),
(1, 'البنك الأهلي'),
(1, 'بنك الرياض'),
(1, 'بنك ساب')
ON CONFLICT DO NOTHING;

INSERT INTO financing_types (tenant_id, name) VALUES 
(1, 'تمويل شخصي'),
(1, 'تمويل عقاري'),
(1, 'تمويل سيارات')
ON CONFLICT DO NOTHING;

INSERT INTO rates (tenant_id, bank_id, financing_type_id, rate, min_amount, max_amount, min_duration, max_duration) VALUES 
(1, 1, 1, 5.50, 10000, 500000, 12, 60),
(1, 2, 1, 5.75, 10000, 500000, 12, 60),
(1, 1, 2, 4.50, 100000, 2000000, 60, 300),
(1, 3, 3, 6.00, 20000, 300000, 12, 84)
ON CONFLICT DO NOTHING;


