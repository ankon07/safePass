const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Create Supabase client with anon key (limited permissions)
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function setupJobsTables() {
  console.log('🔧 Setting up jobs and job_applications tables...');
  
  try {
    // First, let's check if we can access the database at all
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.log('❌ Cannot access database with anon key:', testError.message);
      console.log('📝 You need to create the tables manually in Supabase dashboard');
      console.log('📋 Use the SQL from jobs-applications-schema.sql file');
      return;
    }
    
    console.log('✅ Database connection successful');
    
    // Try to check if jobs table exists
    const { data: jobsData, error: jobsError } = await supabase
      .from('jobs')
      .select('count')
      .limit(1);
    
    if (jobsError) {
      console.log('❌ Jobs table does not exist:', jobsError.message);
      console.log('📝 Please create the tables using the Supabase dashboard');
      console.log('📋 Run the SQL from jobs-applications-schema.sql file');
    } else {
      console.log('✅ Jobs table exists');
    }
    
    // Try to check if job_applications table exists
    const { data: appsData, error: appsError } = await supabase
      .from('job_applications')
      .select('count')
      .limit(1);
    
    if (appsError) {
      console.log('❌ Job applications table does not exist:', appsError.message);
    } else {
      console.log('✅ Job applications table exists');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

setupJobsTables();
