import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { authenticateToken, requireRole } from '../middleware/auth';
import { cache, cacheKeys, cacheInvalidation, CACHE_TTL } from '../middleware/cache';

const router = Router();

// GET /api/jobs - Get all active jobs (public endpoint with optional filters)
router.get('/jobs', 
  cache({
    ttl: CACHE_TTL.DOCUMENT_LIST,
    keyGenerator: cacheKeys.jobsList
  }),
  async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, country, category } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = supabase
      .from('jobs')
      .select('*')
      .eq('status', 'Active')
      .gt('expires_at', new Date().toISOString())
      .order('posted_at', { ascending: false });

    // Apply filters if provided
    if (country) {
      query = query.eq('location_country', country);
    }
    if (category) {
      query = query.eq('category', category);
    }

    // Apply pagination
    query = query.range(offset, offset + Number(limit) - 1);

    const { data: jobs, error, count } = await query;

    if (error) {
      console.error('Database query error:', error);
      return res.status(500).json({ error: 'Failed to fetch jobs' });
    }

    // If no jobs found, return empty array with 200 status
    if (!jobs || jobs.length === 0) {
      return res.status(200).json({
        message: 'No jobs found',
        data: [],
        total: 0,
        page: Number(page),
        limit: Number(limit)
      });
    }

    // Transform the data to match frontend expectations
    const transformedJobs = jobs?.map(job => ({
      id: job.id,
      title: job.title,
      description: job.description,
      requirements: job.requirements || [],
      salary: {
        min: Number(job.salary_min),
        max: Number(job.salary_max),
        currency: job.salary_currency
      },
      location: {
        country: job.location_country,
        city: job.location_city
      },
      companyName: job.company_name,
      agencyId: job.agency_id,
      jobType: job.job_type,
      category: job.category,
      postedAt: job.posted_at,
      expiresAt: job.expires_at,
      status: job.status,
      benefits: job.benefits || [],
      workingHours: job.working_hours,
      accommodationProvided: job.accommodation_provided,
      transportationProvided: job.transportation_provided,
      visaSponsorship: job.visa_sponsorship
    })) || [];

    res.status(200).json({
      message: 'Jobs retrieved successfully',
      data: transformedJobs,
      total: count || 0,
      page: Number(page),
      limit: Number(limit)
    });

  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/jobs/:id - Get job by ID (public endpoint)
