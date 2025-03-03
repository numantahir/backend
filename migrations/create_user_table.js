'use strict';

const supabase = require('../config/supabase');

module.exports = {
  up: async () => {
    const { data, error } = await supabase.rpc('run_migration_up', {
      sql_commands: `
        CREATE TABLE IF NOT EXISTS Users (
          id SERIAL PRIMARY KEY,
          first_name TEXT,
          last_name TEXT,
          email TEXT,
          password TEXT,
          created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `
    });
    
    if (error) throw error;
    return data;
  },

  down: async () => {
    const { data, error } = await supabase.rpc('run_migration_down', {
      sql_commands: `
        DROP TABLE IF EXISTS Users;
      `
    });
    
    if (error) throw error;
    return data;
  }
};