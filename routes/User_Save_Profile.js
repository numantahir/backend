const express = require("express");
const router = express.Router();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const db = require("../models");
const { jwtDecode } = require("jwt-decode");

const User = db.User;
const UserSaveProfile = db.UserSaveProfile;

if (!User || !UserSaveProfile) {
  console.error("Required models are not properly initialized!");
  process.exit(1);
}

router.use(cors());

process.env.SECRET_KEY = "secret";

const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res.status(401).json({ error: "No token provided" });
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: "Invalid token format" });
    }
    req.decoded = jwtDecode(token);
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

router.post("/save-profile", verifyToken, async (req, res) => {
  try {
    const user_id = req.decoded.id;
    const { user_profile_url } = req.body;

    if (!user_profile_url) {
      return res.status(400).json({ error: "Profile ID is required" });
    }

    // Check if profile exists
    const { data: profileExists } = await User.findOne({
      user_profile_url: user_profile_url
    });
    
    if (!profileExists) {
      return res.status(404).json({ error: "Profile not found" });
    }

    // Check if already saved
    // const { data: existingSave } = await UserSaveProfile.findOne({
    //   user_id: user_id,
    //   profile_id: profileExists.id
    // });

    const { data: existingSave } = await db.supabase
    .from("user_save_profiles") // Change to lowercase
    .select(`*`)
    .eq({"user_id": user_id}, {"profile_id": profileExists.id});
    
    if (existingSave) {
      return res.status(400).json({ error: "Profile already saved" });
    }

    console.log('Store Data Detail --->', user_id, profileExists.id, new Date());


        const saveData = {
          user_id: user_id,
          profile_id: profileExists.id,
          created: new Date().toISOString(), // Ensure proper timestamp format
        };

      const { data: UserSaved, error } = await db.UserSaveProfile.create(saveData);
        // console.log('---------------->',UserSaved, error);
    if (error) {
      console.error("User creation error:", error);
      return res.status(200).json({
        status: false,
        message: "Failed to create user",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    


    res.json({
      message: "Profile saved successfully",
      data: savedProfile
    });
  } catch (error) {
    console.error("Save Profile Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/saved-profiles", verifyToken, async (req, res) => {
  try {
    console.log('>>>>>>>>>>>>>>>>>..', req.decoded);
    const user_id = req.decoded.id;

    let { data: savedProfiles, error } = await db.supabase
      .from("user_save_profiles") // Change to lowercase
      .select(
        `*, 
        user:users!user_id(*), 
        profile:users!profile_id(*)`
      )
    .eq("user_id", req.decoded.id);

    // console.log('-------------..', savedProfiles);
    if (error) console.error("Error fetching saved profiles:", error);



    res.json({
      message: "Saved profiles fetched successfully",
      data: savedProfiles
    });
  } catch (error) {
    console.error("Error fetching saved profiles:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/delete-profile/:profileId", verifyToken, async (req, res) => {
  try {
    const user_id = req.decoded.id;
    const { profileId } = req.params;
    console.log('Delete Profile From->',user_id);
    console.log('Delete Profile To->',profileId);
    const profileIdNum = parseInt(profileId, 10);
    if (isNaN(profileIdNum)) {
      return res.status(400).json({ error: "Invalid profile ID" });
    }

    // Check if profile exists and belongs to user
    // const { data: savedProfile } = await UserSaveProfile.findOne({
    //   profile_id: profileIdNum,
    //   user_id: user_id
    // });
    console.log('<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
    console.log('>>>>>> user_id--->', user_id);
    console.log('>>>>>> profileIdNum--->', profileIdNum);
    // const { data: savedProfile } = await db.supabase
    // .from("user_save_profiles") // Change to lowercase
    // .select(`*`)
    // .eq({"user_id": user_id}, {"profile_id": profileIdNum});
  
    const { data: savedProfile, error } = await db.supabase
      .from("user_save_profiles") // Ensure the table name matches exactly in Supabase
      .select(`*`)
      .eq("user_id", user_id) // Correct way to use .eq()
      .eq("profile_id", profileIdNum); // Apply second filter

    // if (error) {
    //   console.error("Error fetching saved profile:", error);
    // } else {
    //   console.log("Saved Profile:", savedProfile);
    // }
    console.error("Error fetching saved profile:", error);
    console.log("Saved Profile:", savedProfile);
    if (error) {
      return res.status(404).json({ error: "Profile not found or unauthorized to delete" });
    }

    // Delete the profile
    // await UserSaveProfile.destroy({
    //   profile_id: profileIdNum,
    //   user_id: user_id
    // });
    console.log('<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
    console.log('Its work');
    console.log("Saved Profile:", savedProfile);
    const DeleteData = {
      profile_id: profileIdNum,
      user_id: user_id
    };
    // const { data: UserSaved, error } = await db.UserSaveProfile.destroy(DeleteData);

    // const { data: DeleteSaveProfile, error } = await db.supabase
    // .from('user_save_profiles')
    //     .delete()
    //     .match(DeleteData);
  
        // const { error } = await db.supabase
        //   .from('user_save_profiles')
        //   .delete()
        //   .eq('user_id', user_id)
        //   .eq('profile_id', profileIdNum);

    console.log('Print Error--->', error);
    

    res.json({ message: "Saved profile deleted successfully" });
  } catch (error) {
    console.error("Error deleting saved profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
