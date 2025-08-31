-- Simple SQL script to seed job data
-- Run this directly in your Supabase SQL editor or database client

-- First, get an agency admin user ID (replace with actual agency admin ID)
-- You can find this by running: SELECT id, name, email FROM users WHERE role = 'AgencyAdmin' LIMIT 1;

-- Insert dummy jobs (replace 'YOUR_AGENCY_ID_HERE' with the actual agency admin user ID)
INSERT INTO jobs (
  title, description, requirements, salary_min, salary_max, salary_currency,
  location_country, location_city, company_name, agency_id, job_type, category,
  expires_at, status, benefits, working_hours, accommodation_provided,
  transportation_provided, visa_sponsorship
) VALUES 
(
  'Construction Worker - Dubai',
  'We are seeking experienced construction workers for a major infrastructure project in Dubai. The role involves general construction work, concrete pouring, and site maintenance.',
  ARRAY['2+ years construction experience', 'Physical fitness', 'Basic English communication', 'Valid passport'],
  1200, 1800, 'USD',
  'UAE', 'Dubai', 'Gulf Construction Ltd',
  (SELECT id FROM users WHERE role = 'AgencyAdmin' LIMIT 1),
  'Full-time', 'Construction',
  NOW() + INTERVAL '30 days', 'Active',
  ARRAY['Accommodation provided', 'Medical insurance', 'Annual leave'],
  '8 hours/day, 6 days/week', true, true, true
),
(
  'Hotel Housekeeping Staff - Qatar',
  'Join our luxury hotel team as a housekeeping staff member. Responsibilities include room cleaning, laundry management, and maintaining hotel standards.',
  ARRAY['Hotel experience preferred', 'Attention to detail', 'English communication', 'Team player'],
  800, 1200, 'USD',
  'Qatar', 'Doha', 'Luxury Hotels Qatar',
  (SELECT id FROM users WHERE role = 'AgencyAdmin' LIMIT 1),
  'Full-time', 'Hospitality',
  NOW() + INTERVAL '45 days', 'Active',
  ARRAY['Free meals', 'Accommodation', 'Health insurance'],
  '8 hours/day, 5 days/week', true, false, true
),
(
  'Factory Worker - Saudi Arabia',
  'Manufacturing facility seeks dedicated factory workers for production line operations. Training will be provided for the right candidates.',
  ARRAY['No experience required', 'Willingness to learn', 'Physical stamina', 'Valid medical certificate'],
  1000, 1400, 'USD',
  'Saudi Arabia', 'Riyadh', 'Saudi Manufacturing Co',
  (SELECT id FROM users WHERE role = 'AgencyAdmin' LIMIT 1),
  'Full-time', 'Manufacturing',
  NOW() + INTERVAL '60 days', 'Active',
  ARRAY['Housing allowance', 'Transportation', 'Annual bonus'],
  '12 hours/day, 4 days/week', false, true, true
),
(
  'Restaurant Server - Kuwait',
  'High-end restaurant looking for experienced servers to provide excellent customer service to our international clientele.',
  ARRAY['Restaurant experience', 'Excellent English', 'Customer service skills', 'Professional appearance'],
  900, 1300, 'USD',
  'Kuwait', 'Kuwait City', 'Fine Dining Kuwait',
  (SELECT id FROM users WHERE role = 'AgencyAdmin' LIMIT 1),
  'Full-time', 'Food Service',
  NOW() + INTERVAL '25 days', 'Active',
  ARRAY['Tips included', 'Staff meals', 'Medical coverage'],
  '10 hours/day, 6 days/week', false, false, true
),
(
  'Security Guard - Bahrain',
  'Security company seeks reliable guards for commercial and residential properties. Must be alert and responsible.',
  ARRAY['Security experience preferred', 'Clean background check', 'Physical fitness', 'Basic English'],
  700, 1000, 'USD',
  'Bahrain', 'Manama', 'Bahrain Security Services',
  (SELECT id FROM users WHERE role = 'AgencyAdmin' LIMIT 1),
  'Full-time', 'Security',
  NOW() + INTERVAL '40 days', 'Active',
  ARRAY['Uniform provided', 'Health insurance', 'Overtime pay'],
  '12 hours/day, 3 days/week', true, true, true
),
(
  'Domestic Helper - Oman',
  'Family seeks a reliable domestic helper for household management, cooking, and childcare assistance.',
  ARRAY['Childcare experience', 'Cooking skills', 'Trustworthy', 'Live-in position'],
  600, 900, 'USD',
  'Oman', 'Muscat', 'Private Family',
  (SELECT id FROM users WHERE role = 'AgencyAdmin' LIMIT 1),
  'Full-time', 'Domestic Work',
  NOW() + INTERVAL '20 days', 'Active',
  ARRAY['Room and board', 'Annual leave', 'End of service bonus'],
  'Live-in with scheduled breaks', true, false, true
);

-- Verify the jobs were inserted
SELECT 
  title, 
  location_city, 
  location_country, 
  salary_min, 
  salary_max, 
  salary_currency,
  status,
  expires_at
FROM jobs 
ORDER BY created_at DESC;
