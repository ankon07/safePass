"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_1 = require("../config/supabase");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET /api/worker/applications - Get worker's own applications (Worker only)
router.get('/worker/applications', auth_1.authenticateToken, (0, auth_1.requireRole)(['Worker']), async (req, res) => {
    try {
        const currentUser = req.user;
        const { data: applications, error } = await supabase_1.supabase
            .from('applications_with_details')
            .select('*')
            .eq('worker_id', currentUser.id)
            .order('applied_at', { ascending: false });
        if (error) {
            console.error('Database query error:', error);
            return res.status(500).json({ error: 'Failed to fetch applications' });
        }
        // Transform the data to match frontend expectations
        const transformedApplications = applications?.map(app => ({
            id: app.id,
            jobId: app.job_id,
            workerId: app.worker_id,
            status: app.status,
            appliedAt: app.applied_at,
            reviewedAt: app.reviewed_at,
            reviewerNotes: app.reviewer_notes,
            job: {
                id: app.job_id,
                title: app.job_title,
                companyName: app.company_name,
                location: {
                    country: app.location_country,
                    city: app.location_city
                },
                salary: {
                    min: Number(app.salary_min),
                    max: Number(app.salary_max),
                    currency: app.salary_currency
                }
            }
        })) || [];
        res.status(200).json({
            message: 'Applications retrieved successfully',
            data: transformedApplications,
            total: transformedApplications.length
        });
    }
    catch (error) {
        console.error('Get worker applications error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /api/worker/applications - Apply for a job (Worker only)
router.post('/worker/applications', auth_1.authenticateToken, (0, auth_1.requireRole)(['Worker']), async (req, res) => {
    try {
        const currentUser = req.user;
        const { jobId, coverLetter } = req.body;
        // Validation
        if (!jobId) {
            return res.status(400).json({ error: 'Job ID is required' });
        }
        // Check if job exists and is active
        const { data: job, error: jobError } = await supabase_1.supabase
            .from('jobs')
            .select('id, title, status, expires_at, agency_id')
            .eq('id', jobId)
            .single();
        if (jobError || !job) {
            return res.status(404).json({ error: 'Job not found' });
        }
        if (job.status !== 'Active') {
            return res.status(400).json({ error: 'Job is not active' });
        }
        if (new Date(job.expires_at) < new Date()) {
            return res.status(400).json({ error: 'Job has expired' });
        }
        // Check if worker has already applied for this job
        const { data: existingApplication, error: checkError } = await supabase_1.supabase
            .from('job_applications')
            .select('id')
            .eq('job_id', jobId)
            .eq('worker_id', currentUser.id)
            .single();
        if (existingApplication) {
            return res.status(400).json({ error: 'You have already applied for this job' });
        }
        // Create the application
        const applicationData = {
            job_id: jobId,
            worker_id: currentUser.id,
            cover_letter: coverLetter || null,
            status: 'Pending'
        };
        const { data: application, error } = await supabase_1.supabase
            .from('job_applications')
            .insert([applicationData])
            .select()
            .single();
        if (error) {
            console.error('Database insert error:', error);
            return res.status(500).json({ error: 'Failed to create application' });
        }
        // Get the full application details with job info
        const { data: fullApplication, error: fetchError } = await supabase_1.supabase
            .from('applications_with_details')
            .select('*')
            .eq('id', application.id)
            .single();
        if (fetchError) {
            console.error('Failed to fetch full application details:', fetchError);
            // Return basic application data if we can't get full details
            const transformedApplication = {
                id: application.id,
                jobId: application.job_id,
                workerId: application.worker_id,
                status: application.status,
                appliedAt: application.applied_at,
                reviewedAt: application.reviewed_at,
                reviewerNotes: application.reviewer_notes
            };
            return res.status(201).json({
                message: 'Application submitted successfully',
                data: transformedApplication
            });
        }
        // Transform the response
        const transformedApplication = {
            id: fullApplication.id,
            jobId: fullApplication.job_id,
            workerId: fullApplication.worker_id,
            status: fullApplication.status,
            appliedAt: fullApplication.applied_at,
            reviewedAt: fullApplication.reviewed_at,
            reviewerNotes: fullApplication.reviewer_notes,
            job: {
                id: fullApplication.job_id,
                title: fullApplication.job_title,
                companyName: fullApplication.company_name,
                location: {
                    country: fullApplication.location_country,
                    city: fullApplication.location_city
                },
                salary: {
                    min: Number(fullApplication.salary_min),
                    max: Number(fullApplication.salary_max),
                    currency: fullApplication.salary_currency
                }
            }
        };
        res.status(201).json({
            message: 'Application submitted successfully',
            data: transformedApplication
        });
    }
    catch (error) {
        console.error('Create application error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /api/agency/jobs/:jobId/applications - Get applications for a specific job (Agency Admin only)
router.get('/agency/jobs/:jobId/applications', auth_1.authenticateToken, (0, auth_1.requireRole)(['AgencyAdmin']), async (req, res) => {
    try {
        const currentUser = req.user;
        const { jobId } = req.params;
        // First verify that the job belongs to the current agency
        const { data: job, error: jobError } = await supabase_1.supabase
            .from('jobs')
            .select('agency_id')
            .eq('id', jobId)
            .single();
        if (jobError || !job) {
            return res.status(404).json({ error: 'Job not found' });
        }
        if (job.agency_id !== currentUser.id) {
            return res.status(403).json({ error: 'Access denied. You can only view applications for your own jobs.' });
        }
        // Get applications for this job
        const { data: applications, error } = await supabase_1.supabase
            .from('applications_with_details')
            .select('*')
            .eq('job_id', jobId)
            .order('applied_at', { ascending: false });
        if (error) {
            console.error('Database query error:', error);
            return res.status(500).json({ error: 'Failed to fetch applications' });
        }
        // Transform the data to match frontend expectations
        const transformedApplications = applications?.map(app => ({
            id: app.id,
            jobId: app.job_id,
            workerId: app.worker_id,
            status: app.status,
            appliedAt: app.applied_at,
            reviewedAt: app.reviewed_at,
            reviewerNotes: app.reviewer_notes,
            worker: {
                id: app.worker_id,
                name: app.worker_name,
                email: app.worker_email,
                did: app.worker_did
            }
        })) || [];
        res.status(200).json({
            message: 'Job applications retrieved successfully',
            data: transformedApplications,
            total: transformedApplications.length
        });
    }
    catch (error) {
        console.error('Get job applications error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// PUT /api/agency/applications/:applicationId - Update application status (Agency Admin only)
router.put('/agency/applications/:applicationId', auth_1.authenticateToken, (0, auth_1.requireRole)(['AgencyAdmin']), async (req, res) => {
    try {
        const currentUser = req.user;
        const { applicationId } = req.params;
        const { status, reviewerNotes } = req.body;
        // Validation
        if (!status || !['Reviewed', 'Accepted', 'Rejected'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status. Must be Reviewed, Accepted, or Rejected' });
        }
        // First verify that the application belongs to a job owned by the current agency
        const { data: applicationJob, error: fetchError } = await supabase_1.supabase
            .from('job_applications')
            .select(`
        id,
        job_id,
        jobs!inner(agency_id)
      `)
            .eq('id', applicationId)
            .single();
        if (fetchError || !applicationJob) {
            return res.status(404).json({ error: 'Application not found' });
        }
        if (applicationJob.jobs.agency_id !== currentUser.id) {
            return res.status(403).json({ error: 'Access denied. You can only update applications for your own jobs.' });
        }
        // Update the application
        const updateData = {
            status,
            reviewer_notes: reviewerNotes || null,
            reviewed_at: new Date().toISOString()
        };
        const { data: application, error } = await supabase_1.supabase
            .from('job_applications')
            .update(updateData)
            .eq('id', applicationId)
            .select()
            .single();
        if (error) {
            console.error('Database update error:', error);
            return res.status(500).json({ error: 'Failed to update application' });
        }
        // Get the full application details
        const { data: fullApplication, error: detailsError } = await supabase_1.supabase
            .from('applications_with_details')
            .select('*')
            .eq('id', application.id)
            .single();
        if (detailsError) {
            console.error('Failed to fetch full application details:', detailsError);
            // Return basic application data if we can't get full details
            const transformedApplication = {
                id: application.id,
                jobId: application.job_id,
                workerId: application.worker_id,
                status: application.status,
                appliedAt: application.applied_at,
                reviewedAt: application.reviewed_at,
                reviewerNotes: application.reviewer_notes
            };
            return res.status(200).json({
                message: 'Application updated successfully',
                data: transformedApplication
            });
        }
        // Transform the response
        const transformedApplication = {
            id: fullApplication.id,
            jobId: fullApplication.job_id,
            workerId: fullApplication.worker_id,
            status: fullApplication.status,
            appliedAt: fullApplication.applied_at,
            reviewedAt: fullApplication.reviewed_at,
            reviewerNotes: fullApplication.reviewer_notes,
            worker: {
                id: fullApplication.worker_id,
                name: fullApplication.worker_name,
                email: fullApplication.worker_email,
                did: fullApplication.worker_did
            }
        };
        res.status(200).json({
            message: 'Application updated successfully',
            data: transformedApplication
        });
    }
    catch (error) {
        console.error('Update application error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /api/applications/:id - Get application by ID (Worker can view own, Agency can view for their jobs)
router.get('/applications/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const currentUser = req.user;
        const { id } = req.params;
        const { data: application, error } = await supabase_1.supabase
            .from('applications_with_details')
            .select('*')
            .eq('id', id)
            .single();
        if (error || !application) {
            return res.status(404).json({ error: 'Application not found' });
        }
        // Check permissions
        const isWorker = currentUser.role === 'Worker' && application.worker_id === currentUser.id;
        const isAgencyAdmin = currentUser.role === 'AgencyAdmin';
        const isRegulator = currentUser.role === 'Regulator';
        if (!isWorker && !isAgencyAdmin && !isRegulator) {
            return res.status(403).json({ error: 'Access denied' });
        }
        // If agency admin, verify they own the job
        if (isAgencyAdmin) {
            const { data: job, error: jobError } = await supabase_1.supabase
                .from('jobs')
                .select('agency_id')
                .eq('id', application.job_id)
                .single();
            if (jobError || !job || job.agency_id !== currentUser.id) {
                return res.status(403).json({ error: 'Access denied. You can only view applications for your own jobs.' });
            }
        }
        // Transform the response
        const transformedApplication = {
            id: application.id,
            jobId: application.job_id,
            workerId: application.worker_id,
            status: application.status,
            appliedAt: application.applied_at,
            reviewedAt: application.reviewed_at,
            reviewerNotes: application.reviewer_notes,
            job: {
                id: application.job_id,
                title: application.job_title,
                companyName: application.company_name,
                location: {
                    country: application.location_country,
                    city: application.location_city
                },
                salary: {
                    min: Number(application.salary_min),
                    max: Number(application.salary_max),
                    currency: application.salary_currency
                }
            },
            worker: {
                id: application.worker_id,
                name: application.worker_name,
                email: application.worker_email,
                did: application.worker_did
            }
        };
        res.status(200).json({
            message: 'Application retrieved successfully',
            data: transformedApplication
        });
    }
    catch (error) {
        console.error('Get application by ID error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
