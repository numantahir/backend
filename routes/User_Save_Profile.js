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
    const { data: existingSave } = await UserSaveProfile.findOne({
      user_id: user_id,
      profile_id: profileExists.id
    });

    if (existingSave) {
      return res.status(400).json({ error: "Profile already saved" });
    }

    // Save the profile
    const { data: savedProfile } = await UserSaveProfile.create({
      user_id: user_id,
      profile_id: profileExists.id,
      created: new Date()
    });

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
    const user_id = req.decoded.id;

    const { data: savedProfiles } = await UserSaveProfile.findAll({
      user_id: user_id
    });

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

    const profileIdNum = parseInt(profileId, 10);
    if (isNaN(profileIdNum)) {
      return res.status(400).json({ error: "Invalid profile ID" });
    }

    // Check if profile exists and belongs to user
    const { data: savedProfile } = await UserSaveProfile.findOne({
      profile_id: profileIdNum,
      user_id: user_id
    });

    if (!savedProfile) {
      return res.status(404).json({ error: "Profile not found or unauthorized to delete" });
    }

    // Delete the profile
    await UserSaveProfile.destroy({
      profile_id: profileIdNum,
      user_id: user_id
    });

    res.json({ message: "Saved profile deleted successfully" });
  } catch (error) {
    console.error("Error deleting saved profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
