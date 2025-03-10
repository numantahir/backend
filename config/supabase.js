const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = 'https://couxcmkayjjpbfljqncj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvdXhjbWtheWpqcGJmbGpxbmNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyNzMzNzcsImV4cCI6MjA1Njg0OTM3N30.WjObgKUCbZeb0pI6xHY5L1MGoHS6BUb8tEMQbkzjGx8'


if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials. Check your .env file');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  },
  db: {
    schema: 'public'
  }
});

// Test the connection
(async () => {
  const { count, error } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });

  if (error) {
    if (error.code === '42P01') {
      console.log('⚠️ Tables not created yet. Please run the initialization SQL.');
    } else {
      console.error('❌ Supabase connection test failed:', error);
    }
  } else {
    console.log('✅ Supabase connection successful. Users count:', count);
  }
})();

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
};