router.get('/jobs/:id', 
  cache({
    ttl: CACHE_TTL.LOOKUP_DATA,
    keyGenerator: (req: Request) => `job:${req.params.id}`
  }),
  async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data: job, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Transform the data to match frontend expectations
    const transformedJob = {
      id: job.id,
      title: job.title,
      description: job.description,
      requirements: job.requirements || [],
      salary: {
        min: Number(job.salary_min),
        max: Number(job.salary_max),
        currency: job.salary_currency
      },
      location: {
        country: job.location_country,
        city: job.location_city
      },
      companyName: job.company_name,
      agencyId: job.agency_id,
      jobType: job.job_type,
      category: job.category,
      postedAt: job.posted_at,
      expiresAt: job.expires_at,
      status: job.status,
      benefits: job.benefits || [],
      workingHours: job.working_hours,
      accommodationProvided: job.accommodation_provided,
      transportationProvided: job.transportation_provided,
      visaSponsorship: job.visa_sponsorship
    };

    res.status(200).json({
      message: 'Job retrieved successfully',
      data: transformedJob
    });

  } catch (error) {
    console.error('Get job by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/agency/jobs - Get agency's own jobs (Agency Admin only)
router.get('/agency/jobs', 
  authenticateToken, 
  requireRole(['AgencyAdmin']),
  cache({
    ttl: CACHE_TTL.DOCUMENT_LIST,
    keyGenerator: (req: Request) => `agency:jobs:${req.user?.id}`
  }),
  async (req: Request, res: Response) => {
  try {
    const currentUser = req.user!;

    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('agency_id', currentUser.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database query error:', error);
      return res.status(500).json({ error: 'Failed to fetch agency jobs' });
    }

    // Transform the data to match frontend expectations
    const transformedJobs = jobs?.map(job => ({
      id: job.id,
      title: job.title,
      description: job.description,
      requirements: job.requirements || [],
      salary: {
        min: Number(job.salary_min),
        max: Number(job.salary_max),
        currency: job.salary_currency
      },
      location: {
        country: job.location_country,
        city: job.location_city
      },
      companyName: job.company_name,
      agencyId: job.agency_id,
      jobType: job.job_type,
      category: job.category,
      postedAt: job.posted_at,
      expiresAt: job.expires_at,
      status: job.status,
      benefits: job.benefits || [],
      workingHours: job.working_hours,
      accommodationProvided: job.accommodation_provided,
      transportationProvided: job.transportation_provided,
      visaSponsorship: job.visa_sponsorship
    })) || [];

    res.status(200).json({
      message: 'Agency jobs retrieved successfully',
      data: transformedJobs,
      total: transformedJobs.length
    });

  } catch (error) {
    console.error('Get agency jobs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/agency/jobs - Create new job (Agency Admin only)
router.post('/agency/jobs', authenticateToken, requireRole(['AgencyAdmin']), async (req: Request, res: Response) => {
  try {
    const currentUser = req.user!;
    const {
      title,
      description,
      requirements,
      salary,
      location,
      jobType,
      category,
      expiresAt,
      benefits,
      workingHours,
      accommodationProvided,
      transportationProvided,
      visaSponsorship
    } = req.body;

    // Validation
    if (!title || !description || !salary || !location || !jobType || !category || !expiresAt) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const jobData = {
      title,
      description,
      requirements: requirements || [],
      salary_min: salary.min,
      salary_max: salary.max,
      salary_currency: salary.currency || 'USD',
      location_country: location.country,
      location_city: location.city,
      company_name: currentUser.name, // Use agency name as company name
      agency_id: currentUser.id,
      job_type: jobType,
      category,
      expires_at: expiresAt,
      benefits: benefits || [],
      working_hours: workingHours,
      accommodation_provided: accommodationProvided || false,
      transportation_provided: transportationProvided || false,
      visa_sponsorship: visaSponsorship || false
    };

    const { data: job, error } = await supabase
      .from('jobs')
      .insert([jobData])
      .select()
      .single();

    if (error) {
      console.error('Database insert error:', error);
      return res.status(500).json({ error: 'Failed to create job' });
    }

    // Invalidate job caches after creation
    cacheInvalidation.invalidateJobs();

    // Transform the response
    const transformedJob = {
      id: job.id,
      title: job.title,
      description: job.description,
      requirements: job.requirements || [],
      salary: {
        min: Number(job.salary_min),
        max: Number(job.salary_max),
        currency: job.salary_currency
      },
      location: {
        country: job.location_country,
        city: job.location_city
      },
      companyName: job.company_name,
      agencyId: job.agency_id,
      jobType: job.job_type,
      category: job.category,
      postedAt: job.posted_at,
      expiresAt: job.expires_at,
      status: job.status,
      benefits: job.benefits || [],
      workingHours: job.working_hours,
      accommodationProvided: job.accommodation_provided,
      transportationProvided: job.transportation_provided,
      visaSponsorship: job.visa_sponsorship
    };

    res.status(201).json({
      message: 'Job created successfully',
      data: transformedJob
    });

  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/agency/jobs/:id - Update job (Agency Admin only)
router.put('/agency/jobs/:id', authenticateToken, requireRole(['AgencyAdmin']), async (req: Request, res: Response) => {
  try {
    const currentUser = req.user!;
    const { id } = req.params;
    const updateData = req.body;

    // First check if the job belongs to the current agency
    const { data: existingJob, error: fetchError } = await supabase
      .from('jobs')
      .select('agency_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingJob) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (existingJob.agency_id !== currentUser.id) {
      return res.status(403).json({ error: 'Access denied. You can only update your own jobs.' });
    }

    // Transform update data to match database schema
    const dbUpdateData: any = {};
    if (updateData.title) dbUpdateData.title = updateData.title;
    if (updateData.description) dbUpdateData.description = updateData.description;
    if (updateData.requirements) dbUpdateData.requirements = updateData.requirements;
    if (updateData.salary) {
      if (updateData.salary.min) dbUpdateData.salary_min = updateData.salary.min;
      if (updateData.salary.max) dbUpdateData.salary_max = updateData.salary.max;
      if (updateData.salary.currency) dbUpdateData.salary_currency = updateData.salary.currency;
    }
    if (updateData.location) {
      if (updateData.location.country) dbUpdateData.location_country = updateData.location.country;
      if (updateData.location.city) dbUpdateData.location_city = updateData.location.city;
    }
    if (updateData.jobType) dbUpdateData.job_type = updateData.jobType;
    if (updateData.category) dbUpdateData.category = updateData.category;
    if (updateData.expiresAt) dbUpdateData.expires_at = updateData.expiresAt;
    if (updateData.status) dbUpdateData.status = updateData.status;
    if (updateData.benefits) dbUpdateData.benefits = updateData.benefits;
    if (updateData.workingHours) dbUpdateData.working_hours = updateData.workingHours;
    if (updateData.accommodationProvided !== undefined) dbUpdateData.accommodation_provided = updateData.accommodationProvided;
    if (updateData.transportationProvided !== undefined) dbUpdateData.transportation_provided = updateData.transportationProvided;
    if (updateData.visaSponsorship !== undefined) dbUpdateData.visa_sponsorship = updateData.visaSponsorship;

    const { data: job, error } = await supabase
      .from('jobs')
      .update(dbUpdateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Database update error:', error);
      return res.status(500).json({ error: 'Failed to update job' });
    }

    // Invalidate job caches after update
    cacheInvalidation.invalidateJobs();

    // Transform the response
    const transformedJob = {
      id: job.id,
      title: job.title,
      description: job.description,
      requirements: job.requirements || [],
      salary: {
        min: Number(job.salary_min),
        max: Number(job.salary_max),
        currency: job.salary_currency
      },
      location: {
        country: job.location_country,
        city: job.location_city
      },
      companyName: job.company_name,
      agencyId: job.agency_id,
      jobType: job.job_type,
      category: job.category,
      postedAt: job.posted_at,
      expiresAt: job.expires_at,
      status: job.status,
      benefits: job.benefits || [],
      workingHours: job.working_hours,
      accommodationProvided: job.accommodation_provided,
      transportationProvided: job.transportation_provided,
      visaSponsorship: job.visa_sponsorship
    };

    res.status(200).json({
      message: 'Job updated successfully',
      data: transformedJob
    });

  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/agency/jobs/:id - Delete job (Agency Admin only)
router.delete('/agency/jobs/:id', authenticateToken, requireRole(['AgencyAdmin']), async (req: Request, res: Response) => {
  try {
    const currentUser = req.user!;
    const { id } = req.params;

    // First check if the job belongs to the current agency
    const { data: existingJob, error: fetchError } = await supabase
      .from('jobs')
      .select('agency_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingJob) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (existingJob.agency_id !== currentUser.id) {
      return res.status(403).json({ error: 'Access denied. You can only delete your own jobs.' });
    }

    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Database delete error:', error);
      return res.status(500).json({ error: 'Failed to delete job' });
    }

    // Invalidate job caches after deletion
    cacheInvalidation.invalidateJobs();

    res.status(200).json({
      message: 'Job deleted successfully'
    });

  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
