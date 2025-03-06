const express = require("express");
const router = express.Router();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const db = require("../models");
const { jwtDecode } = require("jwt-decode");

const SocialMediaPlatforms = db.SocialMediaPlatforms;
const UserSocialLinks = db.UserSocialLinks;
console.log("Available models:", Object.keys(db));

if (!SocialMediaPlatforms || !UserSocialLinks) {
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

router.post("/add-platform", verifyToken, async (req, res) => {
  try {
    const platforms = req.body.platforms;

    if (!Array.isArray(platforms) || platforms.length === 0) {
      return res.status(400).json({
        status: false,
        message: "Please provide an array of social media platforms"
      });
    }

    // Validate each platform
    for (const platform of platforms) {
      if (!platform.social_name) {
        return res.status(400).json({
          status: false,
          message: "Social Media Name is required for each platform"
        });
      }
    }

    const socialNames = platforms.map(platform => platform.social_name.toLowerCase());

    // Check for duplicates
    if (new Set(socialNames).size !== socialNames.length) {
      return res.status(400).json({
        status: false,
        message: "Duplicate social media names found in request"
      });
    }

    // Check existing platforms
    const { data: existingPlatforms } = await SocialMediaPlatforms.findAll({
      social_name: socialNames
    });

    if (existingPlatforms && existingPlatforms.length > 0) {
      const existingNames = existingPlatforms.map(platform => platform.social_name);
      return res.status(400).json({
        status: false,
        message: "Some social media platforms already exist",
        existing_platforms: existingNames
      });
    }

    // Create platforms
    const platformsToCreate = platforms.map(platform => ({
      social_name: platform.social_name,
      social_icon: platform.social_icon || "icon",
      social_status: platform.social_status || 1,
      created: new Date(),
      updated: new Date()
    }));

    const { data: createdPlatforms } = await SocialMediaPlatforms.create(platformsToCreate);

    res.json({
      status: true,
      message: "Social Media platforms created successfully",
      data: createdPlatforms
    });
  } catch (error) {
    console.error("Social Media Error:", error);
    res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message
    });
  }
});

router.get("/platforms", verifyToken, async (req, res) => {
  try {
    console.log('Check what -1- Received > ', req.user.id);
    console.log('Check what -2- Received > ', req.decoded.id);
    // let { data: socialLinks, error } = await db.supabase
    // .from("user_social_links")
    // .select("id, social_link, user_social_status, created, updated, social_media_platforms: social_type_id(*)")
    // .eq("user_id", userId); // Assuming userId is the parameter passed

    let { data: socialLinks, error } = await db.supabase
    .from("social_media_platforms")
    .select(`
        id, 
        platform_name, 
        user_social_links!left(user_id, social_link, user_social_status, created, updated)
    `)
    .eq("user_social_links.user_id", userId);

    if (error) {
      return res.status(500).json({ status: false, message: "Database error", error });
    }

    // If no records are found for the user, return all user_social_links
    if (!socialLinks || socialLinks.length === 0) {
      let { data: allSocialLinks, error: allError } = await db.supabase
        .from("user_social_links")
        .select("id, social_link, user_social_status, created, updated, social_media_platforms: social_type_id(*)");

      if (allError) {
        return res.status(500).json({ status: false, message: "Database error", error: allError });
      }

      return res.status(200).json({ status: true, data: allSocialLinks });
    }

    // If records exist for the given user_id, return them
    return res.status(200).json({ status: true, data: socialLinks });



    // let { data: platforms, error } = await db.supabase
    //   .from("social_media_platforms")
    //   .select("*")
    //   .match({});
    //   // console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>> ", platforms);
    // if (error) {
    //   return res.status(404).json({ status: false, message: "User not found" });
    // }

    // // const { data: platforms } = await SocialMediaPlatforms.findAll();
    // // console.log('Social Media Platform: --->>>> ', platforms);
    // res.json({
    //   message: "Social Media Platforms Fetched successfully",
    //   data: platforms
    // });
  } catch (error) {
    console.error("Social Media Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/add-social-links", verifyToken, async (req, res) => {
  try {
    const user_id = req.decoded.id;
    const socialLinks = req.body.socialLinks;

    if (!Array.isArray(socialLinks) || socialLinks.length === 0) {
      return res.status(400).json({ 
        error: "Please provide an array of social links" 
      });
    }

    const updatedLinks = [];
    for (const link of socialLinks) {
      const { social_type_id, social_link, user_social_status = 1 } = link;

      if (!social_type_id || !social_link) {
        return res.status(400).json({ 
          error: "Complete All Mandatory Fields" 
        });
      }

      const { data } = await UserSocialLinks.create({
        user_id,
        social_type_id,
        social_link,
        user_social_status
      });

      updatedLinks.push(data);
    }

    res.json({
      message: "Social Link saved successfully",
      data: updatedLinks
    });
  } catch (error) {
    console.error("Social Media Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
