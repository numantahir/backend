const { createClient } = require('@supabase/supabase-js')

// const supabaseUrl = process.env.SUPABASE_URL
// const supabaseKey = process.env.SUPABASE_ANON_KEY

const supabaseUrl = 'https://ehwhhlrghirlnnzcqwbp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVod2hobHJnaGlybG5uemNxd2JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5Nzg5OTgsImV4cCI6MjA1NjU1NDk5OH0.b2PmIfXiwABBzq9-yOHxGC3BhJyOJ4pDbYfIpS8mPxA'


if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials:', { 
    url: !!supabaseUrl, 
    key: !!supabaseKey 
  });
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  },
  db: {
    schema: 'public'
  }
});


supabase
  .from('users')
  .update({ phone: '123456789' })
  .match({ id: 8 }) 
  .select('*')
  .single();

// Test the connection
supabase.from('users')
  .select('*', { count: 'exact', head: true })
  .then(({ count, error }) => {
    if (error) {
      if (error.code === '42P01') {
        console.log('Tables not created yet. Please run the initialization SQL.');
      } else {
        console.error('Supabase connection test failed:', error);
      }
    } else {
      console.log('Supabase connection successful. Users count:', count);
    }
  });

// Define table names
const TABLES = {
  USERS: 'users',
  SOCIAL_MEDIA_PLATFORMS: 'social_media_platforms',
  USER_SOCIAL_LINKS: 'user_social_links',
  USER_SAVE_PROFILES: 'user_save_profiles'
}

module.exports = {
  supabase,
  TABLES
} 