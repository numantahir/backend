'use strict';
const { TABLES } = require('../config/supabase');
module.exports = (supabase) => {
  const UserSaveProfile = {
    // Create a new save profile
    // create: async (saveData) => {
    //   const { data, error } = await supabase
    //     .from('User_Save_Profiles')
    //     .insert([saveData])
    //     .select(`*`);
    //   if (error) throw error;
    //   return data[0];
    // },


    create: async (saveData) => {
      try {
        // Insert the user
        const { data: insertedData, error: insertError } = await supabase
          .from(TABLES.USER_SAVE_PROFILES)
          .insert([saveData]);
    
        if (insertError) {
          console.error("Insert Error:", insertError);  // Log error
          throw insertError;
        }
    
        // Fetch the created user
        const { data: saveduserprofile, error: fetchError } = await supabase
          .from(TABLES.USER_SAVE_PROFILES)
          .select('*')
          .eq('user_id', saveData.user_id)
          .single();
        if (fetchError) {
          console.error("Fetch Error:", fetchError);  // Log error
          throw fetchError;
        }
    
        return { data: user };
      } catch (error) {  // Use 'error' correctly
        console.error("Unexpected Error:", error);  // Log unexpected errors
    
        if (error.code === 'PGRST116') {
          return { data: null, error: new Error('Shared Profile save failed') };
        }
    
        return { data: null, error: error }; // Return the actual error
      }
    },
    

    // create: async (saveData) => {
    //   try {
    //       const { data, error } = await supabase
    //           .from('User_Save_Profiles')
    //           .insert([saveData]);
    //           // .select('*');
  
    //       if (error) {
    //           console.error("Supabase Insert Error:", error);
    //           throw error;  // Ensure the error is properly thrown
    //       }
  
    //       console.log("Insert Success:", data);
    //       return data;
    //   } catch (err) {
    //       console.error("Save Profile Catch Error:", err);
    //       throw err;
    //   }
    // },
  

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
        .from('user_save_profiles')
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
