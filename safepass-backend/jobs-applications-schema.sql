-- Jobs and Applications Database Schema Extension for SafePass
-- This extends the existing database with job posting and application functionality

-- Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT[] NOT NULL DEFAULT '{}',
    salary_min DECIMAL(10,2) NOT NULL,
    salary_max DECIMAL(10,2) NOT NULL,
    salary_currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    location_country VARCHAR(100) NOT NULL,
    location_city VARCHAR(100) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    agency_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_type VARCHAR(50) NOT NULL CHECK (job_type IN ('Full-time', 'Part-time', 'Contract')),
    category VARCHAR(100) NOT NULL,
    posted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Closed', 'Draft')),
    benefits TEXT[] DEFAULT '{}',
    working_hours VARCHAR(100),
    accommodation_provided BOOLEAN DEFAULT false,
    transportation_provided BOOLEAN DEFAULT false,
    visa_sponsorship BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create job_applications table
CREATE TABLE IF NOT EXISTS job_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Reviewed', 'Accepted', 'Rejected')),
    cover_letter TEXT,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewer_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure a worker can only apply once per job
    UNIQUE(job_id, worker_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_jobs_agency_id ON jobs(agency_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs(category);
CREATE INDEX IF NOT EXISTS idx_jobs_location_country ON jobs(location_country);
CREATE INDEX IF NOT EXISTS idx_jobs_posted_at ON jobs(posted_at);
CREATE INDEX IF NOT EXISTS idx_jobs_expires_at ON jobs(expires_at);

CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_worker_id ON job_applications(worker_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);
CREATE INDEX IF NOT EXISTS idx_job_applications_applied_at ON job_applications(applied_at);

-- Enable Row Level Security (RLS)
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for jobs table
-- Anyone can view active jobs (public job board)
CREATE POLICY "Public can view active jobs" ON jobs
    FOR SELECT USING (status = 'Active' AND expires_at > NOW());

-- Agency admins can view all their jobs
CREATE POLICY "Agencies can view own jobs" ON jobs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = jobs.agency_id
            AND users.id::text = auth.uid()::text
            AND users.role = 'AgencyAdmin'
        )
    );

-- Agency admins can create jobs
CREATE POLICY "Agencies can create jobs" ON jobs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = jobs.agency_id
            AND users.id::text = auth.uid()::text
            AND users.role = 'AgencyAdmin'
        )
    );

-- Agency admins can update their own jobs
CREATE POLICY "Agencies can update own jobs" ON jobs
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = jobs.agency_id
            AND users.id::text = auth.uid()::text
            AND users.role = 'AgencyAdmin'
        )
    );

-- Agency admins can delete their own jobs
CREATE POLICY "Agencies can delete own jobs" ON jobs
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = jobs.agency_id
            AND users.id::text = auth.uid()::text
            AND users.role = 'AgencyAdmin'
        )
    );

-- Regulators can view all jobs
CREATE POLICY "Regulators can view all jobs" ON jobs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::text = auth.uid()::text
            AND users.role = 'Regulator'
        )
    );

-- RLS Policies for job_applications table
-- Workers can view their own applications
CREATE POLICY "Workers can view own applications" ON job_applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = job_applications.worker_id
            AND users.id::text = auth.uid()::text
            AND users.role = 'Worker'
        )
    );

-- Workers can create applications
CREATE POLICY "Workers can create applications" ON job_applications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = job_applications.worker_id
            AND users.id::text = auth.uid()::text
            AND users.role = 'Worker'
        )
    );

-- Agency admins can view applications for their jobs
CREATE POLICY "Agencies can view applications for own jobs" ON job_applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM jobs 
            JOIN users ON users.id = jobs.agency_id
            WHERE jobs.id = job_applications.job_id
            AND users.id::text = auth.uid()::text
            AND users.role = 'AgencyAdmin'
        )
    );

-- Agency admins can update application status for their jobs
CREATE POLICY "Agencies can update applications for own jobs" ON job_applications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM jobs 
            JOIN users ON users.id = jobs.agency_id
            WHERE jobs.id = job_applications.job_id
            AND users.id::text = auth.uid()::text
            AND users.role = 'AgencyAdmin'
        )
    );

-- Regulators can view all applications
CREATE POLICY "Regulators can view all applications" ON job_applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::text = auth.uid()::text
            AND users.role = 'Regulator'
        )
    );

-- Grant necessary permissions
GRANT SELECT ON jobs TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON jobs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON job_applications TO authenticated;

-- Create updated_at triggers
CREATE TRIGGER update_jobs_updated_at 
    BEFORE UPDATE ON jobs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_applications_updated_at 
    BEFORE UPDATE ON job_applications 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create views for easier querying
CREATE OR REPLACE VIEW jobs_with_agency_info AS
SELECT 
    j.*,
    u.name as agency_name,
    u.email as agency_email
FROM jobs j
JOIN users u ON j.agency_id = u.id;

CREATE OR REPLACE VIEW applications_with_details AS
SELECT 
    ja.*,
    j.title as job_title,
    j.company_name,
    j.location_country,
    j.location_city,
    j.salary_min,
    j.salary_max,
    j.salary_currency,
    w.name as worker_name,
    w.email as worker_email,
    w.did as worker_did
FROM job_applications ja
JOIN jobs j ON ja.job_id = j.id
JOIN users w ON ja.worker_id = w.id;

-- Grant access to views
GRANT SELECT ON jobs_with_agency_info TO authenticated, anon;
GRANT SELECT ON applications_with_details TO authenticated;
