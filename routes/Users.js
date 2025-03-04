const express = require("express");
const Users = express.Router();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const db = require("../models");
// const db = require("../database/db");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
// const { jwtDecode } = require("jwt-decode");
const emailConfig = require("../config/emailConfig");
const nodemailer = require("nodemailer");
const SECRET_KEY = process.env.SECRET_KEY || "secret";
console.log("Available models:", Object.keys(db));
const User = db.User;
console.log("User model:", User);
console.log("User model methods:", Object.getOwnPropertyNames(User.__proto__));
console.log("User model attributes:", Object.keys(User.rawAttributes || {}));
console.log("Database connection:", {
  isConnected: !!db,
  models: Object.keys(db),
  userModel: !!db.User
});
// Configure Cloudinary
cloudinary.config({
  cloud_name: "dd3kdc8cr",
  api_key: "289999257245228",
  api_secret: "XhAJ40_BizwTT4jIK18Rj9cUh8U"
});
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

/*********************************************/
// Reset Password
const generateRandomPassword = () => {
  return crypto.randomBytes(8).toString("hex");
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: emailConfig.gmail.user, 
    pass: emailConfig.gmail.pass,
  },
});

Users.post("/reset-password", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      status: false,
      message: "Email is required",
    });
  }

  try {
    // Find the user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User with this email does not exist",
      });
    }

    // Generate a new random password
    const newPassword = generateRandomPassword();

    // Hash the new password before saving it to the database
    bcrypt.hash(newPassword, 10, async (err, hashedPassword) => {
      if (err) {
        return res.status(500).json({
          status: false,
          message: "Error hashing the password",
        });
      }

      // Update the user's password in the database
      await User.update(
        { password: hashedPassword },
        {
          where: {
            email: user.email,
          },
        }
      );

      const mailOptions = {
        from: `"DigiMe Support" <${emailConfig.gmail.user}>`, // Sender name & email
        to: email, // Receiver email
        subject: "DigiMe: Password Reset",
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p>Hello,</p>
            <p>We received a request to reset your password. Here is your new password:</p>
            <p style="font-size: 18px; font-weight: bold; color: #007bff;">${newPassword}</p>
            <p>Please log in and change your password immediately for security purposes.</p>
            <p>If you did not request this change, please ignore this email or contact our support.</p>
            <hr style="border: none; border-top: 1px solid #ddd;">
            <p style="font-size: 12px; color: #888;">This is an automated email, please do not reply.</p>
          </div>
        `,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          return res.status(500).json({
            status: false,
            message: "Error sending email",
            error: error.message,
          });
        }

        res.json({
          status: true,
          message: "New password has been sent to your email.",
        });
      });
    });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

/*********************************************/

const uploadToCloudinary = async (file, folder) => {
  try {
    // Convert buffer to base64
    const b64 = Buffer.from(file.buffer).toString("base64");
    const dataURI = "data:" + file.mimetype + ";base64," + b64;
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: folder,
      resource_type: "auto",
    });
    return result.secure_url;
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    throw new Error("Image upload failed");
  }
};
const verifyToken = (req, res, next) => {
  try {
    console.log("Headers received:", req.headers);
    const authHeader = req.headers["authorization"];
    console.log("Auth header:", authHeader);
    
    if (!authHeader) {
      return res.status(401).json({ 
        status: false,
        message: "No authorization header provided" 
      });
    }

    // Check if the header starts with 'Bearer '
    if (!authHeader.startsWith('Bearer ')) {
      console.log("Invalid header format. Header received:", authHeader);
      return res.status(401).json({ 
        status: false,
        message: "Invalid authorization format. Must start with 'Bearer'" 
      });
    }

    // Extract the token (everything after 'Bearer ')
    const token = authHeader.substring(7);
    console.log("Extracted token:", token);

    if (!token) {
      return res.status(401).json({ 
        status: false,
        message: "No token provided" 
      });
    }

    try {
      // Log the token and secret being used
      console.log("SECRET_KEY length:", SECRET_KEY.length);
      console.log("Token length:", token.length);
      
      // Verify the token
      const decoded = jwt.verify(token, SECRET_KEY);
      console.log("Successfully decoded token:", {
        id: decoded.id,
        email: decoded.email
      });
      
      req.user = decoded;
      next();
    } catch (jwtError) {
      console.log("JWT verification error details:", {
        name: jwtError.name,
        message: jwtError.message,
        token: token.substring(0, 10) + '...' // Log first 10 chars of token for debugging
      });
      
      return res.status(401).json({ 
        status: false,
        message: "Invalid token format or signature",
        error: process.env.NODE_ENV === 'development' ? jwtError.message : undefined
      });
    }
  } catch (error) {
    console.log("Token verification error:", error);
    return res.status(401).json({ 
      status: false,
      message: "Token verification failed",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const generateSlug = (str) => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-"); // Replace spaces with hyphens
};

if (!User) {
  console.error("User model is not properly initialized!");
  process.exit(1);
}

Users.use(cors());
Users.post("/register", async (req, res) => {
  try {
    const today = new Date();
    const userData = {
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      email: req.body.email,
      password: req.body.password,
      created: today,
    };

    // Check if email exists
    const { data: existingUsers, error: findError } = await db.User.findOne({
      email: req.body.email
    });

    if (findError) {
      return res.status(500).json({
        status: false,
        message: "Error checking existing user",
        error: process.env.NODE_ENV === 'development' ? findError.message : undefined
      });
    }

    if (existingUsers && existingUsers.length > 0) {
      return res.status(400).json({ 
        status: false,
        message: "User already exists" 
      });
    }

    // Generate profile URL
    let baseProfileURL = generateSlug(`${req.body.first_name}`);
    let GProfileURL = baseProfileURL;
    let counter = Math.floor(Math.random() * 9) + 2;

    // Check if Profile URL exists
    const { data: existingProfileUrl } = await db.User.findOne({
      user_profile_url: GProfileURL,
    });

    if (existingProfileUrl) {
      GProfileURL = `${baseProfileURL}-${counter}`;
    }

    // Hash password
    const hash = await bcrypt.hash(req.body.password, 10);
    userData.password = hash;
    userData.user_profile_url = GProfileURL;

    // Create user
    const { data: newUser, error } = await db.User.create(userData);

    if (error) {
      console.error("User creation error:", error);
      return res.status(400).json({
        status: false,
        message: "Failed to create user",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    if (!newUser) {
      return res.status(400).json({
        status: false,
        message: "Failed to create user - no data returned"
      });
    }

    // Success response
    res.json({ 
      status: true,
      message: `${newUser.email} Registered successfully!`,
      data: {
        id: newUser.id,
        email: newUser.email,
        user_profile_url: newUser.user_profile_url
      }
    });

  } catch (error) {
    console.error("Registration Error:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      stack: error.stack
    });

    res.status(500).json({
      status: false,
      message: "Registration failed",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

Users.post("/login", async (req, res) => {
  try {
    console.log("Login attempt for email:", req.body.email);

    const result = await db.User.findOne({
      email: req.body.email
    });

    console.log("Database response:", JSON.stringify(result, null, 2));

    // Check for database error
    if (result.error) {
      console.error("Database Error:", result.error);
      return res.status(500).json({
        status: false,
        message: "Database error occurred",
        error: process.env.NODE_ENV === 'development' ? result.error.message : undefined
      });
    }

    // Check if user exists and handle potential undefined data
    if (!result.data || result.data.length === 0) {
      return res.status(400).json({
        status: false,
        message: "User does not exist"
      });
    }

    const user = result.data;
    console.log("Found user:", { id: user.id, email: user.email });

    if (!user.password) {
      console.error("User found but password is missing");
      return res.status(500).json({
        status: false,
        message: "Invalid user data"
      });
    }

    // Compare password
    if (bcrypt.compareSync(req.body.password, user.password)) {
      // Create token with user data
      const tokenData = {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name
      };

      // Generate token without Bearer prefix
      const token = jwt.sign(tokenData, SECRET_KEY, {
        expiresIn: '24h'
      });
      
      console.log("Generated token:", token.substring(0, 10) + '...'); // Log first 10 chars

      return res.json({
        status: true,
        message: "Login successful",
        data: {
          token: token, // Send token without Bearer prefix
          user: {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name
          }
        }
      });
    } else {
      return res.status(401).json({
        status: false,
        message: "Invalid password"
      });
    }
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({
      status: false,
      message: "Login failed",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Reset Password Route
Users.post("/resetpassword", verifyToken, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ 
        status: false, 
        message: "Password is required" 
      });
    }

    // Use the decoded user info from the middleware
    const userId = req.user.id;

    // Find User by ID
    const { data: user, error: findError } = await db.User.findOne({
      id: userId
    });

    if (findError || !user) {
      return res.status(404).json({ 
        status: false, 
        message: "User not found" 
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password
    const { error: updateError } = await db.User.update(
      { password: hashedPassword },
      { id: userId }
    );

    if (updateError) {
      throw new Error(updateError.message);
    }

    return res.json({ 
      status: true, 
      message: "Password updated successfully" 
    });

  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({
      status: false,
      message: "Failed to reset password",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});


Users.get("/profile", verifyToken, async (req, res) => {
  try {
    // Get user data using the verified user info from middleware
    const { data: user, error } = await db.User.findOne({
      id: req.user.id
    });

    if (error) {
      return res.status(500).json({
        status: false,
        message: "Database error occurred",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User does not exist",
      });
    }

    // Get social links with platform info
    const { data: socialLinks, error: socialError } = await db.UserSocialLinks.findAll({
      user_id: user.id,
      user_social_status: 1
    });

    if (socialError) {
      console.error("Error fetching social links:", socialError);
    }

    // Prepare response data
    const userData = {
      ...user,
      social_links: socialLinks || []
    };

    res.json({
      status: true,
      message: "Profile retrieved successfully",
      data: userData,
    });
  } catch (error) {
    console.error("Profile Error:", error);
    res.status(500).json({
      status: false,
      message: "Failed to retrieve profile",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
Users.get("/share-profile", async (req, res) => {
  try {
    const profileUrl = encodeURI(req.query.url);
    if (!profileUrl) {
      return res.status(400).json({
        status: false,
        message: "Profile URL is required"
      });
    }

    const { data: user } = await db.User.findOne({
      user_profile_url: profileUrl
    });

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User does not exist",
      });
    }

    // Get social links
    const { data: socialLinks } = await db.UserSocialLinks.findAll({
      user_id: user.id
    });

    user.social_links = socialLinks.length > 0 ? socialLinks : null;

    res.json({
      status: true,
      message: "Profile retrieved successfully",
      data: user,
    });
  } catch (error) {
    console.error("Profile Error:", error);
    res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});
// Users.put("/update", verifyToken, async (req, res) => {
//   try {
//     // console.log('Profile Updating-------------------------------------');
//      // console.log('Profile Updating-------------------------------------', req.user.id);
//     const user_id = req.user.id;
//     const {
//       first_name,
//       last_name,
//       bio = "",
//       website = "",
//       phone = "",
//       user_profile_url = "",
//       social_links = [],
//       profile_image = "",
//       cover_image = "",
//     } = req.body;

//     // Find the user
//     const { data: user } = await db.User.findOne({
//       id: user_id
//     });

//     if (!user) {
//       return res.status(404).json({
//         status: false,
//         message: "User not found",
//       });
//     }

//     // Update user fields if provided
//     let updatedFields = {};
//     if (first_name) updatedFields.first_name = first_name;
//     if (last_name) updatedFields.last_name = last_name;
//     if (bio) updatedFields.bio = bio;
//     if (website) updatedFields.website = website;
//     if (phone) updatedFields.phone = phone;
//     if (user_profile_url) updatedFields.user_profile_url = user_profile_url;
//     if (profile_image) updatedFields.profile_image = profile_image;
//     if (cover_image) updatedFields.cover_image = cover_image;

//     // Update user
//     const { data: updatedUser } = await db.User.update(updatedFields, {
//       id: user_id
//     });

//     // Handle social links if present
//     if (social_links.length > 0) {
//       for (const link of social_links) {
//         if (!link.social_type_id || !link.social_link) {
//           return res.status(400).json({
//             status: false,
//             message: "social_type_id and social_link are required for each social link"
//           });
//         }

//         const { social_type_id, social_link, user_social_status = 1 } = link;

//         // Check if social link exists
//         const { data: existingLink } = await db.UserSocialLinks.findOne({
//           user_id,
//           social_type_id,
//         });

//         if (existingLink) {
//           // Update existing link
//           await db.UserSocialLinks.update(
//             {
//               social_link,
//               user_social_status,
//               updated: new Date(),
//             },
//             {
//               id: existingLink.id
//             }
//           );
//         } else {
//           // Create new link
//           await db.UserSocialLinks.create({
//             user_id,
//             social_type_id,
//             social_link,
//             user_social_status,
//           });
//         }
//       }
//     }

//     // Get updated user data with social links
//     const { data: finalUser } = await db.User.findOne({
//       id: user_id
//     });

//     const { data: updatedSocialLinks } = await db.UserSocialLinks.findAll({
//       user_id: user_id
//     });

//     finalUser.social_links = updatedSocialLinks;

//     return res.json({
//       status: true,
//       message: "User updated successfully!",
//       data: finalUser
//     });

//   } catch (error) {
//     console.error("Update Error:", error);
//     return res.status(500).json({
//       status: false,
//       message: error.message || "Internal server error",
//     });
//   }
// });

Users.put("/update", verifyToken, async (req, res) => {
  try {
    console.log("Profile Updating-------------------------------------");
    console.log("Profile Updating-------------------------------------", req.user.id);
    console.log("Stage-1");
    const user_id = req.user.id;
    const { first_name, last_name, bio, website, phone, user_profile_url, profile_image, cover_image, social_links } = req.body;
    console.log("Stage-2");
    // Fetch user
    let { data: user, error } = await db.supabase
      .from("users")
      .select("*")
      .eq("id", user_id)
      .single();
      console.log("Stage-3");
    if (error || !user) {
      return res.status(404).json({ status: false, message: "User not found" });
    }
    console.log("Stage-4");

    // Prepare updated fields
    let updatedFields = {};
    if (first_name) updatedFields.first_name = first_name;
    if (last_name) updatedFields.last_name = last_name;
    if (bio) updatedFields.bio = bio;
    if (website) updatedFields.website = website;
    if (phone) updatedFields.phone = phone;
    if (user_profile_url) updatedFields.user_profile_url = user_profile_url;
    if (profile_image) updatedFields.profile_image = profile_image;
    if (cover_image) updatedFields.cover_image = cover_image;
    console.log("Stage-5");
    // Ensure there is at least one field to update
    if (Object.keys(updatedFields).length === 0) {
      return res.status(400).json({ status: false, message: "No fields provided for update" });
    }
    console.log("Stage-6");
    console.log(updatedFields);
    // Update user
    let { data: updatedUser, error: updateError } = await db.supabase
      .from("users")
      .update(updatedFields)
      .eq("id", user_id)
      .select("*"); // Remove .single()
      console.log("Stage-7");
    if (updateError) throw updateError;
    console.log("Stage-8");
    console.log(updatedUser);
    console.log("Final Fields to Update:", updatedFields);
    // Update Social Links if provided
    let socialLinksResults = [];
    if (social_links && social_links.length > 0) {
      for (const link of social_links) {
        if (!link.social_type_id || !link.social_link) {
          return res.status(400).json({ status: false, message: "Invalid social link data" });
        }

        // Check if social link exists
        let { data: existingLink } = await db.supabase
          .from("user_social_links")
          .select("*")
          .eq("user_id", user_id)
          .eq("social_type_id", link.social_type_id)
          .single();

        if (existingLink) {
          // Update existing link
          let { data, error } = await db.supabase
            .from("user_social_links")
            .update({
              social_link: link.social_link,
              user_social_status: link.user_social_status || 1,
              updated_at: new Date(),
            })
            .eq("id", existingLink.id)
            .select("*");

          if (error) throw error;
          socialLinksResults.push({ ...link, action: "updated" });
        } else {
          // Insert new link
          let { data, error } = await db.supabase
            .from("user_social_links")
            .insert({
              user_id,
              social_type_id: link.social_type_id,
              social_link: link.social_link,
              user_social_status: link.user_social_status || 1,
            })
            .select("*");

          if (error) throw error;
          socialLinksResults.push({ ...link, action: "created" });
        }
      }
    }

    // Return response
    return res.json({
      status: true,
      message: "User updated successfully!",
      data: {
        user: updatedUser,
        socialLinksResults,
      },
    });

  } catch (error) {
    console.error("Update Error:", error);
    return res.status(500).json({ status: false, message: "Internal server error" });
  }
});



Users.put(
  "/update-image",
  verifyToken,
  upload.single("image"),
  async (req, res) => {
    try {
      const user_id = req.decoded.id;
      const { image_type } = req.body;
      // Find the user
      let user = await User.findOne({ where: { id: user_id } });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      if (!["profile_image", "cover_image"].includes(image_type)) {
        return res.status(400).json({
          status: false,
          message:
            "Invalid image type. Must be 'profile_image' or 'cover_image'",
        });
      }
      if (!req.file) {
        return res.status(400).json({
          status: false,
          message: "No image file provided",
        });
      }
      const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
      if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({
          status: false,
          message: "Invalid file type. Only JPEG, JPG and PNG are allowed",
        });
      }
      const cloudinaryUrl = await uploadToCloudinary(
        req.file,
        `users/${user_id}/${image_type}`
      );
      // const updateField =
      //   image_type === "profile_image"
      //     ? { profile_image: cloudinaryUrl }
      //     : { cover_image: cloudinaryUrl };
      // // Perform the update
      // await User.update(updateField, {
      //   where: { id: user_id },
      // });
      res.json({
        status: true,
        message: `${
          image_type === "profile_image" ? "Profile" : "Cover"
        } image updated successfully!`,
        data: {
          image_url: cloudinaryUrl,
          image_type,
        },
      });
    } catch (error) {
      console.error("Update Error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);
module.exports = Users;
