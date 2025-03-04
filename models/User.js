'use strict';

const { TABLES } = require('../config/supabase');

module.exports = (supabase) => {
  const User = {
    // Create a new user
    create: async (userData) => {
      try {
        const { data, error } = await supabase
          .from(TABLES.USERS)
          .insert([userData])
          .select('*')
          .single();

        if (error) throw error;
        return { data };
      } catch (error) {
        return { data: null, error: error.message };
      }
    },

    // Find user by ID
    findByPk: async (id) => {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .select(`
          *,
          social_links:${TABLES.USER_SOCIAL_LINKS}(
            *,
            platform:${TABLES.SOCIAL_MEDIA_PLATFORMS}(*)
          )
        `)
        .eq('id', id)
        .single();

      if (error) return { data: null, error: error.message };
      return { data };
    },

    // Find user by criteria
    findOne: async (where) => {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .match(where)
        .single();

      if (error) return { data: null, error: error.message };
      return { data };
    },

    // Update user
    update: async (values, where) => {
      const { data, error } = await supabase
        .from('users')
        .update({bio: 'testing'})
        .match({id: 2})
        .select('*')
        .order('id', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) return { data: null, error: error.message };
      return { data };
    },

    // Delete user
    destroy: async (where) => {
      const { error } = await supabase
        .from(TABLES.USERS)
        .delete()
        .match(where);

      if (error) return { success: false, error: error.message };
      return { success: true };
    }
  };

  return User;
};
