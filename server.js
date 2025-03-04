var express = require("express");
var cors = require("cors");
var bodyParser = require("body-parser");
const passport = require("passport");
const session = require("express-session");
const db = require("./models");
require('dotenv').config();

// Import Google Auth Config
require("./config/auth");

var app = express();
var port = process.env.PORT || 8000;

// Middleware
app.use(bodyParser.json());
app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    'frontend-one-nu-27.vercel.app:3000'
  ],
  credentials: true
}));
app.use(bodyParser.urlencoded({ extended: false }));

// Session Middleware (Required for Passport)
app.use(
  session({
    secret: "your_secret_key",
    resave: false,
    saveUninitialized: true,
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Routes
var Users = require("./routes/Users");
var UserSaveProfile = require("./routes/User_Save_Profile");
var SocialMediaPlatforms = require("./routes/social_media_platforms");
var authRoutes = require("./routes/authRoutes"); // Import Auth Routes

// Health check endpoint for Vercel
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API routes
app.use("/api/users", Users);
app.use("/api/saved-profiles", UserSaveProfile);
app.use("/api/social-media-platforms", SocialMediaPlatforms);
app.use("/api/auth", authRoutes); // Google Auth Routes

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Only start the server if not running in Vercel
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, function () {
    console.log("Server is running on port: " + port);
  });
}

// Export the app for Vercel
module.exports = app;