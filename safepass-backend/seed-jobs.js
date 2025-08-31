const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Dummy job data
const dummyJobs = [
  {
    title: 'Construction Worker - Dubai',
    description: 'We are seeking experienced construction workers for a major infrastructure project in Dubai. The role involves general construction work, concrete pouring, and site maintenance.',
    requirements: ['2+ years construction experience', 'Physical fitness', 'Basic English communication', 'Valid passport'],
    salary_min: 1200,
    salary_max: 1800,
    salary_currency: 'USD',
    location_country: 'UAE',
    location_city: 'Dubai',
    company_name: 'Gulf Construction Ltd',
    job_type: 'Full-time',
    category: 'Construction',
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    status: 'Active',
    benefits: ['Accommodation provided', 'Medical insurance', 'Annual leave'],
    working_hours: '8 hours/day, 6 days/week',
    accommodation_provided: true,
    transportation_provided: true,
    visa_sponsorship: true
  },
  {
    title: 'Hotel Housekeeping Staff - Qatar',
    description: 'Join our luxury hotel team as a housekeeping staff member. Responsibilities include room cleaning, laundry management, and maintaining hotel standards.',
    requirements: ['Hotel experience preferred', 'Attention to detail', 'English communication', 'Team player'],
    salary_min: 800,
    salary_max: 1200,
    salary_currency: 'USD',
    location_country: 'Qatar',
    location_city: 'Doha',
    company_name: 'Luxury Hotels Qatar',
    job_type: 'Full-time',
    category: 'Hospitality',
    expires_at: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days from now
    status: 'Active',
    benefits: ['Free meals', 'Accommodation', 'Health insurance'],
    working_hours: '8 hours/day, 5 days/week',
    accommodation_provided: true,
    transportation_provided: false,
    visa_sponsorship: true
  },
  {
    title: 'Factory Worker - Saudi Arabia',
    description: 'Manufacturing facility seeks dedicated factory workers for production line operations. Training will be provided for the right candidates.',
    requirements: ['No experience required', 'Willingness to learn', 'Physical stamina', 'Valid medical certificate'],
    salary_min: 1000,
    salary_max: 1400,
    salary_currency: 'USD',
    location_country: 'Saudi Arabia',
    location_city: 'Riyadh',
    company_name: 'Saudi Manufacturing Co',
    job_type: 'Full-time',
    category: 'Manufacturing',
    expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days from now
    status: 'Active',
    benefits: ['Housing allowance', 'Transportation', 'Annual bonus'],
    working_hours: '12 hours/day, 4 days/week',
    accommodation_provided: false,
    transportation_provided: true,
    visa_sponsorship: true
  },
  {
    title: 'Restaurant Server - Kuwait',
    description: 'High-end restaurant looking for experienced servers to provide excellent customer service to our international clientele.',
    requirements: ['Restaurant experience', 'Excellent English', 'Customer service skills', 'Professional appearance'],
    salary_min: 900,
    salary_max: 1300,
    salary_currency: 'USD',
    location_country: 'Kuwait',
    location_city: 'Kuwait City',
    company_name: 'Fine Dining Kuwait',
    job_type: 'Full-time',
    category: 'Food Service',
    expires_at: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(), // 25 days from now
    status: 'Active',
    benefits: ['Tips included', 'Staff meals', 'Medical coverage'],
    working_hours: '10 hours/day, 6 days/week',
    accommodation_provided: false,
    transportation_provided: false,
    visa_sponsorship: true
  },
  {
    title: 'Security Guard - Bahrain',
    description: 'Security company seeks reliable guards for commercial and residential properties. Must be alert and responsible.',
    requirements: ['Security experience preferred', 'Clean background check', 'Physical fitness', 'Basic English'],
    salary_min: 700,
    salary_max: 1000,
    salary_currency: 'USD',
    location_country: 'Bahrain',
    location_city: 'Manama',
    company_name: 'Bahrain Security Services',
    job_type: 'Full-time',
    category: 'Security',
    expires_at: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString(), // 40 days from now
    status: 'Active',
    benefits: ['Uniform provided', 'Health insurance', 'Overtime pay'],
    working_hours: '12 hours/day, 3 days/week',
    accommodation_provided: true,
    transportation_provided: true,
    visa_sponsorship: true
  },
  {
    title: 'Domestic Helper - Oman',
    description: 'Family seeks a reliable domestic helper for household management, cooking, and childcare assistance.',
    requirements: ['Childcare experience', 'Cooking skills', 'Trustworthy', 'Live-in position'],
    salary_min: 600,
    salary_max: 900,
    salary_currency: 'USD',
    location_country: 'Oman',
    location_city: 'Muscat',
    company_name: 'Private Family',
    job_type: 'Full-time',
    category: 'Domestic Work',
    expires_at: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days from now
    status: 'Active',
    benefits: ['Room and board', 'Annual leave', 'End of service bonus'],
    working_hours: 'Live-in with scheduled breaks',
    accommodation_provided: true,
    transportation_provided: false,
    visa_sponsorship: true
  }
];

async function seedJobs() {
  try {
    console.log('🌱 Starting to seed job data...');

    // First, let's get an agency user to assign these jobs to
    const { data: agencies, error: agencyError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('role', 'AgencyAdmin')
      .limit(1);

    if (agencyError || !agencies || agencies.length === 0) {
      console.error('❌ No agency admin found. Please create an agency admin user first.');
      console.log('You can create one by registering with role "AgencyAdmin" through the frontend.');
      process.exit(1);
    }

    const agency = agencies[0];
    console.log(`📋 Using agency: ${agency.name} (${agency.email})`);

    // Add agency_id to all jobs
    const jobsWithAgency = dummyJobs.map(job => ({
      ...job,
      agency_id: agency.id,
      company_name: job.company_name || agency.name
    }));

    // Insert jobs into database
    const { data: insertedJobs, error: insertError } = await supabase
      .from('jobs')
      .insert(jobsWithAgency)
      .select();

    if (insertError) {
      console.error('❌ Error inserting jobs:', insertError);
      process.exit(1);
    }

    console.log(`✅ Successfully seeded ${insertedJobs.length} jobs!`);
    
    // Display summary
    console.log('\n📊 Seeded Jobs Summary:');
    insertedJobs.forEach((job, index) => {
      console.log(`${index + 1}. ${job.title} - ${job.location_city}, ${job.location_country}`);
      console.log(`   💰 Salary: $${job.salary_min}-${job.salary_max} ${job.salary_currency}`);
      console.log(`   📅 Expires: ${new Date(job.expires_at).toLocaleDateString()}`);
      console.log('');
    });

    console.log('🎉 Job seeding completed successfully!');
    console.log('You can now test the /api/worker/applications endpoint.');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Run the seeding function
seedJobs();
