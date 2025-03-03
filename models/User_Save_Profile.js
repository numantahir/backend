'use strict';

module.exports = (supabase) => {
  const UserSaveProfile = {
    // Create a new save profile
    create: async (saveData) => {
      const { data, error } = await supabase
        .from('User_Save_Profiles')
        .insert([saveData])
        .select(`
          *,
          user:Users!user_id(*),
          profile:Users!profile_id(*)
        `);
      if (error) throw error;
      return data[0];
    },

    // Find saved profile by id
    findByPk: async (id) => {
      const { data, error } = await supabase
        .from('User_Save_Profiles')
        .select(`
          *,
          user:Users!user_id(*),
          profile:Users!profile_id(*)
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },

    // Find all saved profiles
    findAll: async (where = {}) => {
      const { data, error } = await supabase
        .from('User_Save_Profiles')
        .select(`
          *,
          user:Users!user_id(*),
          profile:Users!profile_id(*)
        `)
        .match(where);
      if (error) throw error;
      return data;
    },

    // Delete saved profile
    destroy: async (where) => {
      const { error } = await supabase
        .from('User_Save_Profiles')
        .delete()
        .match(where);
      if (error) throw error;
      return true;
    }
  };

  // Define associations (for documentation)
  UserSaveProfile.associate = (models) => {
    // These are now handled through Supabase's foreign key relationships
    return;
  };

  return UserSaveProfile;
};
