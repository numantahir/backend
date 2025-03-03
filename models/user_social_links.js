'use strict';

const { TABLES } = require('../config/supabase');

module.exports = (supabase) => {
  const UserSocialLinks = {
    // Create a new social link
    create: async (linkData) => {
      const { data, error } = await supabase
        .from(TABLES.USER_SOCIAL_LINKS)
        .insert([linkData])
        .select(`
          *,
          user:${TABLES.USERS}(*),
          platform:${TABLES.SOCIAL_MEDIA_PLATFORMS}(*)
        `)
        .single();

      if (error) throw error;
      return { data };
    },

    // Find all social links
    findAll: async (where = {}) => {
      const { data, error } = await supabase
        .from(TABLES.USER_SOCIAL_LINKS)
        .select(`
          *,
          user:${TABLES.USERS}(*),
          platform:${TABLES.SOCIAL_MEDIA_PLATFORMS}(*)
        `)
        .match(where);

      if (error) throw error;
      return { data: data || [] };
    },

    // Update social link
    update: async (values, where) => {
      const { data, error } = await supabase
        .from(TABLES.USER_SOCIAL_LINKS)
        .update(values)
        .match(where)
        .select(`
          *,
          user:${TABLES.USERS}(*),
          platform:${TABLES.SOCIAL_MEDIA_PLATFORMS}(*)
        `)
        .single();

      if (error) throw error;
      return { data };
    }
  };

  // Define associations (for documentation)
  UserSocialLinks.associate = (models) => {
    // These are now handled through Supabase's foreign key relationships
    return;
  };

  return UserSocialLinks;
};