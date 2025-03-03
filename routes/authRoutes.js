const express = require("express");
const router = express.Router();
const db = require("../models");
const jwt = require("jsonwebtoken");

// Configure environment variables
const GOOGLE_REDIRECT_URL = process.env.GOOGLE_CALLBACK_URL || "http://localhost:8000/auth/google/callback";
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

// Google Auth Route
router.get("/google", async (req, res) => {
  try {
    const { data, error } = await db.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: GOOGLE_REDIRECT_URL,
        scopes: 'email profile'
      }
    });

    if (error) throw error;

    res.redirect(data.url);
  } catch (error) {
    console.error("Google Auth Error:", error);
    res.status(500).json({
      status: false,
      message: "Authentication failed",
      error: error.message
    });
  }
});

// Google Auth Callback
router.get("/google/callback", async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({
        status: false,
        message: "No authorization code provided"
      });
    }

    // Exchange code for session
    const { data: authData, error: authError } = await db.supabase.auth.exchangeCodeForSession(code);

    if (authError) throw authError;

    // Get user data
    const { data: userData, error: userError } = await db.supabase.auth.getUser(authData.access_token);

    if (userError) throw userError;

    // Check if user exists in our database
    const { data: existingUser } = await db.User.findOne({
      email: userData.user.email
    });

    let user;
    if (!existingUser) {
      // Create new user if doesn't exist
      const { data: newUser } = await db.User.create({
        email: userData.user.email,
        first_name: userData.user.user_metadata.full_name.split(' ')[0],
        last_name: userData.user.user_metadata.full_name.split(' ').slice(1).join(' '),
        profile_image: userData.user.user_metadata.avatar_url,
        created: new Date()
      });
      user = newUser;
    } else {
      user = existingUser;
    }

    // Create JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);

  } catch (error) {
    console.error("Google Callback Error:", error);
    res.redirect(`${process.env.FRONTEND_URL}/auth/error`);
  }
});

// Logout Route
router.post("/logout", async (req, res) => {
  try {
    const { error } = await db.supabase.auth.signOut();
    
    if (error) throw error;

    res.json({
      status: true,
      message: "Logged out successfully"
    });
  } catch (error) {
    console.error("Logout Error:", error);
    res.status(500).json({
      status: false,
      message: "Logout failed",
      error: error.message
    });
  }
});

// Get current session
router.get("/session", async (req, res) => {
  try {
    const { data: { session }, error } = await db.supabase.auth.getSession();
    
    if (error) throw error;

    if (!session) {
      return res.status(401).json({
        status: false,
        message: "No active session"
      });
    }

    res.json({
      status: true,
      data: session
    });
  } catch (error) {
    console.error("Session Error:", error);
    res.status(500).json({
      status: false,
      message: "Failed to get session",
      error: error.message
    });
  }
});

module.exports = router;