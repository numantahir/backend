const express = require("express");
const Users = express.Router();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const db = require("../models");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const { jwtDecode } = require("jwt-decode");
const emailConfig = require("../config/emailConfig");
const nodemailer = require("nodemailer");
const SECRET_KEY = process.env.SECRET_KEY || "secret";
console.log("Available models:", Object.keys(db));
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
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res.status(401).json({ 
        status: false,
        message: "No token provided" 
      });
    }
    // Split 'Bearer token' and get only the token part
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ 
        status: false,
        message: "Invalid token format" 
      });
    }
    // Verify the token
    req.decoded = jwtDecode(token);
    next();
  } catch (error) {
    console.log("Token verification error:", error);
    return res.status(401).json({ 
      status: false,
      message: "Invalid token",
      error: error.message 
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

const User = db.User; // Make sure this matches the export in your models/index.js
if (!User) {
  console.error("User model is not properly initialized!");
  process.exit(1);
}

Users.use(cors());
Users.post("/register", (req, res) => {
  const today = new Date();
  const userData = {
    first_name: req.body.first_name,
    last_name: req.body.last_name,
    email: req.body.email,
    password: req.body.password,
    created: today,
  };

  // Generate profile URL
  let baseProfileURL = generateSlug(`${req.body.first_name}`);
  console.log(baseProfileURL);
  // Check if Profile URL is unique
  let GProfileURL = baseProfileURL;
  let counter = Math.floor(Math.random() * 9) + 2;
  // Verify User Profile URL
    User.findOne({
      where: {
        user_profile_url: GProfileURL,
      },
    })
      .then((user_profile_url) => {
          if (user_profile_url) {
            GProfileURL = `${baseProfileURL}-${counter}`;
            } else {
            GProfileURL = `${baseProfileURL}`;
          }
      })
    .catch((err) => {
      res.send("error: " + err);
    });
  // Verify Email Address
  User.findOne({
    where: {
      email: req.body.email,
    },
  })
    //TODO bcrypt
    .then((user) => {
      if (!user) {
        bcrypt.hash(req.body.password, 10, (err, hash) => {
          userData.password = hash;
          userData.user_profile_url = GProfileURL;
          User.create(userData)
            .then((user) => {
              res.json({ status: user.email + "Registered!" });
            })
            .catch((err) => {
              res.send("error: " + err);
            });
        });
      } else {
        res.json({ error: "User already exists" });
      }
    })
    .catch((err) => {
      res.send("error: " + err);
    });
});

Users.post("/login", (req, res) => {
  User.findOne({
    where: {
      email: req.body.email,
    },
  })
    .then((user) => {
      if (user) {
        if (bcrypt.compareSync(req.body.password, user.password)) {
          let token = jwt.sign(user.dataValues, SECRET_KEY, {
            expiresIn: 1440,
          });
          res.json(token);
        } else {
          res.status(401).json({ 
            status: false,
            message: "Invalid password" 
          });
        }
      } else {
        res.status(400).json({ 
          status: false,
          message: "User does not exist" 
        });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(400).json({ 
        status: false,
        message: "Login failed",
        error: err.message 
      });
    });
});

// Reset Password Route
Users.post("/resetpassword", verifyToken, async (req, res) => {
  try {

    console.log('Reset Passwrd Area');
    const { password } = req.body;
    console.log(password);
    if (!password) {
      return res.status(400).json({ status: false, message: "Password is required" });
    }

    // Extract user ID from token
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res.status(401).json({ status: false, message: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwtDecode(token);
    const userId = decoded.id;

    // Find User by ID
    const user = await User.findOne({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password
    await User.update(
      { password: hashedPassword },
      { where: { id: userId } }
    );

    return res.json({ status: true, message: "Password updated successfully" });

  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});


Users.get("/profile", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res.status(401).json({ 
        status: false,
        message: "No token provided" 
      });
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ 
        status: false,
        message: "Invalid token format" 
      });
    }
    const decoded = jwtDecode(token);
    const user = await User.findOne({
      where: {
        id: decoded.id,
      },
      include: [
        {
          model: db.user_social_links,
          as: "social_links",
          where: {
            user_social_status: 1, // Only active links
          },
          required: false, // LEFT JOIN to show users even without social links
          include: [
            {
              model: db.social_media_platforms,
              as: "social_platform",
              attributes: ["id", "social_name", "social_icon"],
              where: {
                social_status: 1, // Only active platforms
              },
            },
          ],
          attributes: [
            "id",
            "social_type_id",
            "social_link",
            "user_social_status",
            "created",
          ],
        },
      ],
      attributes: [
        "id",
        "first_name",
        "last_name",
        "email",
        "user_profile_url",
        "bio",
        "website",
        "phone",
        "profile_image",
        "cover_image",
        "created",
      ],
    });
    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User does not exist",
      });
    }
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
Users.get("/share-profile", async (req, res) => {
  try {
    const profileUrl = encodeURI(req.query.url);
    if (!profileUrl) {
      return res.status(400).json({
        status: false,
        message: "Profile URL is required"
      });
    }
    const user = await User.findOne({
      where: {
        user_profile_url: profileUrl,
      },
      include: [
        {
          model: db.user_social_links,
          as: "social_links",
          required: false, // Ensures the user is still returned even if no social links exist
          include: [
            {
              model: db.social_media_platforms,
              as: "social_platform",
              attributes: ["id", "social_name", "social_icon"],
              required: false, // Ensures null values instead of filtering out
            },
          ],
          attributes: [
            "id",
            "social_type_id",
            "social_link",
            "user_social_status",
            "created",
          ],
        },
      ],
      attributes: [
        "id",
        "first_name",
        "last_name",
        "email",
        "user_profile_url",
        "bio",
        "website",
        "phone",
        "profile_image",
        "cover_image",
        "created",
      ],
    });
    if (user && (!user.social_links || user.social_links.length === 0)) {
      user.social_links = null;
    }
    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User does not exist",
      });
    }
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
Users.put("/update", verifyToken, async (req, res) => {
  // Start transaction outside of try blocks
  const t = await db.sequelize.transaction();
  try {
    const user_id = req.decoded.id;
    const {
      first_name,
      last_name,
      bio = "",
      website = "",
      phone = "",
      user_profile_url = "",
      social_links = [],
      profile_image = "",
      cover_image = "",
    } = req.body;
    // Find the user
    let user = await User.findOne({ 
      where: { id: user_id },
      transaction: t 
    });
    if (!user) {
      await t.rollback();
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }
    // Update user fields if provided
    let updatedFields = {};
    if (first_name) updatedFields.first_name = first_name;
    if (last_name) updatedFields.last_name = last_name;
    if (bio) updatedFields.bio = bio;
    if (website) updatedFields.website = website;
    if (phone) updatedFields.phone = phone;
    if (user_profile_url) updatedFields.user_profile_url = user_profile_url;
    if (profile_image) updatedFields.profile_image = profile_image;
    if (cover_image) updatedFields.cover_image = cover_image;
    // Update user
    const updatedUserData = await User.update(updatedFields, {
      where: { id: user_id },
      transaction: t,
    });
    console.log(updatedUserData);
    // Handle social links if present
    let socialLinksResults = [];
    if (social_links.length > 0) {
      // Validate social links data
      for (const link of social_links) {
        if (!link.social_type_id || !link.social_link) {
          await t.rollback();
          return res.status(400).json({
            status: false,
            message: "social_type_id and social_link are required for each social link"
          });
        }
      }
      // Process each social link
      const socialLinksPromises = social_links.map(async (link) => {
        const { social_type_id, social_link, user_social_status = 1 } = link;
        // Check if social link already exists
        const existingLink = await db.user_social_links.findOne({
          where: {
            user_id,
            social_type_id,
          },
          transaction: t,
        });
        if (existingLink) {
          // Update existing link
          await db.user_social_links.update(
            {
              social_link,
              user_social_status,
              updated: new Date(),
            },
            {
              where: {
                id: existingLink.id,
              },
              transaction: t,
            }
          );
          return { ...link, action: "updated" };
        } else {
          // Create new link
          const newLink = await db.user_social_links.create(
            {
              user_id,
              social_type_id,
              social_link,
              user_social_status,
            },
            { transaction: t }
          );
          return { ...link, action: "created" };
        }
      });
      // Wait for all social link operations to complete
      socialLinksResults = await Promise.all(socialLinksPromises);
    }
    // Commit the transaction
    await t.commit();
    // Get updated user data with social links
    const updatedUser = await User.findOne({
      where: { id: user_id },
      include: [
        {
          model: db.user_social_links,
          as: "social_links",
          include: [
            {
              model: db.social_media_platforms,
              as: "social_platform",
              attributes: ["social_name", "social_icon"],
            },
          ],
        },
      ],
    });
    // Return response based on whether social links were updated
    if (social_links.length > 0) {
      return res.json({
        status: true,
        message: "User and social links updated successfully!",
        data: {
          user: updatedUser,
          socialLinksResults,
        },
      });
    } else {
      return res.json({
        status: true,
        message: "User updated successfully!",
        data: updatedUser,
      });
    }
  } catch (error) {
    // Rollback transaction on error
    await t.rollback();
    console.error("Update Error:", error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal server error",
    });
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
