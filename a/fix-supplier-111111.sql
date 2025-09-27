-- Fix missing supplier record for user 111111
-- Run this SQL directly in your database interface

-- First, check if user 111111 exists in users table
SELECT user_id, role, name, email, mobile, created_at 
FROM users 
WHERE user_id = '111111';

-- Check if supplier record already exists
SELECT user_id, company_name, created_at 
FROM suppliers 
WHERE user_id = '111111';

-- Create the missing supplier record
INSERT INTO suppliers (
    user_id, 
    company_name, 
    contact_person,
    number_of_vehicles,
    is_verified,
    is_active,
    created_at,
    updated_at
) VALUES (
    '111111',
    'Default Company',
    'Default Contact',
    0,
    false,
    true,
    NOW(),
    NOW()
);

-- Verify the record was created
SELECT user_id, company_name, contact_person, number_of_vehicles, is_active, created_at 
FROM suppliers 
WHERE user_id = '111111';


