'use strict';

const supabase = require('../config/supabase');

module.exports = {
  up: async () => {
    const { data, error } = await supabase.rpc('run_migration_up', {
      sql_commands: `
        CREATE TABLE IF NOT EXISTS user_social_links (
          id SERIAL PRIMARY KEY,
          social_type_id INTEGER NOT NULL REFERENCES social_media_platforms(id) ON DELETE CASCADE,
          user_id INTEGER NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
          social_link TEXT NOT NULL,
          user_social_status INTEGER NOT NULL DEFAULT 1,
          created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS user_social_type_index 
        ON user_social_links (user_id, social_type_id);

        CREATE INDEX IF NOT EXISTS social_type_index 
        ON user_social_links (social_type_id);
      `
    });
    
    if (error) throw error;
    return data;
  },

  down: async () => {
    const { data, error } = await supabase.rpc('run_migration_down', {
      sql_commands: `
        DROP TABLE IF EXISTS user_social_links;
      `
    });
    
    if (error) throw error;
    return data;
  }
};