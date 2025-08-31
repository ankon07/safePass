const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function seedJobs() {
  console.log('🌱 Seeding jobs data...');
  
  try {
    // First check if there are any jobs
    const { data: existingJobs, error: checkError } = await supabase
      .from('jobs')
      .select('id')
      .limit(1);
    
    if (checkError) {
      console.log('❌ Error checking jobs:', checkError.message);
      return;
    }
    
    if (existingJobs && existingJobs.length > 0) {
      console.log('✅ Jobs already exist in database');
      return;
    }
    
    // Get an agency user to associate jobs with
    const { data: agencies, error: agencyError } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('role', 'AgencyAdmin')
      .limit(1);
    
    if (agencyError || !agencies || agencies.length === 0) {
      console.log('❌ No agency found. Creating a test agency first...');
      // We'll need to create an agency user first
      return;
    }
    
    const agency = agencies[0];
    console.log('📋 Using agency:', agency.name, '(' + agency.email + ')');
    
    // Sample jobs data
    const jobsData = [
      {
        title: 'Construction Worker',
        description: 'Seeking experienced construction workers for residential building project.',
        location: 'Dubai, UAE',
        country: 'UAE',
        salary_min: 2500,
        salary_max: 3500,
        currency: 'AED',
        job_type: 'Full-time',
        category: 'Construction',
        requirements: ['2+ years experience', 'Physical fitness', 'Safety certification'],
        benefits: ['Health insurance', 'Accommodation', 'Transportation'],
        agency_id: agency.id,
        status: 'active'
      },
      {
        title: 'Hotel Housekeeper',
        description: 'Join our hospitality team as a housekeeper in a luxury hotel.',
        location: 'Doha, Qatar',
        country: 'Qatar',
        salary_min: 1800,
        salary_max: 2200,
        currency: 'QAR',
        job_type: 'Full-time',
        category: 'Hospitality',
        requirements: ['Hotel experience preferred', 'Attention to detail', 'English communication'],
        benefits: ['Meals provided', 'Accommodation', 'Annual leave'],
        agency_id: agency.id,
        status: 'active'
      }
    ];
    
    const { data: insertedJobs, error: insertError } = await supabase
      .from('jobs')
      .insert(jobsData)
      .select();
    
    if (insertError) {
      console.log('❌ Error inserting jobs:', insertError);
    } else {
      console.log('✅ Successfully inserted', insertedJobs.length, 'jobs');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

seedJobs();
