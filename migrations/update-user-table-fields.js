'use strict';

const supabase = require('../config/supabase');

module.exports = {
  up: async () => {
    // Using Supabase's PostgreSQL connection
    const { data, error } = await supabase.rpc('run_migration_up', {
      sql_commands: `
        ALTER TABLE Users 
        ADD COLUMN IF NOT EXISTS user_profile_url TEXT,
        ADD COLUMN IF NOT EXISTS bio TEXT,
        ADD COLUMN IF NOT EXISTS website TEXT,
        ADD COLUMN IF NOT EXISTS phone TEXT;
      `
    });
    
    if (error) throw error;
    return data;
  },

  down: async () => {
    const { data, error } = await supabase.rpc('run_migration_down', {
      sql_commands: `
        ALTER TABLE Users 
        DROP COLUMN IF EXISTS user_profile_url,
        DROP COLUMN IF EXISTS bio,
        DROP COLUMN IF EXISTS website,
        DROP COLUMN IF EXISTS phone;
      `
    });
    
    if (error) throw error;
    return data;
  }
};