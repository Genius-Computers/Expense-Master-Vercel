-- Add calculator result fields to customers table (PostgreSQL / Neon)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='customers' AND column_name='birthdate'
  ) THEN
    ALTER TABLE customers ADD COLUMN birthdate DATE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='customers' AND column_name='financing_amount'
  ) THEN
    ALTER TABLE customers ADD COLUMN financing_amount DECIMAL(12,2);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='customers' AND column_name='financing_type_name'
  ) THEN
    ALTER TABLE customers ADD COLUMN financing_type_name VARCHAR(255);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='customers' AND column_name='financing_duration_months'
  ) THEN
    ALTER TABLE customers ADD COLUMN financing_duration_months INTEGER;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='customers' AND column_name='best_bank_id'
  ) THEN
    ALTER TABLE customers ADD COLUMN best_bank_id INTEGER REFERENCES banks(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='customers' AND column_name='best_rate'
  ) THEN
    ALTER TABLE customers ADD COLUMN best_rate DECIMAL(6,3);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='customers' AND column_name='monthly_payment'
  ) THEN
    ALTER TABLE customers ADD COLUMN monthly_payment DECIMAL(12,2);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='customers' AND column_name='total_payment'
  ) THEN
    ALTER TABLE customers ADD COLUMN total_payment DECIMAL(12,2);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='customers' AND column_name='calculation_date'
  ) THEN
    ALTER TABLE customers ADD COLUMN calculation_date TIMESTAMP;
  END IF;
END $$;


