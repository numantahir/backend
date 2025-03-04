'use strict';

const { TABLES } = require('../config/supabase');

module.exports = (supabase) => {
  const User = {
    // Create a new user
    create: async (userData) => {
      try {
        // First insert the user
        const { data: insertedData, error: insertError } = await supabase
          .from(TABLES.USERS)
          .insert([userData]);

        if (insertError) throw insertError;

        // Then fetch the created user
        const { data: user, error: fetchError } = await supabase
          .from(TABLES.USERS)
          .select('*')
          .eq('email', userData.email)
          .single();

        if (fetchError) throw fetchError;

        return { data: user };
      } catch (error) {
        if (error.code === 'PGRST116') {
          return { data: null, error: new Error('User creation failed') };
        }
        throw error;
      }
    },

    // Find user by id with relationships
    findByPk: async (id) => {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .select(`
          *,
          social_links:${TABLES.USER_SOCIAL_LINKS}(
            *,
            platform:${TABLES.SOCIAL_MEDIA_PLATFORMS}(*)
          ),
          saved_profiles:${TABLES.USER_SAVE_PROFILES}(
            saved_user:${TABLES.USERS}!profile_id(*)
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { data: null };
        }
        throw error;
      }
      return { data };
    },

    // Find user by criteria
    findOne: async (where) => {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .select(`
          *,
          social_links:${TABLES.USER_SOCIAL_LINKS}(
            *,
            platform:${TABLES.SOCIAL_MEDIA_PLATFORMS}(*)
          )
        `)
        .match(where)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { data: null };
        }
        throw error;
      }
      return { data };
    },

    // Update user
    update: async (values, where) => {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .update(values)
        .match(where)
        .select(`
          *,
          social_links:${TABLES.USER_SOCIAL_LINKS}(
            *,
            platform:${TABLES.SOCIAL_MEDIA_PLATFORMS}(*)
          )
        `)
        .single();

      if (error) throw error;
      return { data };
    },

    // Delete user
    destroy: async (where) => {
      const { error } = await supabase
        .from(TABLES.USERS)
        .delete()
        .match(where);

      if (error) throw error;
      return true;
    }
  };

  // Define associations
  User.associate = (models) => {
    // These are now handled through Supabase's foreign key relationships
    // but we keep the associations for reference
    User.hasMany = (model, options) => {
      // This is now just for documentation
      return;
    };
  };

  return User;
};
