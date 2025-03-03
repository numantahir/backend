'use strict';

const supabase = require('../config/supabase');

module.exports = {
  up: async () => {
    const { data, error } = await supabase.rpc('run_migration_up', {
      sql_commands: `
        CREATE TABLE IF NOT EXISTS social_media_platforms (
          id SERIAL PRIMARY KEY,
          social_name TEXT NOT NULL,
          social_icon TEXT NOT NULL,
          social_status INTEGER NOT NULL DEFAULT 1,
          created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE UNIQUE INDEX IF NOT EXISTS unique_social_name 
        ON social_media_platforms (social_name);
      `
    });
    
    if (error) throw error;
    return data;
  },

  down: async () => {
    const { data, error } = await supabase.rpc('run_migration_down', {
      sql_commands: `
        DROP TABLE IF EXISTS social_media_platforms;
      `
    });
    
    if (error) throw error;
    return data;
  }
};