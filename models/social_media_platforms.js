'use strict';

module.exports = (supabase) => {
  const SocialMediaPlatforms = {
    // Create a new platform
    create: async (platformData) => {
      const { data, error } = await supabase
        .from('social_media_platforms')
        .insert([platformData])
        .select(`
          *,
          user_links:user_social_links(*)
        `);
      if (error) throw error;
      return data[0];
    },

    // Find platform by id
    findByPk: async (id) => {
      const { data, error } = await supabase
        .from('social_media_platforms')
        .select(`
          *,
          user_links:user_social_links(*)
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },

    // Find all platforms
    findAll: async (where = {}) => {
      const { data, error } = await supabase
        .from('social_media_platforms')
        .select(`*`)
        .match(where);
      if (error) throw error;
      // console.log('>>>>>>>', data);
      return data;
    }
  };

  // Define associations (for documentation)
  SocialMediaPlatforms.associate = (models) => {
    // These are now handled through Supabase's foreign key relationships
    return;
  };

  return SocialMediaPlatforms;
};