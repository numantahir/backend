'use strict';

const supabase = require('../config/supabase');

module.exports = {
  up: async () => {
    const { data, error } = await supabase.rpc('run_migration_up', {
      sql_commands: `
        ALTER TABLE Users 
        ADD COLUMN IF NOT EXISTS profile_image TEXT,
        ADD COLUMN IF NOT EXISTS cover_image TEXT;
      `
    });
    
    if (error) throw error;
    return data;
  },

  down: async () => {
    const { data, error } = await supabase.rpc('run_migration_down', {
      sql_commands: `
        ALTER TABLE Users 
        DROP COLUMN IF EXISTS profile_image,
        DROP COLUMN IF EXISTS cover_image;
      `
    });
    
    if (error) throw error;
    return data;
  }
};