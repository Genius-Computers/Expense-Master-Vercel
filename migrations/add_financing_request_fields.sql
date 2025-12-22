-- Migration: Add fields to financing_requests table to match updated build
-- Run this when you're ready to update the database schema

-- Add selected_bank_id column (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'financing_requests' 
        AND column_name = 'selected_bank_id'
    ) THEN
        ALTER TABLE financing_requests 
        ADD COLUMN selected_bank_id INTEGER REFERENCES banks(id) ON DELETE SET NULL;
        
        -- Copy existing bank_id values to selected_bank_id
        UPDATE financing_requests 
        SET selected_bank_id = bank_id 
        WHERE bank_id IS NOT NULL AND selected_bank_id IS NULL;
    END IF;
END $$;

-- Add requested_amount column (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'financing_requests' 
        AND column_name = 'requested_amount'
    ) THEN
        ALTER TABLE financing_requests 
        ADD COLUMN requested_amount DECIMAL(12,2);
        
        -- Copy existing amount values to requested_amount
        UPDATE financing_requests 
        SET requested_amount = amount 
        WHERE requested_amount IS NULL;
    END IF;
END $$;

-- Add duration_months column (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'financing_requests' 
        AND column_name = 'duration_months'
    ) THEN
        ALTER TABLE financing_requests 
        ADD COLUMN duration_months INTEGER;
        
        -- Copy existing duration values to duration_months
        UPDATE financing_requests 
        SET duration_months = duration 
        WHERE duration_months IS NULL;
    END IF;
END $$;

-- Add customer_phone column to customers table (if needed by frontend)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' 
        AND column_name = 'birthdate'
    ) THEN
        ALTER TABLE customers 
        ADD COLUMN birthdate DATE;
    END IF;
END $$;

-- Add financing_type_name to the query result (handled via JOIN in API, but ensure financing_types table exists)
-- This is just for reference - the API handles the JOIN

