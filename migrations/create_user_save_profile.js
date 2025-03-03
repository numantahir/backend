'use strict';

const supabase = require('../config/supabase');

module.exports = {
  up: async () => {
    const { data, error } = await supabase.rpc('run_migration_up', {
      sql_commands: `
        CREATE TABLE IF NOT EXISTS User_Save_Profiles (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
          profile_id INTEGER NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
          created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, profile_id)
        );

        CREATE UNIQUE INDEX IF NOT EXISTS unique_user_profile_save 
        ON User_Save_Profiles (user_id, profile_id);
      `
    });
    
    if (error) throw error;
    return data;
  },

  down: async () => {
    const { data, error } = await supabase.rpc('run_migration_down', {
      sql_commands: `
        DROP TABLE IF EXISTS User_Save_Profiles;
      `
    });
    
    if (error) throw error;
    return data;
  }
};